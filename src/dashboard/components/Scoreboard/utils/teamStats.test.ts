import { TeamBoxScore } from "../../../types";
import { barShare, teamStatRows } from "./teamStats";
import { matchupBarColors } from "./teamData";

describe("barShare", () => {
  it("splits by value, evenly when both are zero", () => {
    expect(barShare(30, 10)).toBe(0.75);
    expect(barShare(0, 0)).toBe(0.5);
  });

  it("gives the longer bar to the team with fewer on lower-is-better stats", () => {
    // 0 interceptions thrown vs 1: away gets the whole bar
    expect(barShare(0, 1, true)).toBe(1);
    expect(barShare(2, 0, true)).toBe(0);
  });

  it("never lets negative yards flip the bar", () => {
    expect(barShare(-5, 20)).toBe(0);
  });
});

describe("teamStatRows", () => {
  const box = (o: Partial<TeamBoxScore>): TeamBoxScore => o as TeamBoxScore;

  it("sizes efficiency by conversion rate, not raw counts", () => {
    const [row] = teamStatRows(
      box({ third_down_conversions: 6, third_down_attempts: 12 }),
      box({ third_down_conversions: 7, third_down_attempts: 12 })
    );
    expect(row).toMatchObject({ label: "3rd Down Efficiency", away: { main: "6-12" }, home: { main: "7-12" } });
    expect(row.awayShare).toBeCloseTo(6 / 13);
  });

  it("keeps the secondary number and skips stats one side is missing", () => {
    const rows = teamStatRows(
      box({ penalties: 6, penalty_yards: 40, yards_total: 352 }),
      box({ penalties: 5, penalty_yards: 37 })
    );
    expect(rows.map((r) => r.label)).toEqual(["Penalties (Yards)"]);
    expect(rows[0].away).toEqual({ main: 6, sub: 40 });
  });
});

describe("punts", () => {
  it("shows the average to one decimal and favors fewer punts", () => {
    const [row] = teamStatRows(
      { punts: 2, punt_average: 42 } as TeamBoxScore,
      { punts: 1, punt_average: 51 } as TeamBoxScore
    );
    expect(row).toMatchObject({ label: "Punts (Avg)", away: { main: 2, sub: "42.0" }, home: { main: 1, sub: "51.0" } });
    expect(row.awayShare).toBeCloseTo(1 / 3);
  });
});

describe("matchupBarColors", () => {
  it("swaps a near-black primary for the alternate in dark mode", () => {
    // PIT: primary black, alternate gold
    expect(matchupBarColors("CIN", "PIT", "dark").home.toLowerCase()).toBe("#ffb612");
  });

  it("keeps two teams' bars apart when their primaries match", () => {
    // DAL and NE share navy #002a5c
    const { away, home } = matchupBarColors("NE", "DAL", "light");
    expect(away.toLowerCase()).not.toBe(home.toLowerCase());
  });
});
