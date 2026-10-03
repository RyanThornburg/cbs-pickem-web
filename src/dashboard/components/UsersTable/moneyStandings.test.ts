import { HALVES, THIRDS } from "../../utils/testPeriods";
import { moneyStandings, shownMoneyStandings } from "./usersTableUtils";
import { paidLineNote } from "./MoneyLines";

// A row with its displayed overall place and score, and optionally the 2nd
// half's. In the first half the data ranks first_half like overall.
const row = (
  id: string,
  place: number,
  score: number,
  second_half_place: number | null = null,
  second_half_score = 0
) => ({
  id,
  periods: {
    overall: { place, score },
    first_half: { place, score },
    second_half: { place: second_half_place, score: second_half_score },
  },
});

// Scores 20, 18, 17, 17, 15, 14, 12 -> places 1, 2, 3, 3, 5, 6, 7.
const firstHalf = [
  row("a", 1, 20),
  row("b", 2, 18),
  row("c", 3, 17),
  row("d", 3, 17),
  row("e", 5, 15),
  row("f", 6, 14),
  row("g", 7, 12),
];

const standing = (
  key: string,
  prize: string,
  cutoff: number,
  inMoney: boolean,
  ptsOut: number
) => ({ key, prize, cutoff, inMoney, ptsOut });

describe("moneyStandings", () => {
  it("reports the 1st half and overall before the 2nd half starts", () => {
    expect(moneyStandings(firstHalf, "b", HALVES, 4)).toEqual([
      standing("first_half", "1st half", 3, true, 0),
      standing("overall", "Overall", 5, true, 0),
    ]);
  });

  it("counts everyone tied at the cutoff as in the money", () => {
    expect(moneyStandings(firstHalf, "d", HALVES, 4)[0]).toMatchObject({
      inMoney: true,
    });
  });

  it("measures the gap to the last paid score", () => {
    expect(moneyStandings(firstHalf, "e", HALVES, 4)).toEqual([
      standing("first_half", "1st half", 3, false, 2),
      standing("overall", "Overall", 5, true, 0),
    ]);
    expect(moneyStandings(firstHalf, "g", HALVES, 4)[1]).toEqual(
      standing("overall", "Overall", 5, false, 3)
    );
  });

  it("switches to the 2nd half once it starts", () => {
    const rows = [
      row("a", 1, 40, 2, 9),
      row("b", 2, 38, 1, 11),
      row("c", 3, 30, 3, 8),
      row("d", 4, 29, 4, 6),
    ];
    expect(moneyStandings(rows, "d", HALVES, 10)).toEqual([
      standing("second_half", "2nd half", 3, false, 2),
      standing("overall", "Overall", 5, true, 0),
    ]);
  });

  it("follows any period list, by each period's own cutoff", () => {
    const rows = [
      {
        id: "a",
        periods: {
          overall: { place: 1, score: 30 },
          second_third: { place: 1, score: 9 },
        },
      },
      {
        id: "b",
        periods: {
          overall: { place: 2, score: 28 },
          second_third: { place: 2, score: 8 },
        },
      },
      {
        id: "c",
        periods: {
          overall: { place: 3, score: 27 },
          second_third: { place: 3, score: 5 },
        },
      },
    ];
    expect(moneyStandings(rows, "c", THIRDS, 8)).toEqual([
      standing("second_third", "2nd third", 2, false, 3),
      standing("overall", "Overall", 5, true, 0),
    ]);
  });

  it("says nothing before anyone has scored", () => {
    const rows = [row("a", 1, 0), row("b", 1, 0)];
    expect(moneyStandings(rows, "a", HALVES, 1)).toEqual([]);
  });

  it("says nothing for a player who isn't in the list", () => {
    expect(moneyStandings(firstHalf, "zz", HALVES, 4)).toEqual([]);
  });
});

describe("shownMoneyStandings", () => {
  const out = (key: "first_half" | "overall", ptsOut: number) =>
    key === "first_half"
      ? standing(key, "1st half", 3, false, ptsOut)
      : standing(key, "Overall", 5, false, ptsOut);

  it("keeps gaps within reach of the weeks left", () => {
    // Week 4 before kickoff: 6 weeks left in the half (reach 4), 15 overall
    // (reach 6).
    const shown = shownMoneyStandings(
      [out("first_half", 4), out("overall", 7)],
      HALVES,
      4,
      false
    );
    expect(shown).toEqual([{ ...out("first_half", 4), weeksLeft: 6 }]);
  });

  it("drops the same gap late in the half", () => {
    // Week 9 before kickoff: 1 week left in the half (reach 2).
    expect(
      shownMoneyStandings([out("first_half", 3)], HALVES, 9, false)
    ).toEqual([]);
  });

  it("always keeps a prize you're in the money for", () => {
    const inMoney = standing("first_half", "1st half", 3, true, 0);
    expect(shownMoneyStandings([inMoney], HALVES, 9, true)).toEqual([
      { ...inMoney, weeksLeft: 0 },
    ]);
  });
});

describe("paidLineNote", () => {
  const standings = [
    { ...standing("first_half", "1st half", 3, false, 3), weeksLeft: 6 },
    { ...standing("overall", "Overall", 5, true, 0), weeksLeft: 15 },
  ];

  it("says how far back on a prize being chased", () => {
    expect(paidLineNote(standings, "first_half")).toBe("you're 3 pts back");
  });

  it("says nothing on a prize you're in, or one out of reach", () => {
    expect(paidLineNote(standings, "overall")).toBeUndefined();
    expect(paidLineNote(standings, "second_half")).toBeUndefined();
  });
});
