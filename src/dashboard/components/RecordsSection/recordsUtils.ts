import {
  HistoricalChampion,
  HistoricalRecords,
  HistoricalStanding,
} from "../../types";

// Half-season results (first/second half standings and champions) only
// exist from this season on. Earlier years get an "incomplete" note instead.
export const HALVES_FROM_SEASON = 2025;

// "Best average finish" needs a real sample, or one great season wins it.
export const BEST_AVG_MIN_SEASONS = 5;

export const ordinal = (n: number): string => {
  const suffixes = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (suffixes[(v - 20) % 10] || suffixes[v] || suffixes[0]);
};

// A few names in the data carry double spaces ("Omar  Selim").
export const cleanName = (name: string): string => name.replace(/\s+/g, " ").trim();

// 2015 and 2016 champions come through as "??? unknown/missing user".
export const isUnknownChampion = (champion: HistoricalChampion): boolean =>
  champion.names.length === 0 || champion.names.some((name) => name.startsWith("???"));

export const closedSeasons = (data: HistoricalRecords): number[] =>
  Object.keys(data.years)
    .map(Number)
    .sort((a, b) => a - b);

export const highestWinningScore = (data: HistoricalRecords): number | undefined => {
  const scores = data.champions
    .filter((c) => !isUnknownChampion(c) && c.score != null)
    .map((c) => c.score as number);
  return scores.length ? Math.max(...scores) : undefined;
};

export interface CareerRow {
  id: number;
  name: string;
  active: boolean;
  seasons: number;
  titles: number;
  top3: number;
  top5: number;
  // undefined (not 0) when there's nothing to show, so it sorts last.
  best: number | undefined;
  avgFinish: number | undefined;
  avgScore: number | undefined;
  // Finish by season year.
  byYear: Map<number, { rank: number; score: number }>;
}

const average = (values: number[]): number | undefined =>
  values.length ? values.reduce((a, b) => a + b, 0) / values.length : undefined;

export const buildCareerRows = (data: HistoricalRecords): CareerRow[] =>
  data.career.map((career) => {
    const history = career.season_history;
    const ranks = history.map((s) => s.rank);
    return {
      id: career.user_id,
      name: cleanName(career.name),
      active: career.is_active,
      seasons: career.appearances.length,
      titles: career.titles,
      top3: ranks.filter((r) => r <= 3).length,
      top5: ranks.filter((r) => r <= 5).length,
      best: career.best_finish > 0 ? career.best_finish : undefined,
      avgFinish: average(ranks),
      avgScore: average(history.map((s) => s.score)),
      byYear: new Map(history.map((s) => [s.season, { rank: s.rank, score: s.score }])),
    };
  });

// ---- Records tiles ----

export interface RecordHolder {
  userId?: number;
  text: string;
}

export interface RecordTile {
  label: string;
  value: string;
  unit: string;
  holders: RecordHolder[];
  detail?: string;
}

const holdersOf = (rows: CareerRow[]): RecordHolder[] =>
  rows.map((row) => ({ userId: row.id, text: row.name }));

const tieDetail = (count: number): string | undefined =>
  count > 1 ? `${count}-way tie` : undefined;

