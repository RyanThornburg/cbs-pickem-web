import { RecapCoverStreak, RecapMove, RecapPerson, WeekRecap } from "../../types";

// Lookups for items shown in context: next to a player on User Picks, on a
// game on the Scoreboard, or next to a team on Games. Everything matches on
// ids (user_id, game_id, team id), never on names.

const findItem = (recap: WeekRecap | undefined, kind: string) =>
  recap?.items.find((t) => t.kind === kind);

// Every leaderboard move of 3+ places vs last week, by user id (as the
// string ids RankedUser uses).
export const moversByUserId = (recap: WeekRecap | undefined): Map<string, RecapMove> =>
  new Map((recap?.movers ?? []).map((m) => [String(m.user_id), m]));

// Players who went 5-0 this week.
export const perfectWeekUserIds = (recap: WeekRecap | undefined): Set<string> => {
  const users = (findItem(recap, "perfect_week")?.data.users ?? []) as RecapPerson[];
  return new Set(users.map((u) => String(u.user_id)));
};

// Every team on an active cover/miss streak of 3+, by team id.
export const coverStreaksByTeamId = (
  recap: WeekRecap | undefined
): Map<number, RecapCoverStreak> =>
  new Map((recap?.cover_streaks ?? []).map((s) => [s.team.id, s]));

export const coverStreakLabel = (streak: RecapCoverStreak): string =>
  streak.streak_type === "cover"
    ? `Covered ${streak.length} straight`
    : `Missed ${streak.length} straight`;

export type GameTagKind = "upset" | "flipped";

export interface GameTag {
  kind: GameTagKind;
  label: string;
  // Tooltip text.
  detail: string;
}

interface RecapGameTeam {
  abbr: string;
}

interface RecapGame {
  game_id: number;
  home_team: RecapGameTeam;
  away_team: RecapGameTeam;
  home_score: number;
  away_score: number;
  // Home team's line: negative = home favored.
  cbs_spread: number;
}

const fmtPoints = (n: number) => String(Math.abs(n));

// Game-level tags, by game id: the upset of the week, and games where the
// straight-up winner didn't cover.
export const gameTagsById = (recap: WeekRecap | undefined): Map<number, GameTag[]> => {
  const tags = new Map<number, GameTag[]>();
  const add = (gameId: number, tag: GameTag) => tags.set(gameId, [...(tags.get(gameId) ?? []), tag]);

  const upset = findItem(recap, "upset_of_week");
  if (upset && typeof upset.data.game_id === "number") {
    add(upset.data.game_id, { kind: "upset", label: "Upset of the week", detail: upset.headline });
  }

  const flipped = (findItem(recap, "spread_mattered")?.data.flipped_games ?? []) as (RecapGame & {
    winner: RecapGameTeam;
  })[];
  flipped.forEach((game) => {
    const margin = Math.abs(game.home_score - game.away_score);
    add(game.game_id, {
      kind: "flipped",
      label: "Won, didn't cover",
      detail: `${game.winner.abbr} won by ${margin} but was favored by ${fmtPoints(game.cbs_spread)}`,
    });
  });

  return tags;
};
