// Emails the admin when the data pipeline stops. Runs on the Worker's cron
// trigger (wrangler.jsonc) and reads the pipeline's own heartbeat:
// orchestration rewrites meta:admin every minute, all year, so an old
// updated_at means the whole pipeline stopped. Spec from the data repo:
// https://claude.ai/artifact/6bKjZekJCx6BWa2jaYCD7C
//
// PICKEM_KV is only read. What was last sent lives in its own namespace
// (ALERT_KV), so one email goes out per change instead of one per run.

export const HEARTBEAT_MAX_MS = 10 * 60_000;
export const TICKER_MAX_MS = 3 * 60_000;
export const REMIND_EVERY_MS = 6 * 60 * 60_000; // 0 for no reminders
const LIVE_STATUSES = ["IN_PROGRESS", "HALFTIME", "DELAYED"];
export const STATE_KEY = "pipeline";
const FROM = {
  name: "Morlocked pipeline",
  email: "alerts@morlocked.rattsnest.com",
};
const ADMIN_URL = "https://morlocked.rattsnest.com/admin";

interface TaskRun {
  last_at?: string | null;
  last_success_at?: string | null;
  stale?: boolean;
}

export interface AdminKey {
  updated_at?: string | null;
  last_run?: Record<string, TaskRun | null>;
}

export interface GamesKey {
  games?: { status?: string; game_time?: string }[];
}

export interface AlertState {
  failing: string[];
  since: string | null;
  last_sent: string | null;
}

export const NO_ALERT: AlertState = {
  failing: [],
  since: null,
  last_sent: null,
};

const toMs = (iso: string | null | undefined): number | null => {
  if (!iso) return null;
  const ms = Date.parse(iso);
  return Number.isNaN(ms) ? null : ms;
};

// Each failing check as one line of the email. `games` is the current week's
// games key, or null when it (or meta:current) couldn't be read.
export function failingChecks(
  admin: AdminKey | null,
  games: GamesKey | null,
  now: number
): string[] {
  const updatedAt = toMs(admin?.updated_at);
  if (!admin || updatedAt === null || now - updatedAt > HEARTBEAT_MAX_MS) {
    // A frozen key's task flags are frozen too, so nothing else is checked.
    return ["Pipeline stopped: meta:admin hasn't updated in 10+ minutes"];
  }

  const lastRun = admin.last_run ?? {};
  const failing = Object.entries(lastRun)
    .filter(([, run]) => run?.stale === true)
    .map(([task]) => `Task stale: ${task}`)
    .sort();

  // The live scoreboard is its own 15-second cron line, so it can die while
  // orchestration keeps going. Counted from the first live kickoff, so a
  // game that just went live doesn't trip it before the ticker's first run.
  const liveKickoffs = (games?.games ?? [])
    .filter((game) => LIVE_STATUSES.includes(game.status ?? ""))
    .map((game) => toMs(game.game_time) ?? 0);
  if (liveKickoffs.length > 0) {
    const since = Math.max(
      toMs(lastRun.game_snapshot_capture?.last_success_at) ?? 0,
      Math.min(...liveKickoffs)
    );
    if (now - since > TICKER_MAX_MS) {
      failing.push("Live ticker quiet during a game");
    }
  }
  return failing;
}

export interface AlertEmail {
  subject: string;
  text: string;
}

// What to send this run, if anything, and the state to keep for next time.
export function nextAlert(
  prev: AlertState,
  failing: string[],
  now: number
): { email: AlertEmail | null; state: AlertState } {
  const nowIso = new Date(now).toISOString();
  const changed = failing.join("\n") !== prev.failing.join("\n");
  const lastSent = toMs(prev.last_sent);
  const remind =
    failing.length > 0 &&
    REMIND_EVERY_MS > 0 &&
    (lastSent === null || now - lastSent >= REMIND_EVERY_MS);
  if (!changed && !remind) return { email: null, state: prev };

  const state: AlertState = {
    failing,
    since: failing.length ? (prev.since ?? nowIso) : null,
    last_sent: nowIso,
  };

  if (failing.length === 0) {
    const since = toMs(prev.since);
    const down = since === null ? "" : ` after ${formatDuration(now - since)}`;
    return {
      email: {
        subject: "Pipeline recovered",
        text: `Everything is passing again${down}.\n\n${ADMIN_URL}`,
      },
      state,
    };
  }

  const subject = prev.failing.length
    ? changed
      ? "Pipeline down: checks changed"
      : `Pipeline still down (${formatDuration(now - (toMs(prev.since) ?? now))})`
    : "Pipeline down";
  return {
    email: {
      subject,
      text: `${failing.join("\n")}\n\n${ADMIN_URL}`,
    },
    state,
  };
}

export function formatDuration(ms: number): string {
  const minutes = Math.max(0, Math.round(ms / 60_000));
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest ? `${hours} h ${rest} min` : `${hours} h`;
}

export async function checkPipeline(env: Env, now = Date.now()): Promise<void> {
  const admin = await env.PICKEM_KV.get<AdminKey>("meta:admin", "json");
  const games = await currentWeekGames(env);
  const failing = failingChecks(admin, games, now);

  const prev =
    (await env.ALERT_KV.get<AlertState>(STATE_KEY, "json")) ?? NO_ALERT;
  const { email, state } = nextAlert(prev, failing, now);
  if (!email) return;

  // Send first: if it throws, the state isn't saved and the next run retries.
  await env.EMAIL.send({
    from: FROM,
    to: env.ALERT_EMAIL,
    subject: email.subject,
    text: email.text,
  });
  await env.ALERT_KV.put(STATE_KEY, JSON.stringify(state));
  console.log(
    JSON.stringify({ message: "pipeline alert sent", subject: email.subject })
  );
}

async function currentWeekGames(env: Env): Promise<GamesKey | null> {
  const meta = await env.PICKEM_KV.get<{
    season?: number;
    current_week?: number;
  }>("meta:current", "json");
  if (!meta?.season || !meta.current_week) return null;
  const week = String(meta.current_week).padStart(2, "0");
  return env.PICKEM_KV.get<GamesKey>(
    `week:${meta.season}:${week}:games`,
    "json"
  );
}
