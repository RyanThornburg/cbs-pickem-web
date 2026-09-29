import { HistoricalCareer, HistoricalRecords, HistoricalStanding } from "../../types";
import {
  buildCareerRows,
  buildRecordTiles,
  buildSeasonRows,
  finishTier,
  highestWinningScore,
  isUnknownChampion,
  ordinal,
} from "./recordsUtils";

const standing = (user_id: number, rank: number, score = 50): HistoricalStanding => ({
  user_id,
  name: `User ${user_id}`,
  rank,
  score,
  first_half_rank: null,
  first_half_score: null,
  second_half_rank: null,
  second_half_score: null,
});

const career = (
  user_id: number,
  finishes: Record<number, number>,
  opts: Partial<HistoricalCareer> = {}
): HistoricalCareer => {
  const seasons = Object.keys(finishes).map(Number);
  const ranks = Object.values(finishes);
  return {
    user_id,
    name: `User ${user_id}`,
    is_active: true,
    appearances: seasons,
    titles: ranks.filter((r) => r === 1).length,
    best_finish: Math.min(...ranks),
    best_finish_years: [],
    season_history: seasons.map((season) => ({
      season,
      incomplete: false,
      rank: finishes[season],
      score: 50 - finishes[season],
      first_half_rank: null,
      first_half_score: null,
      second_half_rank: null,
      second_half_score: null,
    })),
    ...opts,
  };
};

const records = (
  careers: HistoricalCareer[],
  champions: HistoricalRecords["champions"] = []
): HistoricalRecords => ({
  years: {
    "2023": { pool_name: "", incomplete: false, standings: [] },
    "2024": { pool_name: "", incomplete: false, standings: [] },
    "2025": { pool_name: "", incomplete: false, standings: [] },
  },
  champions,
  first_half_champions: [],
  second_half_champions: [],
  career: careers,
});

describe("ordinal", () => {
  it("handles the teens and the usual suffixes", () => {
    expect([1, 2, 3, 4, 11, 12, 13, 21, 22, 33].map(ordinal)).toEqual([
      "1st", "2nd", "3rd", "4th", "11th", "12th", "13th", "21st", "22nd", "33rd",
    ]);
  });
});

describe("champions", () => {
  const champions = [
    { year: 2023, names: ["A"], score: 55 },
    { year: 2024, names: ["B", "C"], score: 61 },
    { year: 2025, names: ["??? unknown/missing user"], score: null, incomplete: true },
  ];

  it("spots the unknown-champion placeholder", () => {
    expect(champions.map(isUnknownChampion)).toEqual([false, false, true]);
  });

  it("finds the highest winning score, skipping unknown years", () => {
    expect(highestWinningScore(records([], champions))).toBe(61);
  });
});

describe("buildSeasonRows", () => {
  it("labels ties and counts the players missing before each row", () => {
    // Ranks 1, T3, T3, 6: rank 2 and rank 5 are players not on file.
    const rows = buildSeasonRows([standing(4, 6), standing(1, 1), standing(2, 3), standing(3, 3)]);
    expect(rows.map((r) => [r.user_id, r.rankLabel, r.missingBefore])).toEqual([
      [1, "1", 0],
      [2, "T3", 1],
      [3, "T3", 0],
      [4, "6", 1],
    ]);
  });

  it("counts a missing champion", () => {
    const rows = buildSeasonRows([standing(1, 3), standing(2, 4)]);
    expect(rows[0].missingBefore).toBe(2);
    expect(rows[1].missingBefore).toBe(0);
  });

  it("labels half-season ties separately from the overall rank", () => {
    const rows = buildSeasonRows([
      { ...standing(1, 1), first_half_rank: 2 },
      { ...standing(2, 2), first_half_rank: 2 },
      { ...standing(3, 3), second_half_rank: 1 },
    ]);
    expect(rows.map((r) => [r.firstHalfLabel, r.secondHalfLabel])).toEqual([
      ["T2", undefined],
      ["T2", undefined],
      [undefined, "1"],
    ]);
  });
});

describe("buildCareerRows", () => {
  it("counts top finishes and averages", () => {
    const [row] = buildCareerRows(records([career(1, { 2023: 1, 2024: 4, 2025: 7 })]));
    expect(row).toMatchObject({ seasons: 3, titles: 1, top3: 1, top5: 2, best: 1, avgFinish: 4 });
    expect(row.byYear.get(2024)).toEqual({ rank: 4, score: 46 });
  });

  it("leaves best finish undefined when the data has 0", () => {
    const [row] = buildCareerRows(records([career(1, { 2025: 9 }, { best_finish: 0 })]));
    expect(row.best).toBeUndefined();
  });
});

describe("buildRecordTiles", () => {
  const tile = (data: HistoricalRecords, label: string) =>
    buildRecordTiles(data, buildCareerRows(data), 2026).find((t) => t.label === label);

  it("requires being in this season's pool to have never missed a season", () => {
    const data = records([
      career(1, { 2023: 5, 2024: 5, 2025: 5 }),
      career(2, { 2023: 6, 2024: 6, 2025: 6 }, { is_active: false }),
      career(3, { 2024: 7, 2025: 7 }),
    ]);
    const never = tile(data, "Never missed a season");
    expect(never?.value).toBe("4");
    expect(never?.holders.map((h) => h.userId)).toEqual([1]);
  });

  it("finds the biggest climb between back-to-back seasons only", () => {
    const data = records([
      career(1, { 2023: 20, 2024: 5 }),
      career(2, { 2023: 30, 2025: 1 }),
    ]);
    const climb = tile(data, "Biggest one-year climb");
    expect(climb?.value).toBe("15");
    expect(climb?.holders.map((h) => h.userId)).toEqual([1]);
  });

  it("keeps the best average finish to players with enough seasons", () => {
    const data = records([
      career(1, { 2023: 1 }),
      career(2, { 2019: 4, 2020: 4, 2021: 4, 2022: 4, 2023: 4 }),
    ]);
    expect(tile(data, "Best average finish")?.holders.map((h) => h.userId)).toEqual([2]);
  });

  it("finds the longest top-10 streak", () => {
    const data = records([
      career(1, { 2023: 3, 2024: 12, 2025: 2 }),
      career(2, { 2023: 9, 2024: 10, 2025: 11 }),
    ]);
    const streak = tile(data, "Longest top-10 streak");
    expect(streak?.value).toBe("2");
    expect(streak?.detail).toBe("2023–2024");
  });

  it("marks tied record holders", () => {
    const data = records([career(1, { 2023: 1 }), career(2, { 2024: 1 })]);
    expect(tile(data, "Most titles")?.detail).toBe("2-way tie");
  });
});

describe("finishTier", () => {
  it("buckets ranks", () => {
    expect([1, 2, 3, 4, 5, 6, 10, 11, 30].map(finishTier)).toEqual([1, 2, 2, 3, 3, 4, 4, 5, 5]);
  });
});
