import {
  activeEventCount,
  deadlineSweepHealth,
  EVERY_MINUTE_STALE_MS,
  everyMinuteHealth,
  dueDeadlineSunday,
  FAILING_GAP_MS,
  formatAgo,
  healthSeverity,
  isEventActive,
  isFailing,
  summarizeHealth,
  taskHealth,
} from "./adminUtils";

const T = "2026-09-27T17:00:00.000Z";
const plus = (iso: string, ms: number) =>
  new Date(Date.parse(iso) + ms).toISOString();

describe("isFailing", () => {
  it("is false when the last attempt succeeded, even stamped a second later", () => {
    expect(isFailing(T, T)).toBe(false);
    expect(isFailing(plus(T, 1_000), T)).toBe(false);
    expect(isFailing(plus(T, FAILING_GAP_MS), T)).toBe(false);
  });

  it("is true once the last attempt is more than the gap past the last success", () => {
    expect(isFailing(plus(T, FAILING_GAP_MS + 1), T)).toBe(true);
    expect(isFailing(plus(T, 60_000), T)).toBe(true);
  });

  it("is true for attempts that never succeeded, false for never run", () => {
    expect(isFailing(T, null)).toBe(true);
    expect(isFailing(null, null)).toBe(false);
  });
});

describe("taskHealth", () => {
  it("reads never, failing, idle, stale and fresh in that priority", () => {
    expect(taskHealth(null, null, true)).toBe("never");
    expect(taskHealth(plus(T, 60_000), T, false)).toBe("failing");
    expect(taskHealth(T, T, undefined)).toBe("idle");
    expect(taskHealth(T, T, true)).toBe("stale");
    expect(taskHealth(T, T, false)).toBe("fresh");
  });
});

describe("formatAgo", () => {
  const now = Date.parse(T);
  const ago = (ms: number) => formatAgo(plus(T, -ms), now);

  it("steps from seconds to minutes, hours and days", () => {
    expect(ago(0)).toBe("0s ago");
    expect(ago(59_000)).toBe("59s ago");
    expect(ago(60_000)).toBe("1m ago");
    expect(ago(59 * 60_000)).toBe("59m ago");
    expect(ago(60 * 60_000)).toBe("1h ago");
    expect(ago(47 * 3600_000)).toBe("47h ago");
    expect(ago(48 * 3600_000)).toBe("2d ago");
  });

  it("truncates rather than rounds", () => {
    expect(ago(2 * 3600_000 + 59 * 60_000)).toBe("2h ago");
    expect(ago(119_999)).toBe("1m ago");
  });

  it("handles missing and future timestamps", () => {
    expect(formatAgo(null, now)).toBe("never");
    expect(formatAgo(plus(T, 5_000), now)).toBe("0s ago");
  });
});

describe("dueDeadlineSunday", () => {
  // Sunday 2026-09-27; Eastern is UTC-4 (EDT), so 1:05 PM ET is 17:05Z.
  it("is today once it's past 1:05 PM ET on a Sunday", () => {
    expect(dueDeadlineSunday(Date.parse("2026-09-27T17:05:00Z"))).toBe(
      "2026-09-27"
    );
    expect(dueDeadlineSunday(Date.parse("2026-09-28T03:59:00Z"))).toBe(
      "2026-09-27"
    ); // 11:59 PM Sun ET
  });

  it("is the Sunday before until then", () => {
    expect(dueDeadlineSunday(Date.parse("2026-09-27T17:04:00Z"))).toBe(
      "2026-09-20"
    );
    expect(dueDeadlineSunday(Date.parse("2026-09-27T03:00:00Z"))).toBe(
      "2026-09-20"
    ); // 11 PM Sat ET
  });

  it("goes back to the latest Sunday midweek", () => {
    expect(dueDeadlineSunday(Date.parse("2026-09-30T16:00:00Z"))).toBe(
      "2026-09-27"
    ); // Wednesday
    expect(dueDeadlineSunday(Date.parse("2026-10-03T23:00:00Z"))).toBe(
      "2026-09-27"
    ); // Saturday
  });

  it("uses Eastern standard time in winter and crosses month and year ends", () => {
    // Sunday 2027-01-03; EST is UTC-5, so 1:05 PM ET is 18:05Z.
    expect(dueDeadlineSunday(Date.parse("2027-01-03T18:04:00Z"))).toBe(
      "2026-12-27"
    );
    expect(dueDeadlineSunday(Date.parse("2027-01-03T18:05:00Z"))).toBe(
      "2027-01-03"
    );
    expect(dueDeadlineSunday(Date.parse("2026-10-01T12:00:00Z"))).toBe(
      "2026-09-27"
    ); // Thursday
  });
});

