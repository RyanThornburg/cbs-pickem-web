import {
  moneyStandings,
  prizeWeeksLeft,
  shownMoneyStandings,
} from "./usersTableUtils";
import { paidLineNote } from "./MoneyLines";

const PAID = { overall: 5, first_half: 3, second_half: 3 };
const row = (
  id: string,
  place: number,
  score: number,
  second_half_place: number | null = null,
  second_half_score = 0
) => ({ id, place, score, second_half_place, second_half_score });

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

describe("moneyStandings", () => {
  it("reports the 1st half and overall before the 2nd half starts", () => {
    expect(moneyStandings(firstHalf, "b", PAID, false)).toEqual([
      { prize: "1st half", cutoff: 3, inMoney: true, ptsOut: 0 },
      { prize: "Overall", cutoff: 5, inMoney: true, ptsOut: 0 },
    ]);
  });

  it("counts everyone tied at the cutoff as in the money", () => {
    expect(moneyStandings(firstHalf, "d", PAID, false)[0]).toMatchObject({
      inMoney: true,
    });
  });

  it("measures the gap to the last paid score", () => {
    expect(moneyStandings(firstHalf, "e", PAID, false)).toEqual([
      { prize: "1st half", cutoff: 3, inMoney: false, ptsOut: 2 },
      { prize: "Overall", cutoff: 5, inMoney: true, ptsOut: 0 },
    ]);
    expect(moneyStandings(firstHalf, "g", PAID, false)[1]).toEqual({
      prize: "Overall",
      cutoff: 5,
      inMoney: false,
      ptsOut: 3,
    });
  });

  it("switches to the 2nd half once it starts", () => {
    const rows = [
      row("a", 1, 40, 2, 9),
      row("b", 2, 38, 1, 11),
      row("c", 3, 30, 3, 8),
      row("d", 4, 29, 4, 6),
    ];
    expect(moneyStandings(rows, "d", PAID, true)).toEqual([
      { prize: "2nd half", cutoff: 3, inMoney: false, ptsOut: 2 },
      { prize: "Overall", cutoff: 5, inMoney: true, ptsOut: 0 },
    ]);
  });

  it("says nothing before anyone has scored", () => {
    const rows = [row("a", 1, 0), row("b", 1, 0)];
    expect(moneyStandings(rows, "a", PAID, false)).toEqual([]);
  });

  it("says nothing for a player who isn't in the list", () => {
    expect(moneyStandings(firstHalf, "zz", PAID, false)).toEqual([]);
  });
});

describe("prizeWeeksLeft", () => {
  it("counts the browsed week until its games are final", () => {
    expect(prizeWeeksLeft("1st half", 4, 10, false)).toBe(6);
    expect(prizeWeeksLeft("1st half", 4, 10, true)).toBe(5);
    expect(prizeWeeksLeft("Overall", 4, 10, false)).toBe(15);
    expect(prizeWeeksLeft("2nd half", 17, 10, true)).toBe(1);
  });

  it("never goes below zero once a half is over", () => {
    expect(prizeWeeksLeft("1st half", 12, 10, true)).toBe(0);
  });
});

describe("shownMoneyStandings", () => {
  const out = (prize: "1st half" | "Overall", ptsOut: number) => ({
    prize,
    cutoff: prize === "1st half" ? 3 : 5,
    inMoney: false,
    ptsOut,
  });

  it("keeps gaps within reach of the weeks left", () => {
    // Week 4 before kickoff: 6 weeks left in the half (reach 4), 15 overall
    // (reach 6).
    const shown = shownMoneyStandings(
      [out("1st half", 4), out("Overall", 7)],
      4,
      10,
      false
    );
    expect(shown).toEqual([{ ...out("1st half", 4), weeksLeft: 6 }]);
  });

  it("drops the same gap late in the half", () => {
    // Week 9 before kickoff: 1 week left in the half (reach 2).
    expect(shownMoneyStandings([out("1st half", 3)], 9, 10, false)).toEqual([]);
  });

  it("always keeps a prize you're in the money for", () => {
    const inMoney = {
      prize: "1st half" as const,
      cutoff: 3,
      inMoney: true,
      ptsOut: 0,
    };
    expect(shownMoneyStandings([inMoney], 9, 10, true)).toEqual([
      { ...inMoney, weeksLeft: 0 },
    ]);
  });
});

describe("paidLineNote", () => {
  const standings = [
    {
      prize: "1st half" as const,
      cutoff: 3,
      inMoney: false,
      ptsOut: 3,
      weeksLeft: 6,
    },
    {
      prize: "Overall" as const,
      cutoff: 5,
      inMoney: true,
      ptsOut: 0,
      weeksLeft: 15,
    },
  ];

  it("says how far back on a prize being chased", () => {
    expect(paidLineNote(standings, "1st half")).toBe("you're 3 pts back");
  });

  it("says nothing on a prize you're in, or one out of reach", () => {
    expect(paidLineNote(standings, "Overall")).toBeUndefined();
    expect(paidLineNote(standings, "2nd half")).toBeUndefined();
  });
});
