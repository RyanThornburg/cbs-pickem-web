import {
  CareerTrend,
  PickBias,
  SeasonHistoryEntry,
  SpotTeam,
  UserSeasonTrends,
  VolumeWeightedTeam,
} from "../../types";
import {
  bestFinishSummary,
  careerTrendText,
  isRedundantSpot,
  spotTeamText,
  strongestPickLean,
  volumeWeightedTeamText,
} from "./UserTrendPanel";

const season = (year: number, rank: number): SeasonHistoryEntry =>
  ({ season: year, rank, incomplete: false, score: 60 }) as SeasonHistoryEntry;

const trends = (
  career: Partial<UserSeasonTrends["career"]>
): UserSeasonTrends =>
  ({
    career: {
      best_finish: 0,
      best_finish_years: [],
      season_history: [],
      trend: null,
      ...career,
    },
  }) as unknown as UserSeasonTrends;

const trend = (
  direction: string,
  prior: [number, number],
  last: [number, number]
): CareerTrend => ({
  direction,
  prior_season: { season: prior[0], rank: prior[1], score: 50 },
  last_season: { season: last[0], rank: last[1], score: 50 },
  rank_change: prior[1] - last[1],
});

describe("careerTrendText", () => {
  it("anchors both ranks to their seasons, never reading as a current place", () => {
    expect(
      careerTrendText(
        trends({ trend: trend("improving", [2024, 12], [2025, 5]) })
      )
    ).toBe("Climbed from 12th in 2024 to 5th in 2025.");
    expect(
      careerTrendText(
        trends({ trend: trend("declining", [2024, 1], [2025, 3]) })
      )
    ).toBe("Fell from 1st in 2024 to 3rd in 2025.");
    expect(
      careerTrendText(trends({ trend: trend("same", [2024, 2], [2025, 2]) }))
    ).toBe("Finished 2nd in 2025, same as 2024.");
  });

  it("uses th for 11th-13th", () => {
    expect(
      careerTrendText(
        trends({ trend: trend("improving", [2024, 13], [2025, 11]) })
      )
    ).toBe("Climbed from 13th in 2024 to 11th in 2025.");
    expect(
      careerTrendText(
        trends({ trend: trend("declining", [2024, 21], [2025, 22]) })
      )
    ).toBe("Fell from 21st in 2024 to 22nd in 2025.");
  });

  it("falls back when there aren't two closed seasons", () => {
    const empty = "Not enough season history yet.";
    expect(careerTrendText(trends({ trend: null }))).toBe(empty);
    expect(
      careerTrendText(
        trends({
          trend: { ...trend("same", [2024, 1], [2025, 1]), prior_season: null },
        })
      )
    ).toBe(empty);
  });
});

describe("bestFinishSummary", () => {
  it("lists every top-5 season grouped by rank, best first, years newest first", () => {
    // bill morlok's real career.
    const history = [
      season(2013, 3),
      season(2015, 2),
      season(2016, 9),
      season(2017, 4),
      season(2020, 1),
      season(2023, 2),
      season(2025, 2),
    ];
    expect(
      bestFinishSummary(
        trends({
          best_finish: 1,
          best_finish_years: [2020],
          season_history: history,
        })
      )
    ).toEqual({
      label: "Top finishes",
      value: "1st (2020), 2nd (2025, 2023, 2015), 3rd (2013), 4th (2017)",
    });
  });

  it("shows the single best finish when there's at most one top-5 season", () => {
    expect(
      bestFinishSummary(
        trends({
          best_finish: 7,
          best_finish_years: [2019, 2022],
          season_history: [season(2019, 7), season(2022, 7)],
        })
      )
    ).toEqual({ label: "Best finish", value: "7th place (2019, 2022)" });
    expect(
      bestFinishSummary(
        trends({
          best_finish: 3,
          best_finish_years: [2021],
          season_history: [season(2021, 3), season(2022, 8)],
        })
      )
    ).toEqual({ label: "Best finish", value: "3rd place (2021)" });
  });

  it("shows nothing outside the top 10 or with no closed season", () => {
    expect(
      bestFinishSummary(
        trends({
          best_finish: 11,
          best_finish_years: [2020],
          season_history: [season(2020, 11)],
        })
      )
    ).toBeNull();
    expect(bestFinishSummary(trends({ best_finish: 0 }))).toBeNull();
  });
});

describe("strongestPickLean", () => {
  const bias = (home: number, favorite: number, picks = 15): PickBias => ({
    home: { pct: home, picks },
    away: { pct: 1 - home, picks },
    favorite: { pct: favorite, picks },
    underdog: { pct: 1 - favorite, picks },
  });

  it("reports the more lopsided of the two axes, whichever side it leans", () => {
    expect(strongestPickLean(bias(0.7, 0.8))).toEqual({
      label: "the favorite",
      pct: 0.8,
    });
    expect(strongestPickLean(bias(0.2, 0.6))).toEqual({
      label: "away teams",
      pct: 0.8,
    });
    expect(strongestPickLean(bias(0.5, 0.25))).toEqual({
      label: "the underdog",
      pct: 0.75,
    });
  });

  it("needs a real lean and enough picks", () => {
    expect(strongestPickLean(bias(0.6, 0.55))).toBeNull();
    expect(strongestPickLean(bias(0.65, 0.5))).toEqual({
      label: "home teams",
      pct: 0.65,
    });
    expect(strongestPickLean(bias(0.9, 0.9, 4))).toBeNull();
    expect(strongestPickLean(bias(0.9, 0.9, 5))).toEqual({
      label: "home teams",
      pct: 0.9,
    });
  });
});

const team = { id: 22, abbr: "KC", name: "Chiefs" };
const trap: VolumeWeightedTeam = {
  team,
  wins: 2,
  losses: 6,
  win_pct: 0.25,
  pct_of_picks: 0.333,
};
const spot = (picks: number, id = team.id): SpotTeam => ({
  team: { ...team, id },
  picks,
  accuracy: 0.3,
});

describe("matchup card text", () => {
  it("formats trap/lucky and blind/sweet spot teams", () => {
    expect(volumeWeightedTeamText(trap)).toBe(
      "2-6 picking the Chiefs (33% of all picks)"
    );
    expect(spotTeamText(spot(10))).toBe(
      "30% correct on Chiefs games (10 picks, either side)"
    );
  });
});

describe("isRedundantSpot", () => {
  it("drops a spot card that repeats the trap/lucky card's team and pick count", () => {
    expect(isRedundantSpot(trap, spot(8))).toBe(true);
  });

  it("keeps it when the user also faded that team, or it's another team", () => {
    expect(isRedundantSpot(trap, spot(10))).toBe(false);
    expect(isRedundantSpot(trap, spot(8, 99))).toBe(false);
    expect(isRedundantSpot(null, spot(8))).toBe(false);
    expect(isRedundantSpot(trap, null)).toBe(false);
  });
});
