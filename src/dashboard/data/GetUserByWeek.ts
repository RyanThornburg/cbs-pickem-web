import { fetchJson, pollAsync } from "../../api/pickemApi";
import {
  GameStatus,
  PayPeriod,
  RankedUser,
  UserPeriodStanding,
  UserPick,
} from "../types";
import { OVERALL_KEY, shownSegment } from "../utils/payPeriods";
import {
  ApiGame,
  buildGamesById,
  fetchWeekGames,
  findEarliestGame,
  toTeam,
} from "./weekGames";

const POLL_INTERVAL_MS = 60_000;
const REQUIRED_PICKS_PER_WEEK = 5;

interface ApiLeaderboardPick {
  game_id: number;
  team_id: number;
  is_correct: boolean | null;
  trending_status?: string;
}

interface ApiLeaderboardUser {
  user_id: number;
  name: string;
  weekly_score: number;
  trending_score: number;
  cumulative_score: number;
  place: number;
  periods: Record<string, UserPeriodStanding>;
  has_submitted_picks?: boolean;
  picks: ApiLeaderboardPick[];
}

interface ApiLeaderboardResponse {
  week: number;
  periods: PayPeriod[];
  users: ApiLeaderboardUser[];
}

const fetchLeaderboard = (
  season: number,
  week: number
): Promise<ApiLeaderboardResponse> =>
  fetchJson<ApiLeaderboardResponse>(`/api/weeks/${season}/${week}/leaderboard`);

// The API's own places (overall and per period) rank on graded points alone
// and don't account for trending_score -- but the score shown in the UI is
// cumulative_score + trending_score (the User Picks table and the leader cards), so a user
// with a trending bonus can display the same total as 1st place while the API
// ranks them lower. Re-rank client-side against the score actually displayed,
// using standard competition ranking (ties share a rank; the next rank skips
// accordingly), matching the pre-migration Firebase implementation.
const rankByScore = (
  users: ApiLeaderboardUser[],
  scoreOf: (user: ApiLeaderboardUser) => number | null
): Map<number, number | null> => {
  const ranked = users
    .map((user) => ({ user_id: user.user_id, score: scoreOf(user) }))
    .filter(
      (entry): entry is { user_id: number; score: number } =>
        entry.score !== null
    )
    .sort((a, b) => b.score - a.score);

  const ranks = new Map<number, number | null>();
  let rank = 0;
  let prevScore: number | null = null;
  ranked.forEach(({ user_id, score }, index) => {
    if (score !== prevScore) {
      rank = index + 1;
      prevScore = score;
    }
    ranks.set(user_id, rank);
  });

  return ranks;
};

// Overall place, then the shown segment's place (players tied overall),
// then name.
const compareUsers =
  (segmentKey: string | undefined) =>
  (a: RankedUser, b: RankedUser): number => {
    if (a.place !== b.place) {
      return a.place - b.place;
    }

    if (segmentKey) {
      const aSegment = a.periods[segmentKey]?.place ?? 0;
      const bSegment = b.periods[segmentKey]?.place ?? 0;
      if (aSegment !== bSegment) {
        return aSegment - bSegment;
      }
    }

    return a.name.toUpperCase().localeCompare(b.name.toUpperCase());
  };

// Picks lock and reveal together for the whole week (at the first kickoff), not
// game-by-game -- otherwise someone with an early bye-week-ish game still shows TBD
// for it after everyone's picks are already public. The kickoff time counts as
// well as the game's status: the feed can keep a game SCHEDULED for several
// minutes after kickoff (seen live on 2026-10-01's Thursday game, while the
// leaderboard already carried its picks), the same rule as the Scoreboard's
// picksRevealed.
export const isWeekLocked = (
  games: ApiGame[],
  now: number = Date.now()
): boolean => {
  const earliest = findEarliestGame(games);
  return (
    earliest !== undefined &&
    (earliest.status !== GameStatus.Scheduled ||
      now >= Date.parse(earliest.game_time))
  );
};

const joinPick = (
  pick: ApiLeaderboardPick,
  gamesById: Map<number, ApiGame>,
  weekLocked: boolean
): UserPick => {
  const game = gamesById.get(pick.game_id);
  const homeTeam = game && toTeam(game.home_team);
  const awayTeam = game && toTeam(game.away_team);
  const team =
    homeTeam?.id === pick.team_id
      ? homeTeam.abbr
      : awayTeam?.id === pick.team_id
        ? awayTeam.abbr
        : "";
  const game_status = (game?.status as GameStatus) ?? GameStatus.Scheduled;
  // cbs_spread is the home team's line; the away side gets the mirror.
  const homeLine = game?.cbs_spread;
  const line =
    homeLine == null || !team
      ? undefined
      : homeTeam?.id === pick.team_id
        ? homeLine
        : -homeLine;

  return {
    game_id: pick.game_id,
    team,
    is_correct: pick.is_correct,
    trending_status: pick.trending_status,
    game_status,
    visible: weekLocked,
    ...(line === undefined ? {} : { line: line === 0 ? 0 : line }),
  };
};

