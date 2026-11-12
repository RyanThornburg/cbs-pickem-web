import { HALVES, THIRDS } from "../../utils/testPeriods";
import { finishedSegmentPrizes } from "./usersTableUtils";
import { segmentPrizeText } from "./SegmentPrizeBadge";

const user = (id: string, places: Record<string, number | null>) => ({
  id,
  periods: Object.fromEntries(
    Object.entries(places).map(([key, place]) => [
      key,
      {
        score: 0,
        place,
        in_money: false,
        last_place_eligible: null,
        in_money_last_place: false,
      },
    ])
  ),
});

// The real 1st half: 1st, 2nd, then a 4-way tie for 3rd.
const users = [
  user("hedges", { first_half: 1 }),
  user("madden", { first_half: 2 }),
  user("majcher", { first_half: 3 }),
  user("steinrock", { first_half: 3 }),
  user("favilla", { first_half: 3 }),
  user("flanigan", { first_half: 3 }),
  user("wright", { first_half: 7 }),
];

describe("finishedSegmentPrizes", () => {
  it("medals every paid place once the half is over, ties included", () => {
    const prizes = finishedSegmentPrizes(users, HALVES, 10);
    expect([...prizes.keys()]).toEqual([
      "hedges",
      "madden",
      "majcher",
      "steinrock",
      "favilla",
      "flanigan",
    ]);
    expect(prizes.get("hedges")).toEqual([
      { key: "first_half", prize: "1st half", place: 1, tied: false },
    ]);
    expect(prizes.get("favilla")?.[0]).toMatchObject({ place: 3, tied: true });
  });

  it("waits until the week after the half ends", () => {
    expect(finishedSegmentPrizes(users, HALVES, 9).size).toBe(0);
  });

  it("never medals overall inside the season", () => {
    const overall = [user("a", { overall: 1 })];
    expect(finishedSegmentPrizes(overall, HALVES, 18).size).toBe(0);
  });

  it("collects more than one finished segment", () => {
    const thirds = [
      user("a", { first_third: 1, second_third: 2 }),
      user("b", { first_third: 2, second_third: 1 }),
      user("c", { first_third: 3, second_third: 3 }),
    ];
    const prizes = finishedSegmentPrizes(thirds, THIRDS, 13);
    expect(prizes.get("a")?.map((p) => p.key)).toEqual([
      "first_third",
      "second_third",
    ]);
    // THIRDS pays 2 places.
    expect(prizes.has("c")).toBe(false);
  });
});

describe("segmentPrizeText", () => {
  it("names the place, and the tie", () => {
    const base = { key: "first_half", prize: "1st half" };
    expect(segmentPrizeText({ ...base, place: 1, tied: false })).toBe(
      "1st half winner"
    );
    expect(segmentPrizeText({ ...base, place: 2, tied: false })).toBe(
      "1st half · 2nd place"
    );
    expect(segmentPrizeText({ ...base, place: 3, tied: true })).toBe(
      "1st half · tied for 3rd place"
    );
    expect(segmentPrizeText({ ...base, place: 1, tied: true })).toBe(
      "1st half · tied for 1st place"
    );
  });
});
