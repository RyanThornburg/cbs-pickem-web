import { RankedUser } from "../types";

// The last good leaderboard for the few most recently browsed weeks, kept in
// localStorage so a leaderboard outage (or a reload during one) still shows
// the standings, the selected player and their money lines as of the last
// success, with User Picks saying how old they are. Picks are stored as
// loaded, so a pick hidden before kickoff stays hidden.
const KEY = "leaderboardCache";
const MAX_WEEKS = 3;

export interface CachedLeaderboard {
  season: number;
  week: number;
  // When it was fetched (ms since epoch).
  at: number;
  users: RankedUser[];
}

const readAll = (): CachedLeaderboard[] => {
  try {
    const parsed = JSON.parse(localStorage.getItem(KEY) ?? "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export function readCachedLeaderboard(
  season: number,
  week: number
): CachedLeaderboard | undefined {
  const hit = readAll().find(
    (entry) => entry.season === season && entry.week === week
  );
  return hit && Array.isArray(hit.users) && hit.users.length > 0
    ? hit
    : undefined;
}

export function writeCachedLeaderboard(entry: CachedLeaderboard) {
  if (entry.users.length === 0) return;
  const rest = readAll().filter(
    (other) => other.season !== entry.season || other.week !== entry.week
  );
  try {
    localStorage.setItem(
      KEY,
      JSON.stringify([entry, ...rest].slice(0, MAX_WEEKS))
    );
  } catch {
    // Storage full or blocked: the live poll still works without it.
  }
}
