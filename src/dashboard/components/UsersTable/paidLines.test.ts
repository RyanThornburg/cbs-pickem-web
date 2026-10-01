import { paidLines } from "./usersTableUtils";

const PAID = { overall: 5, first_half: 3, second_half: 3 };
const rows = (places: number[], secondHalf: (number | null)[] = []) =>
  places.map((place, i) => ({
    place,
    second_half_place: secondHalf[i] ?? null,
  }));
const labels = (m: Map<number, { label: string }[]>) =>
  Object.fromEntries([...m].map(([i, l]) => [i, l.map((x) => x.label)]));
const byPlace = { id: "place", desc: false };

describe("paidLines", () => {
  it("draws the 1st-half and overall lines in the first half", () => {
    const r = rows([1, 2, 3, 4, 5, 6, 7]);
    expect(labels(paidLines(r, byPlace, PAID, false))).toEqual({
      2: ["Paid · top 3, 1st half"],
      4: ["Paid · top 5 overall"],
    });
  });

  it("tags each line with its prize, for the selected player's gap note", () => {
    const lines = paidLines(rows([1, 2, 3, 4, 5, 6, 7]), byPlace, PAID, false);
    expect(lines.get(2)?.[0].prize).toBe("1st half");
    expect(lines.get(4)?.[0].prize).toBe("Overall");
  });

  it("keeps everyone tied at a cutoff above the line", () => {
    // Week 3: T2 twice, then five tied at 4th.
    const r = rows([1, 2, 2, 4, 4, 4, 4, 4, 9, 9]);
    expect(labels(paidLines(r, byPlace, PAID, false))).toEqual({
      2: ["Paid · top 3, 1st half"],
      7: ["Paid · top 5 overall (8 with the tie)"],
    });
  });

  it("puts both lines under the same row when one tie spans both cutoffs", () => {
    const r = rows([1, 2, 3, 3, 3, 3, 7]);
    expect(labels(paidLines(r, byPlace, PAID, false))).toEqual({
      5: [
        "Paid · top 3, 1st half (6 with the tie)",
        "Paid · top 5 overall (6 with the tie)",
      ],
    });
  });

  it("draws nothing when everyone is tied, as before any scores", () => {
    expect(paidLines(rows([1, 1, 1, 1, 1, 1]), byPlace, PAID, false).size).toBe(
      0
    );
  });

  it("drops the 1st-half line once the 2nd half has started", () => {
    const r = rows([1, 2, 3, 4, 5, 6]);
    expect(labels(paidLines(r, byPlace, PAID, true))).toEqual({
      4: ["Paid · top 5 overall"],
    });
  });

  it("follows 2nd-half place when sorted by it", () => {
    const r = rows([4, 1, 2, 6, 3], [1, 2, 3, 4, null]);
    const sort = { id: "second_half_place", desc: false };
    expect(labels(paidLines(r, sort, PAID, true))).toEqual({
      2: ["Paid · top 3, 2nd half"],
    });
  });

  it("draws nothing when not in rank order", () => {
    const r = rows([1, 2, 3, 4, 5, 6]);
    expect(paidLines(r, { id: "place", desc: true }, PAID, false).size).toBe(0);
    expect(paidLines(r, { id: "score", desc: true }, PAID, false).size).toBe(0);
    expect(paidLines(r, undefined, PAID, false).size).toBe(0);
  });
});
