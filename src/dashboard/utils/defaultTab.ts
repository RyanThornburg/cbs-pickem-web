export type PrimaryTab = "picks" | "games" | "scoreboard" | "trends";

export const VALID_TABS: PrimaryTab[] = ["picks", "games", "scoreboard", "trends"];

export const isPrimaryTab = (value: string | undefined): value is PrimaryTab =>
  !!value && (VALID_TABS as string[]).includes(value);

const ACTIVE_TAB_STORAGE_KEY = "activeTab";
const COLD_START_TAB: PrimaryTab = "picks";

// A manual tab choice always wins for that visit and persists across visits
// too -- reopening the app lands on whichever tab you were on last. Only a
// true cold start (nothing stored yet, e.g. a brand-new visitor) falls back
// to User Picks.
export const getInitialTab = (): PrimaryTab => {
  try {
    const stored = localStorage.getItem(ACTIVE_TAB_STORAGE_KEY);
    if (isPrimaryTab(stored ?? undefined)) return stored as PrimaryTab;
  } catch {
    // localStorage can throw (private browsing, blocked storage) -- fall
    // through to the cold-start default rather than crash the app over it.
  }
  return COLD_START_TAB;
};

export const setStoredTab = (tab: PrimaryTab): void => {
  try {
    localStorage.setItem(ACTIVE_TAB_STORAGE_KEY, tab);
  } catch {
    // Storage not available -- nothing to persist, not fatal.
  }
};
