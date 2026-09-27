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

export type TaskHealth = "fresh" | "stale" | "failing" | "never" | "idle";

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
};

export const formatAgo = (iso: string | null, now: number): string => {
  const ms = toMs(iso);
  if (ms === null) return "never";
  const seconds = Math.max(0, Math.round((now - ms) / 1000));
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 48) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
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
