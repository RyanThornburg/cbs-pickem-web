import { Game, GameStatus, Possession } from "../../../types";

// When a live game gets a highlighted border -- frontend display config, same
// reasoning as GamesCard's WEATHER_THRESHOLDS (a judgment call likely to be
// retuned, so it lives here rather than in the data pipeline).
export const CLOSE_GAME = {
  // "Close" only counts from this quarter on -- a 3-point cover margin in
  // the 1st quarter isn't worth flagging.
  minQuarter: 3,
  // Cover flips on a swing of this many points or fewer (one score).
  maxSwingPts: 7,
  // "Close and ending": under this much time left in the 4th, or any OT.
  endingSeconds: 5 * 60,
};

export type Side = "home" | "away";

export const isLiveStatus = (status: GameStatus): boolean =>
  status === GameStatus.Inprogress ||
  status === GameStatus.Halftime ||
  status === GameStatus.Delayed;

export const hasStarted = (game: Game): boolean =>
  game.status !== GameStatus.Scheduled;

export interface CoverState {
  // home_score + cbs_spread - away_score: > 0 home covering, < 0 away
  margin: number;
  side: Side | null; // null on a push
  by: number;
}

// cbs_spread is the home team's line (negative = home favored), the line the
// pool is graded against. Same formula as weekGames' getGameCoverResult.
export const getCover = (game: Game): CoverState | null => {
  if (!hasStarted(game) || game.cbs_spread == null) return null;
  const margin = game.home_score + game.cbs_spread - game.away_score;
  return {
    margin,
    side: margin > 0 ? "home" : margin < 0 ? "away" : null,
    by: Math.abs(margin),
  };
};

// Points the trailing side needs to take the cover: half-point lines flip on
// the next whole point; whole-number lines push first, so it takes one more.
export const swingToFlip = (by: number): number =>
  Number.isInteger(by) ? by + 1 : Math.ceil(by);

const clockSeconds = (clock?: string): number => {
  const [min, sec] = (clock ?? "").split(":").map(Number);
  return (min || 0) * 60 + (sec || 0);
};

export interface GameHighlight {
  close: boolean;
  ending: boolean;
  redZone: boolean;
}

// Only IN_PROGRESS games get highlighted -- halftime/delayed have no clock
// running and no ball spot worth flagging.
export const getGameHighlight = (game: Game): GameHighlight => {
  const none = { close: false, ending: false, redZone: false };
  if (game.status !== GameStatus.Inprogress || !game.live) return none;

  const { quarter = 0, time_remaining, is_red_zone } = game.live;
  const cover = getCover(game);
  const close =
    !!cover &&
    quarter >= CLOSE_GAME.minQuarter &&
    (cover.side === null || swingToFlip(cover.by) <= CLOSE_GAME.maxSwingPts);
  const ending =
    close &&
    (quarter > 4 ||
      (quarter === 4 &&
        clockSeconds(time_remaining) <= CLOSE_GAME.endingSeconds));

  return { close, ending, redZone: !!is_red_zone };
};

// One border per game: close (or close-and-ending) wins over red zone -- the
// red zone still shows as its own badge.
export type HighlightBorder = "ending" | "close" | "redZone" | null;

export const highlightBorder = (h: GameHighlight): HighlightBorder =>
  h.ending ? "ending" : h.close ? "close" : h.redZone ? "redZone" : null;

export type PickState =
  "notStarted" | "covering" | "notCovering" | "push" | "won" | "lost";

// Which side of this game a user picked, if any.
export const userPickSide = (game: Game, userId?: string): Side | null => {
  if (!userId) return null;
  if (game.picks.home.some((u) => u.id === userId)) return "home";
  if (game.picks.away.some((u) => u.id === userId)) return "away";
  return null;
};

export const getPickState = (game: Game, side: Side): PickState => {
  const cover = getCover(game);
  if (!cover) return "notStarted";
  if (cover.side === null) return "push";
  const ok = cover.side === side;
  if (game.status === GameStatus.Final) return ok ? "won" : "lost";
  return ok ? "covering" : "notCovering";
};

// The spread from one side's point of view: "+2.5", "−3", "PK".
export const sideLine = (game: Game, side: Side): string => {
  if (game.cbs_spread == null) return "";
  const value = side === "home" ? game.cbs_spread : -game.cbs_spread;
  if (value === 0) return "PK";
  return `${value < 0 ? "−" : "+"}${Math.abs(value)}`;
};

