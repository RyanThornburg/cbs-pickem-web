import { moneyStandings } from "./usersTableUtils";

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
