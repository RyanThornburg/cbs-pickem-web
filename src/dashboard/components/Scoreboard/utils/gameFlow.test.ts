import { WinProbabilityPoint } from "../../../types";
import {
  clockLabel,
  coverChanges,
  coverMargin,
  coverText,
  gameLength,
  gameMinute,
  scoringMarkers,
  winText,
} from "./gameFlow";

const pt = (
  period: number,
  clock: string | null,
  home_score: number,
  away_score: number,
  home_win_pct = 50
): WinProbabilityPoint => ({
  period,
  clock,
  home_win_pct,
  home_score,
  away_score,
  scoring_play: false,
});

describe("gameMinute", () => {
  it("counts elapsed game time across quarters", () => {
    expect(gameMinute(pt(1, "15:00", 0, 0))).toBe(0);
    expect(gameMinute(pt(2, "8:30", 0, 0))).toBe(21.5);
    expect(gameMinute(pt(4, "0:00", 0, 0))).toBe(60);
  });
  it("gives OT its 10 minutes", () => {
    expect(gameMinute(pt(5, "10:00", 0, 0))).toBe(60);
    expect(gameMinute(pt(5, "5:00", 0, 0))).toBe(65);
  });
  it("puts the pre-kickoff point and a missing clock at a period's start", () => {
    expect(gameMinute(pt(0, null, 0, 0))).toBe(0);
    expect(gameMinute(pt(3, null, 0, 0))).toBe(30);
  });
});

describe("gameLength", () => {
  it("is 60 minutes, or 70 with OT", () => {
    expect(gameLength([pt(4, "0:00", 0, 0)])).toBe(60);
    expect(gameLength([pt(5, "3:00", 0, 0)])).toBe(70);
  });
});

describe("coverMargin and coverText", () => {
  // PIT at CLE, CLE +2.5
  it("is above 0 while home covers", () => {
    expect(coverMargin(pt(4, "0:00", 27, 24), 2.5)).toBe(5.5);
    expect(coverMargin(pt(1, "2:59", 0, 7), 2.5)).toBe(-4.5);
  });
  it("names the covering team with a half point", () => {
    expect(coverText(pt(4, "1:42", 24, 24), 2.5, "CLE", "PIT")).toBe(
      "CLE covering by 2½"
    );
    expect(coverText(pt(1, "2:59", 0, 7), 2.5, "CLE", "PIT")).toBe(
      "PIT covering by 4½"
    );
    expect(coverText(pt(4, "0:00", 27, 24), 2.5, "CLE", "PIT", true)).toBe(
      "CLE covered by 5½"
    );
  });
});

describe("scoringMarkers", () => {
  it("merges a touchdown and its extra point at the same clock", () => {
    const marks = scoringMarkers([
      pt(1, "15:00", 0, 0),
      pt(2, "12:14", 6, 7),
      pt(2, "12:14", 7, 7),
      pt(2, "12:09", 7, 7),
      pt(2, "8:28", 14, 7),
    ]);
    expect(marks.map((m) => `${m.home_score}-${m.away_score}`)).toEqual([
      "7-7",
      "14-7",
    ]);
  });
  it("marks a score on the first point", () => {
    expect(scoringMarkers([pt(1, "2:59", 0, 7)])).toHaveLength(1);
  });
});

describe("coverChanges", () => {
  it("counts each switch of the covering team", () => {
    const pts = [
      pt(1, "15:00", 0, 0), // CLE +2.5 covering
      pt(1, "2:59", 0, 7), // PIT
      pt(2, "12:14", 7, 7), // CLE
      pt(4, "1:42", 24, 24), // CLE
    ];
    expect(coverChanges(pts, 2.5)).toBe(2);
    expect(coverChanges([], 2.5)).toBe(0);
  });
});

describe("winText and clockLabel", () => {
  it("names the likelier winner and never says 100% while live", () => {
    expect(winText(pt(4, "1:42", 24, 24, 59.7), "CLE", "PIT")).toBe(
      "CLE 60% to win"
    );
    expect(winText(pt(2, "1:00", 0, 7, 25.2), "CLE", "PIT")).toBe(
      "PIT 75% to win"
    );
    expect(winText(pt(4, "0:01", 27, 24, 99.9), "CLE", "PIT")).toBe(
      "CLE 99% to win"
    );
  });
  it("labels kickoff, quarters and OT", () => {
    expect(clockLabel(pt(0, null, 0, 0))).toBe("Kickoff");
    expect(clockLabel(pt(2, "8:28", 0, 0))).toBe("Q2 8:28");
    expect(clockLabel(pt(5, "3:00", 0, 0))).toBe("OT 3:00");
  });
});
