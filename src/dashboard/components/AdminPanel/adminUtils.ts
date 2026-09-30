// "Is this healthy" thresholds for the admin page -- display judgments kept
// on the frontend (like GamesCard's WEATHER_THRESHOLDS), separate from the
// data repo's own per-task `stale` limits.

// meta:admin is rewritten every minute; older than this means cron or the
// orchestrator has stopped and every other field is out of date too.
export const HEARTBEAT_STALE_MS = 5 * 60_000;

// A task is "failing" when its last attempt is newer than its last success.
// Needs slack: a normal successful run can stamp last_at a second or so after
// last_success_at (seen live on pregame_weather_capture). The shortest real
// interval is 60s, so one missed success always clears this.
export const FAILING_GAP_MS = 30_000;

// system_events never age out; one seen within this window counts as active.
export const EVENT_ACTIVE_MS = 24 * 60 * 60_000;

// For tasks that tick every minute but carry no data-side stale flag
// (scoring_plays_refresh, win_probability_capture): this long without a run
// means that task has stopped, even if the heartbeat is fine.
export const EVERY_MINUTE_STALE_MS = 10 * 60_000;

export type TaskHealth =
  "fresh" | "stale" | "failing" | "never" | "idle" | "done" | "missed";

const toMs = (iso: string | null): number | null =>
  iso ? new Date(iso).getTime() : null;

export const isFailing = (
  lastAt: string | null,
  lastSuccessAt: string | null
): boolean => {
  const attempt = toMs(lastAt);
  if (attempt === null) return false;
  const success = toMs(lastSuccessAt);
  return success === null || attempt - success > FAILING_GAP_MS;
};

// Watched tasks have a data-side stale flag; live-only tasks don't, so an old
// timestamp there is just "idle" (no game on), not a problem.
export const taskHealth = (
  lastAt: string | null,
  lastSuccessAt: string | null,
  stale: boolean | undefined
): TaskHealth => {
  if (lastAt === null && lastSuccessAt === null) return "never";
  if (isFailing(lastAt, lastSuccessAt)) return "failing";
  if (stale === undefined) return "idle";
  return stale ? "stale" : "fresh";
};

export const HEALTH_LABEL: Record<TaskHealth, string> = {
  fresh: "Fresh",
  stale: "Stale",
  failing: "Failing",
  never: "Never run",
  idle: "Live only",
  done: "Done",
  missed: "Missed",
};

export const HEALTH_COLOR: Record<
  TaskHealth,
  "success" | "warning" | "error" | "default"
> = {
  fresh: "success",
  stale: "warning",
  failing: "error",
  never: "warning",
  idle: "default",
  done: "success",
  missed: "error",
};

// Which health values are problems, and how bad. Everything else (fresh,
// done, and idle live-only tasks) is fine.
export const healthSeverity = (
  health: TaskHealth
): "error" | "warning" | null => {
  if (health === "failing" || health === "missed") return "error";
  if (health === "stale" || health === "never") return "warning";
  return null;
};

// Worst first, so the banner lists what needs attention in that order.
const PROBLEM_ORDER: TaskHealth[] = ["failing", "missed", "stale", "never"];

export type HealthSummary = {
  severity: "error" | "warning" | null;
  problems: { health: TaskHealth; count: number }[];
};

export const summarizeHealth = (healths: TaskHealth[]): HealthSummary => {
  const problems = PROBLEM_ORDER.map((health) => ({
    health,
    count: healths.filter((h) => h === health).length,
  })).filter(({ count }) => count > 0);
  const severities = problems.map(({ health }) => healthSeverity(health));
  const severity = severities.includes("error")
    ? "error"
    : severities.includes("warning")
      ? "warning"
      : null;
  return { severity, problems };
};

export const formatAgo = (iso: string | null, now: number): string => {
  const ms = toMs(iso);
  if (ms === null) return "never";
  // Truncate, not round -- 2h31m reads "2h ago", never overstating the age.
  const seconds = Math.max(0, Math.floor((now - ms) / 1000));
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 48) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
};

const ET_FORMAT = new Intl.DateTimeFormat("en-US", {
  timeZone: "America/New_York",
  weekday: "short",
  month: "numeric",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

export const formatEt = (iso: string | null): string =>
  iso ? `${ET_FORMAT.format(new Date(iso))} ET` : "—";

// The Sunday deadline sweep runs on the first tick after Sunday 1 PM ET. Allow
// a few minutes' slack before calling a missing run "missed".
const DEADLINE_SWEEP_ET_MINUTES = 13 * 60 + 5;

const ET_PARTS = new Intl.DateTimeFormat("en-US", {
  timeZone: "America/New_York",
  year: "numeric",
  month: "numeric",
  day: "numeric",
  weekday: "short",
  hour: "numeric",
  minute: "numeric",
  hourCycle: "h23",
});

// The Sunday (ET, "YYYY-MM-DD") whose sweep should have run by `now`: today
// once it's past 1:05 PM on a Sunday, otherwise the Sunday before.
export const dueDeadlineSunday = (now: number): string => {
  const parts = Object.fromEntries(
    ET_PARTS.formatToParts(new Date(now)).map((p) => [p.type, p.value])
  );
  const weekday = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(
    parts.weekday
  );
  const minutes = Number(parts.hour) * 60 + Number(parts.minute);
  const daysBack =
    weekday === 0 && minutes < DEADLINE_SWEEP_ET_MINUTES ? 7 : weekday;
  return new Date(
    Date.UTC(
      Number(parts.year),
      Number(parts.month) - 1,
      Number(parts.day) - daysBack
    )
  )
    .toISOString()
    .slice(0, 10);
};

// `lastSunday` is a bare "YYYY-MM-DD", so plain string comparison orders it.
export const deadlineSweepHealth = (
  lastSunday: string | null,
  now: number
): TaskHealth => {
  if (!lastSunday) return "never";
  return lastSunday < dueDeadlineSunday(now) ? "missed" : "done";
};

// Health for an every-minute task with no stale flag of its own.
export const everyMinuteHealth = (
  lastAt: string | null,
  lastSuccessAt: string | null,
  now: number
): TaskHealth => {
  const health = taskHealth(lastAt, lastSuccessAt, false);
  if (health !== "fresh") return health;
  const attempt = toMs(lastAt);
  return attempt !== null && now - attempt > EVERY_MINUTE_STALE_MS
    ? "stale"
    : "fresh";
};

// Whether a system event is still happening: the data repo's flag when it's
// there, otherwise last_seen_at within EVENT_ACTIVE_MS.
export const isEventActive = (
  event: { active?: boolean; last_seen_at: string },
  now: number
): boolean =>
  event.active ??
  now - new Date(event.last_seen_at).getTime() <= EVENT_ACTIVE_MS;

// Active failures for the card header: the data repo's active_count (which
// covers every row, not just `recent`) when present, else a count of recent.
export const activeEventCount = (
  summary: {
    active_count?: number;
    recent: { active?: boolean; last_seen_at: string }[];
  },
  now: number
): number =>
  summary.active_count ??
  summary.recent.filter((e) => isEventActive(e, now)).length;
