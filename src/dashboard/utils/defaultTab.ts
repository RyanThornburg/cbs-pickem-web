export type PrimaryTab = "picks" | "nfl" | "trends";

export const VALID_TABS: PrimaryTab[] = ["picks", "nfl", "trends"];

export const isPrimaryTab = (value: string | undefined): value is PrimaryTab =>
  !!value && (VALID_TABS as string[]).includes(value);

// Games and Scoreboard were their own tabs until 2026-10-02, when they
// became two views of the NFL tab. Old links (/games, /scoreboard) and a
// stored last tab of either land on the matching view.
export const LEGACY_NFL_TABS: Record<string, "games" | "live"> = {
  games: "games",
  scoreboard: "live",
};

// Admin-only tab: a real route (/admin, bookmarked -- Cloudflare Access guards
// it) but deliberately not a PrimaryTab, so it's never persisted as the
// last-visited tab or picked as anyone's landing tab.
export const ADMIN_TAB = "admin";

// All-time records: a real, public route (/records), but also not a
// PrimaryTab -- it isn't weekly data, so it's never saved as the landing tab.
export const RECORDS_TAB = "records";

// Player pages (/players/:id; plain /players is the selected player's, the
// "You" tab). Not a landing tab either.
export const PLAYERS_TAB = "players";

export type AppTab =
  PrimaryTab | typeof ADMIN_TAB | typeof RECORDS_TAB | typeof PLAYERS_TAB;

const ACTIVE_TAB_STORAGE_KEY = "activeTab";
const COLD_START_TAB: PrimaryTab = "picks";

// A manual tab choice always wins for that visit and persists across visits
// too -- reopening the app lands on whichever tab you were on last. Only a
// true cold start (nothing stored yet, e.g. a brand-new visitor) falls back
// to User Picks.
export const getInitialTab = (): PrimaryTab => {
  try {
    const stored = localStorage.getItem(ACTIVE_TAB_STORAGE_KEY) ?? undefined;
    if (isPrimaryTab(stored)) return stored;
    if (stored && stored in LEGACY_NFL_TABS) return "nfl";
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