export const buildRecordTiles = (
  data: HistoricalRecords,
  rows: CareerRow[],
  currentSeason: number
): RecordTile[] => {
  const years = closedSeasons(data);
  const tiles: RecordTile[] = [];

  const scored = data.champions.filter((c) => !isUnknownChampion(c) && c.score != null);
  if (scored.length) {
    const hi = Math.max(...scored.map((c) => c.score as number));
    const lo = Math.min(...scored.map((c) => c.score as number));
    const his = scored.filter((c) => c.score === hi);
    const los = scored.filter((c) => c.score === lo);
    tiles.push({
      label: "Highest winning score",
      value: String(hi),
      unit: "pts",
      holders: his.map((c) => ({ text: `${c.names.map(cleanName).join(", ")} (${c.year})` })),
    });
    tiles.push({
      label: "Lowest winning score",
      value: String(lo),
      unit: "pts",
      holders: [{ text: los.map((c) => c.year).join(", ") }],
      detail: los.map((c) => c.names.map(cleanName).join(", ")).join(" · "),
    });
  }

  const pushMax = (label: string, unit: (n: number) => string, pick: (r: CareerRow) => number) => {
    const max = Math.max(0, ...rows.map(pick));
    if (max === 0) return;
    const holders = rows.filter((r) => pick(r) === max);
    tiles.push({
      label,
      value: String(max),
      unit: unit(max),
      holders: holdersOf(holders),
      detail: tieDetail(holders.length),
    });
  };
  pushMax("Most titles", (n) => (n === 1 ? "title" : "titles"), (r) => r.titles);
  pushMax("Most top-5 finishes", () => "", (r) => r.top5);

  // Longest run of consecutive seasons finishing top 10.
  let streak: { length: number; holders: { row: CareerRow; start: number; end: number }[] } = {
    length: 0,
    holders: [],
  };
  rows.forEach((row) => {
    let run = 0;
    let start = 0;
    years.forEach((year) => {
      const finish = row.byYear.get(year);
      if (finish && finish.rank <= 10) {
        if (run === 0) start = year;
        run += 1;
        if (run > streak.length) streak = { length: run, holders: [{ row, start, end: year }] };
        else if (run === streak.length) streak.holders.push({ row, start, end: year });
      } else {
        run = 0;
      }
    });
  });
  if (streak.length > 0) {
    tiles.push({
      label: "Longest top-10 streak",
      value: String(streak.length),
      unit: streak.length === 1 ? "season" : "seasons",
      holders: holdersOf(streak.holders.map((h) => h.row)),
      detail: streak.holders.map((h) => `${h.start}–${h.end}`).join(", "),
    });
  }

  // Biggest rank improvement between back-to-back seasons.
  let climb: { places: number; holders: { row: CareerRow; year: number; from: number; to: number }[] } = {
    places: 0,
    holders: [],
  };
  rows.forEach((row) => {
    years.forEach((year) => {
      const a = row.byYear.get(year);
      const b = row.byYear.get(year + 1);
      if (!a || !b) return;
      const places = a.rank - b.rank;
      if (places > climb.places) climb = { places, holders: [{ row, year, from: a.rank, to: b.rank }] };
      else if (places > 0 && places === climb.places) climb.holders.push({ row, year, from: a.rank, to: b.rank });
    });
  });
  if (climb.places > 0) {
    tiles.push({
      label: "Biggest one-year climb",
      value: String(climb.places),
      unit: "places",
      holders: holdersOf(climb.holders.map((h) => h.row)),
      detail: climb.holders
        .map((h) => `${ordinal(h.from)} in ${h.year} → ${ordinal(h.to)} in ${h.year + 1}`)
        .join(" · "),
    });
  }

  const eligible = rows.filter(
    (r) => r.seasons >= BEST_AVG_MIN_SEASONS && r.avgFinish !== undefined
  );
  if (eligible.length) {
    const best = Math.min(...eligible.map((r) => r.avgFinish as number));
    const holders = eligible.filter((r) => r.avgFinish === best);
    tiles.push({
      label: "Best average finish",
      value: best.toFixed(1),
      unit: "avg",
      holders: holdersOf(holders),
      detail: `min. ${BEST_AVG_MIN_SEASONS} seasons`,
    });
  }

  // Every closed season on record, and in the pool this season too
  // (is_active). Without the second check, someone who played every past
  // season but sat this one out would still qualify.
  const everySeason = rows.filter((r) => r.active && years.every((y) => r.byYear.has(y)));
  if (years.length && everySeason.length) {
    tiles.push({
      label: "Never missed a season",
      value: String(years.length + 1),
      unit: "seasons",
      holders: holdersOf(everySeason),
      detail: `every year from ${years[0]} through ${currentSeason}`,
    });
  }

  return tiles;
};

// ---- Season standings ----

export interface SeasonRow extends HistoricalStanding {
  // "T3" when the rank is shared.
  rankLabel: string;
  firstHalfLabel: string | undefined;
  secondHalfLabel: string | undefined;
  // How many ranks are missing right before this row (players not on file).
  missingBefore: number;
}

const tieLabel = (rank: number | null, counts: Map<number, number>): string | undefined =>
  rank == null ? undefined : `${(counts.get(rank) ?? 0) > 1 ? "T" : ""}${rank}`;

const countBy = (values: (number | null)[]): Map<number, number> => {
  const counts = new Map<number, number>();
  values.forEach((v) => {
    if (v != null) counts.set(v, (counts.get(v) ?? 0) + 1);
  });
  return counts;
};

export const buildSeasonRows = (standings: HistoricalStanding[]): SeasonRow[] => {
  const sorted = [...standings].sort((a, b) => a.rank - b.rank);
  const rankCounts = countBy(sorted.map((s) => s.rank));
  const firstCounts = countBy(sorted.map((s) => s.first_half_rank));
  const secondCounts = countBy(sorted.map((s) => s.second_half_rank));

  // Standard competition ranking: after rank r shared by n players, the next
  // rank is r + n. Anything past that is a player we don't have.
  let expected = 1;
  return sorted.map((standing) => {
    const missingBefore = Math.max(0, standing.rank - expected);
    if (standing.rank >= expected) {
      expected = standing.rank + (rankCounts.get(standing.rank) ?? 1);
    }
    return {
      ...standing,
      name: cleanName(standing.name),
      rankLabel: tieLabel(standing.rank, rankCounts) as string,
      firstHalfLabel: tieLabel(standing.first_half_rank, firstCounts),
      secondHalfLabel: tieLabel(standing.second_half_rank, secondCounts),
      missingBefore,
    };
  });
};

// ---- Finishes grid ----

// 1 = champion, 2 = 2nd-3rd, 3 = 4th-5th, 4 = 6th-10th, 5 = 11th and below.
export type FinishTier = 1 | 2 | 3 | 4 | 5;

export const finishTier = (rank: number): FinishTier => {
  if (rank === 1) return 1;
  if (rank <= 3) return 2;
  if (rank <= 5) return 3;
  if (rank <= 10) return 4;
  return 5;
};
