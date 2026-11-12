import { HALVES } from "../utils/testPeriods";
import { GetFinishedPrizes, prizeWinners } from "./GetFinishedPrizes";

const FIRST_HALF = { ...HALVES[1], payouts: [685, 450, 300] };

const user = (
  user_id: number,
  name: string,
  place: number | null,
  payout?: number | null
) => ({
  user_id,
  name,
  periods: { first_half: { place, payout } },
});

// The real 1st half: 1st, 2nd, then a 4-way tie for 3rd splitting $300.
const users = [
  user(31, "Paul Flanigan", 3, 75),
  user(33, "Phil Hedges", 1, 685),
  user(29, "Patrick Madden", 2, 450),
  user(7, "Bryan Favilla", 3, 75),
  user(24, "Sean Wright", 7, null),
];

describe("prizeWinners", () => {
  it("lists the paid places by place then name, with the split amounts", () => {
    expect(
      prizeWinners(users, FIRST_HALF).map((w) => [
        w.name,
        w.place,
        w.tied,
        w.owed,
      ])
    ).toEqual([
      ["Phil Hedges", 1, false, 685],
      ["Patrick Madden", 2, false, 450],
      ["Bryan Favilla", 3, true, 75],
      ["Paul Flanigan", 3, true, 75],
    ]);
  });

  it("keeps a winner whose amount is missing, owed unknown", () => {
    const [w] = prizeWinners([user(1, "A", 1)], FIRST_HALF);
    expect(w.owed).toBeNull();
  });
});

describe("GetFinishedPrizes", () => {
  const respond = (byPath: Record<string, unknown>) =>
    vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
      const path = String(input);
      if (!(path in byPath)) return new Response("{}", { status: 404 });
      return new Response(JSON.stringify(byPath[path]), { status: 200 });
    });

  afterEach(() => vi.restoreAllMocks());

  it("reads a finished half from its last week's leaderboard", async () => {
    const fetch = respond({
      "/api/weeks/2026/9/leaderboard": {
        periods: [HALVES[0], FIRST_HALF, HALVES[2]],
        users,
      },
    });
    const prizes = await GetFinishedPrizes(2026, 10, HALVES);
    expect(prizes.map((p) => p.period.key)).toEqual(["first_half"]);
    expect(prizes[0].period.payouts).toEqual([685, 450, 300]);
    expect(prizes[0].winners).toHaveLength(4);
    // The current week's key (for `final`, missing here) and week 9's.
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it("goes by the current week's final flag when the data has one", async () => {
    const flagged = (firstHalf: boolean, secondHalf: boolean) => ({
      periods: [
        { ...HALVES[0], final: false },
        { ...FIRST_HALF, final: firstHalf },
        { ...HALVES[2], final: secondHalf },
      ],
      users: [],
    });
    // Week 10: the 1st half is final, read from week 9's key (no flag).
    const fetch = respond({
      "/api/weeks/2026/10/leaderboard": flagged(true, false),
      "/api/weeks/2026/9/leaderboard": { periods: HALVES, users },
    });
    const prizes = await GetFinishedPrizes(2026, 10, HALVES);
    expect(prizes.map((p) => p.period.key)).toEqual(["first_half"]);
    expect(prizes[0].winners).toHaveLength(4);
    expect(fetch.mock.calls.map(([p]) => String(p))).not.toContain(
      "/api/weeks/2026/10/games"
    );

    // Week 18, every game final but picks not all graded yet: not payable.
    vi.restoreAllMocks();
    respond({
      "/api/weeks/2026/18/games": {
        week: 18,
        updated_at: "",
        games: [{ status: "FINAL" }],
      },
      "/api/weeks/2026/18/leaderboard": flagged(true, false),
      "/api/weeks/2026/9/leaderboard": { periods: HALVES, users },
    });
    expect(
      (await GetFinishedPrizes(2026, 18, HALVES)).map((p) => p.period.key)
    ).toEqual(["first_half"]);
  });

  it("waits for every game on a prize's last week to be final", async () => {
    const leaderboard = { periods: HALVES, users: [] };
    respond({
      "/api/weeks/2026/18/games": {
        week: 18,
        updated_at: "",
        games: [{ status: "FINAL" }, { status: "IN_PROGRESS" }],
      },
      "/api/weeks/2026/9/leaderboard": leaderboard,
    });
    expect(
      (await GetFinishedPrizes(2026, 18, HALVES)).map((p) => p.period.key)
    ).toEqual(["first_half"]);

    vi.restoreAllMocks();
    respond({
      "/api/weeks/2026/18/games": {
        week: 18,
        updated_at: "",
        games: [{ status: "FINAL" }],
      },
      "/api/weeks/2026/9/leaderboard": leaderboard,
      "/api/weeks/2026/18/leaderboard": leaderboard,
    });
    expect(
      (await GetFinishedPrizes(2026, 18, HALVES)).map((p) => p.period.key)
    ).toEqual(["first_half", "second_half", "overall"]);
  });
});
