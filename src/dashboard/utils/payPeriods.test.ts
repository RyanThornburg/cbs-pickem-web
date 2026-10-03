import {
  activePeriods,
  periodAbbr,
  periodName,
  periodWeeksLeft,
  periodWeeksText,
  segmentsRankedLikeOverall,
  shownSegment,
} from "./payPeriods";
import { HALVES, THIRDS } from "./testPeriods";

const keys = (periods: { key: string }[]) => periods.map((p) => p.key);

describe("shownSegment", () => {
  it("skips the 1st half, which ranks the same points as overall", () => {
    expect(shownSegment(HALVES, 1)).toBeNull();
    expect(shownSegment(HALVES, 9)).toBeNull();
  });

  it("is the 2nd half from its first week to the last", () => {
    expect(shownSegment(HALVES, 10)?.key).toBe("second_half");
    expect(shownSegment(HALVES, 18)?.key).toBe("second_half");
  });

  it("follows thirds", () => {
    expect(shownSegment(THIRDS, 6)).toBeNull();
    expect(shownSegment(THIRDS, 7)?.key).toBe("second_third");
    expect(shownSegment(THIRDS, 13)?.key).toBe("final_third");
  });

  it("is null with no periods, before meta loads", () => {
    expect(shownSegment([], 4)).toBeNull();
  });
});

describe("activePeriods", () => {
  it("lists the segments being played, then overall", () => {
    expect(keys(activePeriods(HALVES, 4))).toEqual(["first_half", "overall"]);
    expect(keys(activePeriods(HALVES, 12))).toEqual(["second_half", "overall"]);
    expect(keys(activePeriods(THIRDS, 9))).toEqual(["second_third", "overall"]);
  });
});

describe("segmentsRankedLikeOverall", () => {
  it("is the segment that started with the season, while it's played", () => {
    expect(keys(segmentsRankedLikeOverall(HALVES, 4))).toEqual(["first_half"]);
    expect(segmentsRankedLikeOverall(HALVES, 10)).toEqual([]);
  });
});

describe("period names", () => {
  it("turns the label into the app's sentence case", () => {
    expect(periodName({ label: "Second Half" })).toBe("2nd half");
    expect(periodName({ label: "Final Third" })).toBe("Final third");
    expect(periodName({ label: "Overall" })).toBe("Overall");
  });

  it("abbreviates for the phone column headers", () => {
    expect(periodAbbr({ label: "Second Half" })).toBe("2H");
    expect(periodAbbr({ label: "Third Quarter" })).toBe("3Q");
    expect(periodAbbr({ label: "Final Third" })).toBe("Final");
  });

  it("describes the weeks", () => {
    expect(periodWeeksText(HALVES[0])).toBe("the whole season");
    expect(periodWeeksText(HALVES[1])).toBe("weeks 1–9");
    expect(periodWeeksText({ ...HALVES[2], end_week: null })).toBe(
      "week 10 on"
    );
  });
});

describe("periodWeeksLeft", () => {
  it("counts the browsed week until its games are final", () => {
    expect(periodWeeksLeft(HALVES[1], 4, false)).toBe(6);
    expect(periodWeeksLeft(HALVES[1], 4, true)).toBe(5);
    expect(periodWeeksLeft(HALVES[0], 4, false)).toBe(15);
    expect(periodWeeksLeft(HALVES[2], 17, true)).toBe(1);
  });

  it("never goes below zero once a period is over", () => {
    expect(periodWeeksLeft(HALVES[1], 12, true)).toBe(0);
  });
});
