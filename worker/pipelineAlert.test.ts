import { describe, it } from "vitest";
import assert from "node:assert/strict";
import {
  type AdminKey,
  type AlertState,
  checkPipeline,
  failingChecks,
  formatDuration,
  HEARTBEAT_MAX_MS,
  NO_ALERT,
  nextAlert,
  REMIND_EVERY_MS,
  STATE_KEY,
  TICKER_MAX_MS,
} from "./pipelineAlert.ts";
import { testEnv } from "./testHelpers.ts";

const NOW = Date.parse("2026-10-04T18:00:00Z");
const ago = (ms: number) => new Date(NOW - ms).toISOString();
const MIN = 60_000;

const healthyAdmin = (overrides: Partial<AdminKey> = {}): AdminKey => ({
  updated_at: ago(1 * MIN),
  last_run: {
    odds: { last_at: ago(MIN), last_success_at: ago(MIN), stale: false },
    housekeeping: { stale: false },
    game_snapshot_capture: { last_at: ago(MIN), last_success_at: ago(MIN) },
  },
  ...overrides,
});

const liveGames = (kickoffAgo: number) => ({
  games: [
    { status: "FINAL", game_time: ago(4 * 60 * MIN) },
    { status: "IN_PROGRESS", game_time: ago(kickoffAgo) },
  ],
});

describe("failingChecks", () => {
  it("passes a healthy pipeline", () => {
    assert.deepEqual(failingChecks(healthyAdmin(), null, NOW), []);
  });

  it("fails when meta:admin is missing, unparseable or stale", () => {
    const stopped = [
      "Pipeline stopped: meta:admin hasn't updated in 10+ minutes",
    ];
    assert.deepEqual(failingChecks(null, null, NOW), stopped);
    assert.deepEqual(
      failingChecks(healthyAdmin({ updated_at: "nope" }), null, NOW),
      stopped
    );
    assert.deepEqual(
      failingChecks(
        healthyAdmin({ updated_at: ago(HEARTBEAT_MAX_MS + 1) }),
        null,
        NOW
      ),
      stopped
    );
    assert.deepEqual(
      failingChecks(
        healthyAdmin({ updated_at: ago(HEARTBEAT_MAX_MS) }),
        null,
        NOW
      ),
      []
    );
  });

  it("skips the other checks while the heartbeat is stale", () => {
    const admin = healthyAdmin({
      updated_at: ago(30 * MIN),
      last_run: { odds: { stale: true } },
    });
    assert.equal(failingChecks(admin, liveGames(60 * MIN), NOW).length, 1);
  });

  it("lists stale tasks by name, sorted", () => {
    const admin = healthyAdmin({
      last_run: {
        recap_write: { stale: true },
        odds: { stale: true },
        housekeeping: { stale: false },
        game_snapshot_capture: null,
      },
    });
    assert.deepEqual(failingChecks(admin, null, NOW), [
      "Task stale: odds",
      "Task stale: recap_write",
    ]);
  });

  it("flags a quiet live ticker only while a game is live", () => {
    const quiet = healthyAdmin({
      last_run: {
        game_snapshot_capture: { last_success_at: ago(TICKER_MAX_MS + 1) },
      },
    });
    assert.deepEqual(failingChecks(quiet, liveGames(60 * MIN), NOW), [
      "Live ticker quiet during a game",
    ]);
    assert.deepEqual(
      failingChecks(quiet, { games: [{ status: "FINAL" }] }, NOW),
      []
    );
    assert.deepEqual(failingChecks(quiet, null, NOW), []);
    assert.deepEqual(
      failingChecks(healthyAdmin(), liveGames(60 * MIN), NOW),
      []
    );
  });

  it("gives the ticker until a few minutes after the first live kickoff", () => {
    const neverRan = healthyAdmin({ last_run: {} });
    assert.deepEqual(failingChecks(neverRan, liveGames(MIN), NOW), []);
    assert.deepEqual(
      failingChecks(neverRan, liveGames(TICKER_MAX_MS + 1), NOW),
      ["Live ticker quiet during a game"]
    );
  });
});

