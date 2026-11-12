import { PayPeriod, RankedUser } from "../../types";
import { raceSummary, shortName } from "./leadersUtils";

const period = (
  key: string,
  start_week: number,
  end_week: number,
  paid_places: number
): PayPeriod => ({
  key,
  label: key,
  start_week,
  end_week,
  paid_places,
  pay_last_place: false,
});

const OVERALL = period("overall", 1, 18, 5);
const SECOND = period("second_half", 10, 18, 3);
const PERIODS = [OVERALL, period("first_half", 1, 9, 3), SECOND];

const user = (
  id: string,
  place: number,
  cumulative: number,
  trending = 0,
  secondHalf: [number, number] | null = null
): RankedUser => ({
  id,
  name: `User ${id}`,
  weekly_score: 0,
  trending_score: trending,
  cumulative_score: cumulative,
  place,
  periods: {
    second_half: {
      score: secondHalf ? secondHalf[1] : null,
      place: secondHalf ? secondHalf[0] : null,
      in_money: false,
      last_place_eligible: null,
      in_money_last_place: false,
    },
  },
  picks: [],
});

describe("raceSummary", () => {
  // Places as GetUserByWeek ranks them: on graded + covering. Displayed
  // overall: a 47, b 47, c 46, d 45, e 44, f 44, g 40.
  const users = [
    user("a", 1, 47, 0, [3, 6]),
    user("b", 1, 45, 2, [1, 8]),
    user("c", 3, 46, 0, [2, 7]),
    user("d", 4, 44, 1, [3, 5]),
    user("e", 5, 44, 0, [6, 4]),
    user("f", 5, 43, 1, [7, 3]),
    user("g", 7, 40, 0, [8, 2]),
  ];

  it("lists every leader tied for 1st, graded score apart from covering", () => {
    const race = raceSummary(users, OVERALL, PERIODS, 12);
    expect(race.leaders.map((l) => [l.id, l.score, l.covering])).toEqual([
      ["a", 47, 0],
      ["b", 45, 2],
    ]);
    expect(race.started).toBe(true);
  });

  it("puts the paid line at the last paid place, counting the tie", () => {
    const race = raceSummary(users, OVERALL, PERIODS, 12);
    expect(race.paidLine).toBe(44);
    expect(race.inMoney).toBe(6);
  });

  it("says how far out the selected player is", () => {
    const g = raceSummary(users, OVERALL, PERIODS, 12, "g").you!;
    expect([g.placeLabel, g.inMoney, g.ptsOut, g.ptsClear]).toEqual([
      "7",
      false,
      4,
      null,
    ]);
  });

  it("says how far clear an in-the-money player is", () => {
    const c = raceSummary(users, OVERALL, PERIODS, 12, "c").you!;
    expect([c.placeLabel, c.inMoney, c.ptsOut, c.ptsClear]).toEqual([
      "3",
      true,
      0,
      6,
    ]);
    expect(raceSummary(users, OVERALL, PERIODS, 12, "e").you!.placeLabel).toBe(
      "T5"
    );
  });

  it("ranks the second half on its own displayed score", () => {
    const race = raceSummary(users, SECOND, PERIODS, 12, "d");
    expect(race.leaders.map((l) => l.id)).toEqual(["b"]);
    // d: 5 graded + 1 covering = 6, tied with a for 3rd.
    expect(race.paidLine).toBe(6);
    expect(race.you).toMatchObject({ placeLabel: "T3", inMoney: true });
  });

  it("hasn't started while everyone is at 0", () => {
    const fresh = [
      user("a", 1, 30, 0, [1, 0]),
      user("b", 2, 28, 0, [1, 0]),
      user("c", 3, 25, 0, [1, 0]),
    ];
    const race = raceSummary(fresh, SECOND, PERIODS, 10, "c");
    expect(race.started).toBe(false);
    expect(race.leaders).toHaveLength(3);
    // A pick covering counts: the race is on.
    const live = [user("a", 1, 30, 1, [1, 0]), ...fresh.slice(1)];
    expect(raceSummary(live, SECOND, PERIODS, 10).started).toBe(true);
  });

  it("leaves out users with no place and anyone not picked", () => {
    const early = [user("a", 1, 10), user("b", 2, 9)];
    const race = raceSummary(early, SECOND, PERIODS, 5, "a");
    expect(race.leaders).toEqual([]);
    expect(race.you).toBeNull();
    expect(raceSummary(users, OVERALL, PERIODS, 12, "nobody").you).toBeNull();
  });
});

describe("shortName", () => {
  it("keeps the last name and initials the first", () => {
    expect(shortName("Patrick Madden")).toBe("P. Madden");
    expect(shortName("bill morlok")).toBe("B. morlok");
    expect(shortName("Cher")).toBe("Cher");
  });
});