describe("deadlineSweepHealth", () => {
  const sundayAfternoon = Date.parse("2026-09-27T18:00:00Z");

  it("is done when the latest sweep is the one that's due", () => {
    expect(deadlineSweepHealth("2026-09-27", sundayAfternoon)).toBe("done");
  });

  it("is missed when the latest sweep is older than the one that's due", () => {
    expect(deadlineSweepHealth("2026-09-20", sundayAfternoon)).toBe("missed");
  });

  it("isn't missed before this Sunday's sweep is due", () => {
    expect(
      deadlineSweepHealth("2026-09-20", Date.parse("2026-09-27T16:00:00Z"))
    ).toBe("done");
  });

  it("is never without a sweep on record", () => {
    expect(deadlineSweepHealth(null, sundayAfternoon)).toBe("never");
  });
});

describe("everyMinuteHealth", () => {
  const now = Date.parse(T);
  it("is fresh while it keeps ticking", () => {
    expect(everyMinuteHealth(plus(T, -60_000), plus(T, -60_000), now)).toBe(
      "fresh"
    );
  });

  it("goes stale once it stops for longer than the limit", () => {
    const old = plus(T, -(EVERY_MINUTE_STALE_MS + 1));
    expect(everyMinuteHealth(old, old, now)).toBe("stale");
  });

  it("reports failing and never-run like any other task", () => {
    expect(everyMinuteHealth(T, plus(T, -120_000), now)).toBe("failing");
    expect(everyMinuteHealth(null, null, now)).toBe("never");
  });
});

describe("system event activity", () => {
  const now = Date.parse(T);
  const recent = { last_seen_at: plus(T, -60 * 60_000) };
  const old = { last_seen_at: plus(T, -3 * 24 * 60 * 60_000) };

  it("uses the data repo's active flag when it's there", () => {
    expect(isEventActive({ ...old, active: true }, now)).toBe(true);
    expect(isEventActive({ ...recent, active: false }, now)).toBe(false);
  });

  it("falls back to last_seen_at within 24h", () => {
    expect(isEventActive(recent, now)).toBe(true);
    expect(isEventActive(old, now)).toBe(false);
  });

  it("prefers active_count, which covers rows outside recent", () => {
    expect(activeEventCount({ active_count: 3, recent: [recent] }, now)).toBe(
      3
    );
    expect(activeEventCount({ active_count: 0, recent: [recent] }, now)).toBe(
      0
    );
    expect(activeEventCount({ recent: [recent, old, recent] }, now)).toBe(2);
  });
});

describe("healthSeverity / summarizeHealth", () => {
  it("treats failing and missed as errors, stale and never as warnings", () => {
    expect(healthSeverity("failing")).toBe("error");
    expect(healthSeverity("missed")).toBe("error");
    expect(healthSeverity("stale")).toBe("warning");
    expect(healthSeverity("never")).toBe("warning");
    expect(healthSeverity("fresh")).toBeNull();
    expect(healthSeverity("done")).toBeNull();
    expect(healthSeverity("idle")).toBeNull();
  });

  it("counts problems worst first, with the worst severity", () => {
    expect(
      summarizeHealth(["stale", "fresh", "failing", "idle", "stale", "never"])
    ).toEqual({
      severity: "error",
      problems: [
        { health: "failing", count: 1 },
        { health: "stale", count: 2 },
        { health: "never", count: 1 },
      ],
    });
    expect(summarizeHealth(["fresh", "stale"]).severity).toBe("warning");
    expect(summarizeHealth(["fresh", "done", "idle"])).toEqual({
      severity: null,
      problems: [],
    });
  });
});