// A pick only means something once its game has started (team + correctness are
// otherwise unknowable), so we drop not-yet-visible picks here rather than carry
// around a "hidden" entry that looks identical to a failed game lookup. Padding
// back up to five TBD placeholders is gated on has_submitted_picks (CBS's own
// submission flag) -- the per-game detail can lag the submission itself (seen
// live: has_submitted_picks true with picks: []), and without padding a
// submitted-but-not-yet-joined user would look identical to someone who simply
// hasn't picked yet.
//
// has_submitted_picks is missing entirely from some weeks' leaderboard payload
// (confirmed live on week 2 -- not just false, absent), so treat it as unknown
// rather than "not submitted" whenever real picks already joined: never
// discard picks we actually have. Only fall back to zero slots when there's
// nothing to show AND the flag isn't affirmatively true.
const tbdPlaceholder = (index: number): UserPick => ({
  game_id: -1 - index,
  team: "",
  is_correct: null,
  game_status: GameStatus.Scheduled,
  visible: false,
});

const withTbdPlaceholders = (
  visiblePicks: UserPick[],
  hasSubmittedPicks: boolean | undefined
): UserPick[] => {
  if (visiblePicks.length === 0 && !hasSubmittedPicks) return [];

  const missing = hasSubmittedPicks
    ? Math.max(0, REQUIRED_PICKS_PER_WEEK - visiblePicks.length)
    : 0;
  return [
    ...visiblePicks,
    ...Array.from({ length: missing }, (_, i) => tbdPlaceholder(i)),
  ];
};

const toRankedUser = (
  user: ApiLeaderboardUser,
  gamesById: Map<number, ApiGame>,
  weekLocked: boolean,
  periods: PayPeriod[],
  ranks: Map<string, Map<number, number | null>>
): RankedUser => {
  const visiblePicks = user.picks
    .map((pick) => joinPick(pick, gamesById, weekLocked))
    .filter((pick) => pick.visible);

  return {
    id: String(user.user_id),
    name: user.name,
    weekly_score: user.weekly_score,
    trending_score: user.trending_score,
    cumulative_score: user.cumulative_score,
    place: ranks.get(OVERALL_KEY)?.get(user.user_id) ?? user.place,
    periods: Object.fromEntries(
      periods.map((period) => {
        const api = user.periods?.[period.key];
        const place = ranks.get(period.key)?.get(user.user_id) ?? null;
        return [
          period.key,
          {
            score: api?.score ?? null,
            place,
            in_money: place != null && place <= period.paid_places,
            last_place_eligible: api?.last_place_eligible ?? null,
            in_money_last_place: api?.in_money_last_place ?? false,
          },
        ];
      })
    ),
    picks: withTbdPlaceholders(visiblePicks, user.has_submitted_picks),
    has_submitted_picks: user.has_submitted_picks,
  };
};

// One fetch of a week's standings and picks, ranked and joined. Polled by
// GetUserByWeek; the player page loads past weeks with it once.
export const loadUsersByWeek = async (
  season: number,
  week: number
): Promise<RankedUser[]> => {
  const [leaderboard, weekGames] = await Promise.all([
    fetchLeaderboard(season, week),
    fetchWeekGames(season, week),
  ]);

  const gamesById = buildGamesById(weekGames.games);
  const weekLocked = isWeekLocked(weekGames.games);
  const periods = leaderboard.periods ?? [];
  // The live bonus belongs to this leaderboard's week, so it only counts
  // toward periods that include it (not a finished 1st half, say).
  const ranks = new Map<string, Map<number, number | null>>([
    [
      OVERALL_KEY,
      rankByScore(
        leaderboard.users,
        (user) => user.cumulative_score + user.trending_score
      ),
    ],
  ]);
  periods
    .filter((period) => period.key !== OVERALL_KEY)
    .forEach((period) => {
      const inPeriod =
        leaderboard.week >= period.start_week &&
        leaderboard.week <= (period.end_week ?? Infinity);
      ranks.set(
        period.key,
        rankByScore(leaderboard.users, (user) => {
          const score = user.periods?.[period.key]?.score;
          if (score == null) return null;
          return inPeriod ? score + user.trending_score : score;
        })
      );
    });
  const segment = shownSegment(periods, leaderboard.week);
  return leaderboard.users
    .map((user) => toRankedUser(user, gamesById, weekLocked, periods, ranks))
    .sort(compareUsers(segment?.key));
};

export const GetUserByWeek = (
  season: number,
  week: number,
  callback: (users: RankedUser[]) => void,
  onError?: (error: Error) => void
) => {
  if (season === 0 || week === 0) {
    callback([]);
    return;
  }

  const load = () => loadUsersByWeek(season, week);

  return pollAsync(load, POLL_INTERVAL_MS, callback, (error) => {
    console.error("Failed to fetch week leaderboard", error);
    onError?.(error);
  });
};
