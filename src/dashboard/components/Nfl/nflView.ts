import { normalizeTeamAbbr } from "../../utils/teamAssets";

// The NFL tab's three views, in ?view= (/nfl?view=live).
export type NflView = "games" | "live" | "standings";
export const NFL_VIEWS: NflView[] = ["games", "live", "standings"];

export const isNflView = (value: string | null | undefined): value is NflView =>
  !!value && (NFL_VIEWS as string[]).includes(value);

const etParts = (now: Date) => {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    weekday: "short",
    hour: "numeric",
    hourCycle: "h23",
  }).formatToParts(now);
  const get = (type: string) => parts.find((p) => p.type === type)?.value;
  return { weekday: get("weekday"), hour: Number(get("hour")) };
};

// Which view plain /nfl opens on (the user's rule, 2026-10-02): Live while
// any game is live (Thursday, Monday, Saturday, holidays), and from the
// Sunday 1 PM ET pick deadline through the end of Monday; Games the rest of
// the week. Standings never opens on its own.
export const defaultNflView = (now: Date, liveNow: boolean): NflView => {
  if (liveNow) return "live";
  const { weekday, hour } = etParts(now);
  if (weekday === "Sun" && hour >= 13) return "live";
  if (weekday === "Mon") return "live";
  return "games";
};

// A view picked by hand wins over the rule for the rest of the visit
// (sessionStorage, so a new visit gets the rule again).
const CHOICE_KEY = "nflView";

export const readNflChoice = (): NflView | null => {
  try {
    const stored = sessionStorage.getItem(CHOICE_KEY);
    return isNflView(stored) ? stored : null;
  } catch {
    return null;
  }
};

export const saveNflChoice = (view: NflView): void => {
  try {
    sessionStorage.setItem(CHOICE_KEY, view);
  } catch {
    // storage blocked -- the rule just applies next time
  }
};

// Team pages live at /nfl/teams/buf, by the app's normalized abbreviation
// (the KV feed's JAX/LA/WSH become jac/lar/was).
export const teamSlug = (abbr: string): string =>
  normalizeTeamAbbr(abbr).toLowerCase();

export const teamPath = (abbr: string): string =>
  `/nfl/teams/${teamSlug(abbr)}`;
