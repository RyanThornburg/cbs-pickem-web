import { Tidbit } from "../../types";
import { getSeenTidbits, markTidbitSeen, orderForRotation, STRIP_SIZE } from "./tidbitUtils";

const tidbit = (id: string): Tidbit => ({
  id,
  kind: id,
  category: "pool",
  scope: "week",
  score: 1,
  headline: id,
  short: id,
  sample_size: null,
  data: {},
});

describe("orderForRotation", () => {
  const list = ["a", "b", "c", "d"].map(tidbit);

  it("keeps rank order when nothing has been seen", () => {
    expect(orderForRotation(list, new Set()).map((t) => t.id)).toEqual(["a", "b", "c", "d"]);
  });

  it("moves seen tidbits to the back, keeping rank order in each group", () => {
    expect(orderForRotation(list, new Set(["a", "c"])).map((t) => t.id)).toEqual([
      "b", "d", "a", "c",
    ]);
  });

  it("only takes the top of the list", () => {
    const long = Array.from({ length: 12 }, (_, i) => tidbit(`t${i}`));
    const ordered = orderForRotation(long, new Set(["t0"]));
    expect(ordered).toHaveLength(STRIP_SIZE);
    expect(ordered.map((t) => t.id)).not.toContain("t8");
    expect(ordered[ordered.length - 1].id).toBe("t0");
  });
});

describe("seen storage", () => {
  beforeEach(() => localStorage.clear());

  it("tracks seen ids per week", () => {
    markTidbitSeen(2026, 3, "a");
    markTidbitSeen(2026, 3, "b");
    markTidbitSeen(2026, 4, "c");
    expect(getSeenTidbits(2026, 3)).toEqual(new Set(["a", "b"]));
    expect(getSeenTidbits(2026, 4)).toEqual(new Set(["c"]));
    expect(getSeenTidbits(2026, 5)).toEqual(new Set());
  });

  it("keeps only the most recent weeks", () => {
    [1, 2, 3, 4, 5, 6].forEach((week) => markTidbitSeen(2026, week, "x"));
    expect(getSeenTidbits(2026, 1).size).toBe(0);
    expect(getSeenTidbits(2026, 2).size).toBe(0);
    expect(getSeenTidbits(2026, 6).size).toBe(1);
  });

  it("survives bad stored data", () => {
    localStorage.setItem("tidbitsSeen", "not json");
    expect(getSeenTidbits(2026, 3).size).toBe(0);
  });
});
