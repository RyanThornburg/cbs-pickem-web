import { defaultNflView, isNflView, teamPath, teamSlug } from "./nflView";

// 2026-10-04 is a Sunday. EDT is UTC-4.
const et = (iso: string) => new Date(`${iso}-04:00`);

describe("defaultNflView", () => {
  it("opens on Live whenever a game is live, any day", () => {
    expect(defaultNflView(et("2026-10-01T21:00:00"), true)).toBe("live"); // Thu
    expect(defaultNflView(et("2026-12-19T16:30:00"), true)).toBe("live"); // Sat
  });

  it("opens on Games before the Sunday deadline", () => {
    expect(defaultNflView(et("2026-09-29T09:00:00"), false)).toBe("games"); // Tue
    expect(defaultNflView(et("2026-10-01T19:00:00"), false)).toBe("games"); // Thu
    expect(defaultNflView(et("2026-10-04T12:59:00"), false)).toBe("games"); // Sun
  });

  it("opens on Live from Sunday 1 PM ET through the end of Monday", () => {
    expect(defaultNflView(et("2026-10-04T13:00:00"), false)).toBe("live");
    expect(defaultNflView(et("2026-10-04T23:30:00"), false)).toBe("live");
    expect(defaultNflView(et("2026-10-05T09:00:00"), false)).toBe("live"); // Mon
    expect(defaultNflView(et("2026-10-05T23:59:00"), false)).toBe("live");
    expect(defaultNflView(et("2026-10-06T00:01:00"), false)).toBe("games"); // Tue
  });
});

describe("nfl view helpers", () => {
  it("accepts only the three views", () => {
    expect(isNflView("live")).toBe(true);
    expect(isNflView("scoreboard")).toBe(false);
    expect(isNflView(null)).toBe(false);
  });

  it("builds team paths from the normalized abbreviation", () => {
    expect(teamSlug("JAX")).toBe("jac");
    expect(teamPath("LA")).toBe("/nfl/teams/lar");
    expect(teamPath("BUF")).toBe("/nfl/teams/buf");
  });
});