describe("nextAlert", () => {
  const down = ["Task stale: odds"];

  it("sends nothing while all clear", () => {
    const { email, state } = nextAlert(NO_ALERT, [], NOW);
    assert.equal(email, null);
    assert.equal(state, NO_ALERT);
  });

  it("sends one email when a check starts failing", () => {
    const { email, state } = nextAlert(NO_ALERT, down, NOW);
    assert.equal(email?.subject, "Pipeline down");
    assert.match(email?.text ?? "", /Task stale: odds/);
    assert.deepEqual(state, {
      failing: down,
      since: ago(0),
      last_sent: ago(0),
    });
  });

  it("stays quiet while the same checks keep failing", () => {
    const prev: AlertState = {
      failing: down,
      since: ago(60 * MIN),
      last_sent: ago(60 * MIN),
    };
    assert.equal(nextAlert(prev, down, NOW).email, null);
  });

  it("sends an update when the failing set changes, keeping since", () => {
    const prev: AlertState = {
      failing: down,
      since: ago(60 * MIN),
      last_sent: ago(60 * MIN),
    };
    const more = [...down, "Live ticker quiet during a game"];
    const { email, state } = nextAlert(prev, more, NOW);
    assert.equal(email?.subject, "Pipeline down: checks changed");
    assert.equal(state.since, prev.since);
  });

  it("reminds every few hours while still down", () => {
    const prev: AlertState = {
      failing: down,
      since: ago(REMIND_EVERY_MS),
      last_sent: ago(REMIND_EVERY_MS),
    };
    const { email, state } = nextAlert(prev, down, NOW);
    assert.equal(email?.subject, "Pipeline still down (6 h)");
    assert.equal(state.last_sent, ago(0));
  });

  it("sends a recovery with how long it was down", () => {
    const prev: AlertState = {
      failing: down,
      since: ago(95 * MIN),
      last_sent: ago(95 * MIN),
    };
    const { email, state } = nextAlert(prev, [], NOW);
    assert.equal(email?.subject, "Pipeline recovered");
    assert.match(email?.text ?? "", /after 1 h 35 min/);
    assert.deepEqual(state, { failing: [], since: null, last_sent: ago(0) });
  });
});

describe("formatDuration", () => {
  it("reads in minutes, then hours", () => {
    assert.equal(formatDuration(12 * MIN), "12 min");
    assert.equal(formatDuration(120 * MIN), "2 h");
    assert.equal(formatDuration(61 * MIN), "1 h 1 min");
  });
});

describe("checkPipeline", () => {
  const setup = (
    pickem: Record<string, unknown>,
    alert: Record<string, unknown> = {},
    { sendThrows = false } = {}
  ) => {
    const sent: { subject: string; to: unknown }[] = [];
    const puts: [string, unknown][] = [];
    const env = testEnv({
      ALERT_EMAIL: "me@example.com",
      PICKEM_KV: {
        get: async (key: string) => (key in pickem ? pickem[key] : null),
        put: async () => assert.fail("PICKEM_KV must stay read-only"),
      },
      ALERT_KV: {
        get: async (key: string) => (key in alert ? alert[key] : null),
        put: async (key: string, value: string) => {
          puts.push([key, JSON.parse(value)]);
        },
      },
      EMAIL: {
        send: async (message: { subject: string; to: unknown }) => {
          if (sendThrows) throw new Error("send failed");
          sent.push(message);
          return { messageId: "m1" };
        },
      },
    });
    return { run: () => checkPipeline(env, NOW), sent, puts };
  };

  it("emails and saves state when the pipeline stops", async () => {
    const { run, sent, puts } = setup({});
    await run();
    assert.deepEqual(
      sent.map((m) => [m.subject, m.to]),
      [["Pipeline down", "me@example.com"]]
    );
    assert.equal(puts.length, 1);
    assert.equal(puts[0][0], STATE_KEY);
  });

  it("reads the current week's games for the ticker check", async () => {
    const { run, sent } = setup({
      "meta:admin": healthyAdmin({ last_run: {} }),
      "meta:current": { season: 2026, current_week: 5 },
      "week:2026:05:games": liveGames(60 * MIN),
    });
    await run();
    assert.equal(sent.length, 1);
  });

  it("does nothing while healthy", async () => {
    const { run, sent, puts } = setup({ "meta:admin": healthyAdmin() });
    await run();
    assert.equal(sent.length, 0);
    assert.equal(puts.length, 0);
  });

  it("doesn't save state when the email fails, so the next run retries", async () => {
    const { run, puts } = setup({}, {}, { sendThrows: true });
    await assert.rejects(run());
    assert.equal(puts.length, 0);
  });
});
