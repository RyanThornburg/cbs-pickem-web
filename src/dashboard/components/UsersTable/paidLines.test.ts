import { HALVES, THIRDS } from "../../utils/testPeriods";
import { paidLines } from "./usersTableUtils";

// Rows with an overall place, and a place in one segment. In the first
// half the data ranks first_half on the same points as overall.
const rows = (
  places: number[],
  segment: (number | null)[] = [],
  segmentKey = "second_half"
) =>
  places.map((place, i) => ({
    periods: {
      overall: { place, score: 0 },
      first_half: { place, score: 0 },
      first_third: { place, score: 0 },
      [segmentKey]: { place: segment[i] ?? null, score: 0 },
    },
  }));
const labels = (m: Map<number, { label: string }[]>) =>
  Object.fromEntries([...m].map(([i, l]) => [i, l.map((x) => x.label)]));
const byPlace = { id: "place", desc: false };
const bySegment = { id: "segment_place", desc: false };

describe("paidLines", () => {
  it("draws the 1st-half and overall lines in the first half", () => {
    const r = rows([1, 2, 3, 4, 5, 6, 7]);
    expect(labels(paidLines(r, byPlace, HALVES, 4))).toEqual({
      2: ["Paid · top 3, 1st half"],
      4: ["Paid · top 5 overall"],
    });
  });

  it("tags each line with its period, for the selected player's gap note", () => {
    const lines = paidLines(rows([1, 2, 3, 4, 5, 6, 7]), byPlace, HALVES, 4);
    expect(lines.get(2)?.[0].key).toBe("first_half");
    expect(lines.get(4)?.[0].key).toBe("overall");
  });

  it("keeps everyone tied at a cutoff above the line", () => {
    // Week 3: T2 twice, then five tied at 4th.
    const r = rows([1, 2, 2, 4, 4, 4, 4, 4, 9, 9]);
    expect(labels(paidLines(r, byPlace, HALVES, 3))).toEqual({
      2: ["Paid · top 3, 1st half"],
      7: ["Paid · top 5 overall (8 with the tie)"],
    });
  });

  it("puts both lines under the same row when one tie spans both cutoffs", () => {
    const r = rows([1, 2, 3, 3, 3, 3, 7]);
    expect(labels(paidLines(r, byPlace, HALVES, 4))).toEqual({
      5: [
        "Paid · top 3, 1st half (6 with the tie)",
        "Paid · top 5 overall (6 with the tie)",
      ],
    });
  });

  it("draws nothing when everyone is tied, as before any scores", () => {
    expect(paidLines(rows([1, 1, 1, 1, 1, 1]), byPlace, HALVES, 1).size).toBe(
      0
    );
  });

  it("drops the 1st-half line once the 2nd half has started", () => {
    const r = rows([1, 2, 3, 4, 5, 6]);
    expect(labels(paidLines(r, byPlace, HALVES, 10))).toEqual({
      4: ["Paid · top 5 overall"],
    });
  });

  it("follows 2nd-half place when sorted by it", () => {
    const r = rows([4, 1, 2, 6, 3], [1, 2, 3, 4, null]);
    expect(labels(paidLines(r, bySegment, HALVES, 12))).toEqual({
      2: ["Paid · top 3, 2nd half"],
    });
  });

  it("follows whatever segment is being played, by its own cutoff", () => {
    const r = rows([4, 1, 2, 6, 3], [1, 2, 3, 4, null], "second_third");
    expect(labels(paidLines(r, bySegment, THIRDS, 8))).toEqual({
      1: ["Paid · top 2, 2nd third"],
    });
    expect(
      labels(paidLines(rows([1, 2, 3, 4, 5, 6]), byPlace, THIRDS, 3))
    ).toEqual({
      1: ["Paid · top 2, 1st third"],
      4: ["Paid · top 5 overall"],
    });
  });

  it("draws nothing when not in rank order", () => {
    const r = rows([1, 2, 3, 4, 5, 6]);
    expect(paidLines(r, { id: "place", desc: true }, HALVES, 4).size).toBe(0);
    expect(paidLines(r, { id: "score", desc: true }, HALVES, 4).size).toBe(0);
    expect(paidLines(r, undefined, HALVES, 4).size).toBe(0);
  });
});
