import {
  PickRecord,
  RankedUser,
  SeasonHistoryEntry,
  SpreadBucket,
  UserPickRecords,
  UserTeamRecord,
} from "../../types";

// Short labels for the spread chart, big favorites to big underdogs. The
// edges sit on 3 and 7, the most common NFL final margins.
export const SPREAD_BUCKET_LABELS: Record<
  SpreadBucket,
  { short: string; long: string }
> = {
  big_favorite: { short: "Fav 7+", long: "Favorites of 7 or more" },
  mid_favorite: { short: "Fav 3½–6½", long: "Favorites of 3½ to 6½" },
  small_favorite: { short: "Fav ≤3", long: "Favorites of 3 or less" },
  pickem: { short: "Pick'em", long: "Pick'em games" },
  small_underdog: { short: "Dog ≤3", long: "Underdogs of 3 or less" },
  mid_underdog: { short: "Dog 3½–6½", long: "Underdogs of 3½ to 6½" },
  big_underdog: { short: "Dog 7+", long: "Underdogs of 7 or more" },
};

// The season's graded picks, from the home and away splits (every pick is
// one or the other; favorite/underdog leave out pick'ems).
export const seasonRecord = (
  records: UserPickRecords | null | undefined
): { wins: number; losses: number } | null => {
  if (!records) return null;
  const wins = records.home.wins + records.away.wins;
  const losses = records.home.losses + records.away.losses;
  return wins + losses > 0 ? { wins, losses } : null;
};

export type Tone = "good" | "bad" | "neutral";

// Green from 60%, red at 40% or less, and only with enough graded picks to
// mean something; a 1-0 stays neutral.
export const TONE_MIN_GRADED = 3;
export const toneOf = (wins: number, losses: number): Tone => {
  const graded = wins + losses;
  if (graded < TONE_MIN_GRADED) return "neutral";
  const pct = wins / graded;
  if (pct >= 0.6) return "good";
  if (pct <= 0.4) return "bad";
  return "neutral";
};

export const recordTone = (record: PickRecord | undefined): Tone =>
  record ? toneOf(record.wins, record.losses) : "neutral";

// A team's games either way: picking them plus picking their opponent.
// Right either way means the player read that team correctly.
export const teamGamesRecord = (entry: UserTeamRecord | undefined) =>
  entry
    ? {
        wins: entry.picked.wins + entry.against.wins,
        losses: entry.picked.losses + entry.against.losses,
      }
    : { wins: 0, losses: 0 };

export interface PlayerWeek {
  week: number;
  user: RankedUser;
}

// The player's row in each loaded week, newest first. Weeks they weren't
// in the pool for are skipped.
export const playerWeeks = (
  weeks: Map<number, RankedUser[]>,
  userId: string
): PlayerWeek[] =>
  [...weeks.entries()]
    .map(([week, users]) => ({
      week,
      user: users.find((user) => user.id === userId),
    }))
    .filter((entry): entry is PlayerWeek => entry.user !== undefined)
    .sort((a, b) => b.week - a.week);

export interface FinishPoint {
  season: number;
  rank: number;
  // This season's place so far, not a final finish.
  current: boolean;
}

// Every closed season's finish, then this season's place so far.
export const finishPoints = (
  history: SeasonHistoryEntry[],
  currentSeason: number,
  currentPlace: number | undefined
): FinishPoint[] => {
  const closed = history
    .filter((entry) => entry.season !== currentSeason)
    .sort((a, b) => a.season - b.season)
    .map((entry) => ({
      season: entry.season,
      rank: entry.rank,
      current: false,
    }));
  return currentPlace
    ? [...closed, { season: currentSeason, rank: currentPlace, current: true }]
    : closed;
};
