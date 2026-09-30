import { RecapItem } from "../../types";

// How many items the strip rotates through. The list is already ranked,
// so this is just the top of it.
export const STRIP_SIZE = 8;

// Unseen items first, then ones this viewer has already seen, each group
// keeping the data's rank order.
export const orderForRotation = (
  items: RecapItem[],
  seen: Set<string>
): RecapItem[] => {
  const top = items.slice(0, STRIP_SIZE);
  return [
    ...top.filter((t) => !seen.has(t.id)),
    ...top.filter((t) => seen.has(t.id)),
  ];
};

// Seen ids are kept per week: a season item like
// "pool_split:side:away" keeps its id week to week but its numbers change,
// so it should count as new again next week. Only the most recent weeks are
// kept so storage doesn't grow all season.
const SEEN_STORAGE_KEY = "recapSeen";
const SEEN_WEEKS_KEPT = 4;

type SeenStore = Record<string, string[]>;

const weekKey = (season: number, week: number) =>
  `${season}:${String(week).padStart(2, "0")}`;

const readStore = (): SeenStore => {
  try {
    const raw = localStorage.getItem(SEEN_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
};

export const getSeenItems = (season: number, week: number): Set<string> =>
  new Set(readStore()[weekKey(season, week)] ?? []);

export const markItemSeen = (
  season: number,
  week: number,
  id: string
): void => {
  const store = readStore();
  const key = weekKey(season, week);
  const ids = new Set(store[key] ?? []);
  if (ids.has(id)) return;
  ids.add(id);
  store[key] = Array.from(ids);
  const pruned = Object.fromEntries(
    Object.entries(store)
      .sort(([a], [b]) => b.localeCompare(a))
      .slice(0, SEEN_WEEKS_KEPT)
  );
  try {
    localStorage.setItem(SEEN_STORAGE_KEY, JSON.stringify(pruned));
  } catch {
    // Storage unavailable: rotation just won't favor unseen items.
  }
};