export const hasBall = (game: Game, side: Side): boolean =>
  game.status === GameStatus.Inprogress &&
  game.live?.possession ===
    (side === "home" ? Possession.Home : Possession.Away);

export interface BallSpot {
  // Percent across a field drawn with the AWAY end zone on the left (the away
  // team is listed first everywhere on the scoreboard).
  ballPct: number;
  firstDownPct: number | null;
  label: string;
  // Where the current drive began, same scale as ballPct -- only from the
  // feed's drive_start, never derived from drive_text's net yards (penalties
  // would put it in the wrong place).
  driveStartPct: number | null;
  driveStartLabel: string | null;
}

// From the home goal line (yard_line) when the feed has it; before the
// pipeline deploy, falls back to parsing "4th & 7 at MIN 37".
export const getBallSpot = (game: Game): BallSpot | null => {
  const live = game.live;
  if (game.status !== GameStatus.Inprogress || !live) return null;

  let yardsFromHomeGoal: number | null = null;
  let label = "";
  let driveStartPct: number | null = null;
  let driveStartLabel: string | null = null;
  if (live.yard_line != null && live.possession_text) {
    yardsFromHomeGoal = live.yard_line;
    label = live.possession_text;
    if (live.drive_start?.yard_line != null) {
      driveStartPct = 100 - live.drive_start.yard_line;
      driveStartLabel = live.drive_start.text;
    }
  } else {
    const match = /at (\w+) (\d+)/.exec(live.down_distance_text ?? "");
    if (match) {
      const [, team, yards] = match;
      yardsFromHomeGoal =
        team === game.home_team.abbr ? Number(yards) : 100 - Number(yards);
      label = `${team} ${yards}`;
    }
  }
  if (yardsFromHomeGoal == null) return null;

  const ballPct = 100 - yardsFromHomeGoal;
  // Home drives toward the away goal (left, lower pct); away drives right.
  const direction = live.possession === Possession.Home ? -1 : 1;
  const firstDownPct =
    live.down && live.down > 0 && live.distance
      ? Math.min(100, Math.max(0, ballPct + direction * live.distance))
      : null;

  return { ballPct, firstDownPct, label, driveStartPct, driveStartLabel };
};

// "Q3 11:07", "OT 4:12", "Halftime", "Final", "Final/OT".
export const statusLabel = (game: Game): string => {
  switch (game.status) {
    case GameStatus.Final:
      return game.linescore?.home.ot != null ? "Final/OT" : "Final";
    case GameStatus.Halftime:
      return "Halftime";
    case GameStatus.Delayed:
      return "Delayed";
    case GameStatus.Inprogress: {
      const quarter = game.live?.quarter ?? 0;
      const period = quarter > 4 ? "OT" : `Q${quarter}`;
      return `${period} ${game.live?.time_remaining ?? ""}`.trim();
    }
    default:
      return "";
  }
};

export type ScoreboardGroup = "Your picks" | "Live" | "Upcoming" | "Final";

const STATUS_ORDER = (game: Game): number =>
  isLiveStatus(game.status) ? 0 : game.status === GameStatus.Scheduled ? 1 : 2;

const byStatusThenKickoff = (a: Game, b: Game) =>
  STATUS_ORDER(a) - STATUS_ORDER(b) ||
  a.game_time - b.game_time ||
  a.game_id - b.game_id;

// Fixed order, never re-sorted by how close a game is: people learn where to
// look. Live, then upcoming, then final -- each by kickoff time.
// `pinUserId` ("My picks first"): that user's games come out into one
// "Your picks" list on top, in the same order, and the standard groups follow
// without them.
export const groupGames = (
  games: Game[],
  pinUserId?: string
): { group: ScoreboardGroup; games: Game[] }[] => {
  const pinned = pinUserId
    ? games.filter((g) => userPickSide(g, pinUserId) !== null)
    : [];
  const rest = games.filter((g) => !pinned.includes(g));
  const groups: { group: ScoreboardGroup; games: Game[] }[] = [
    { group: "Your picks", games: pinned },
    { group: "Live", games: rest.filter((g) => isLiveStatus(g.status)) },
    {
      group: "Upcoming",
      games: rest.filter((g) => g.status === GameStatus.Scheduled),
    },
    {
      group: "Final",
      games: rest.filter((g) => g.status === GameStatus.Final),
    },
  ];
  return groups
    .map(({ group, games }) => ({
      group,
      games: [...games].sort(byStatusThenKickoff),
    }))
    .filter(({ games }) => games.length > 0);
};
