import {
  HistoricalChampion,
  HistoricalRecords,
  HistoricalStanding,
} from "../../types";
import { ordinal } from "../../helper";

// Half-season results (first/second half standings and champions) only
// exist from this season on. Earlier years get an "incomplete" note instead.
export const HALVES_FROM_SEASON = 2025;

// "Best average finish" needs a real sample, or one great season wins it.
export const BEST_AVG_MIN_SEASONS = 5;

// A few names in the data carry double spaces ("Omar  Selim").
export const cleanName = (name: string): string =>
  name.replace(/\s+/g, " ").trim();

// 2015 and 2016 champions come through as "??? unknown/missing user".
export const isUnknownChampion = (champion: HistoricalChampion): boolean =>
  champion.names.length === 0 ||
  champion.names.some((name) => name.startsWith("???"));

export const closedSeasons = (data: HistoricalRecords): number[] =>
  Object.keys(data.years)
    .map(Number)
    .sort((a, b) => a - b);

export const highestWinningScore = (
  data: HistoricalRecords
): number | undefined => {
  const scores = data.champions
    .filter((c) => !isUnknownChampion(c) && c.score != null)
    .map((c) => c.score as number);
  return scores.length ? Math.max(...scores) : undefined;
};

// All-time points: 10 for a title, 9 for 2nd, down to 1 for 10th, added up
// over every season. Rewards long good careers as well as peaks, so a single
// great season doesn't outrank ten solid ones. Display config: retune here.
export const FINISH_POINTS = [10, 9, 8, 7, 6, 5, 4, 3, 2, 1];

export const finishPoints = (rank: number): number =>
  FINISH_POINTS[rank - 1] ?? 0;

export interface CareerRow {
  id: number;
  name: string;
  active: boolean;
  seasons: number;
  // All-time points (see FINISH_POINTS).
  points: number;
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
      points: ranks.reduce((sum, rank) => sum + finishPoints(rank), 0),
      titles: career.titles,
      top3: ranks.filter((r) => r <= 3).length,
      top5: ranks.filter((r) => r <= 5).length,
      best: career.best_finish > 0 ? career.best_finish : undefined,
      avgFinish: average(ranks),
      avgScore: average(history.map((s) => s.score)),
      byYear: new Map(
        history.map((s) => [s.season, { rank: s.rank, score: s.score }])
      ),
    };
  });

// The all-time order: most points, then more titles, then the better average
// finish. Also every column's tiebreak in the All-time table (its sort is
// stable).
export const byAllTimeRank = (a: CareerRow, b: CareerRow): number =>
  b.points - a.points ||
  b.titles - a.titles ||
  (a.avgFinish ?? Infinity) - (b.avgFinish ?? Infinity);

// Each player's all-time place by byAllTimeRank, with ties sharing a place
// (standard competition ranking: 1, 2, 2, 4).
export const allTimePlaces = (
  rows: CareerRow[]
): Map<number, { place: number; tied: boolean }> => {
  const sorted = [...rows].sort(byAllTimeRank);
  const places = new Map<number, { place: number; tied: boolean }>();
  sorted.forEach((row, i) => {
    const prev = sorted[i - 1];
    const place =
      prev && byAllTimeRank(prev, row) === 0
        ? (places.get(prev.id)?.place ?? i + 1)
        : i + 1;
    places.set(row.id, { place, tied: false });
  });
  const counts = new Map<number, number>();
  places.forEach(({ place }) =>
    counts.set(place, (counts.get(place) ?? 0) + 1)
  );
  places.forEach((p) => (p.tied = (counts.get(p.place) ?? 0) > 1));
  return places;
};

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

  const scored = data.champions.filter(
    (c) => !isUnknownChampion(c) && c.score != null
  );
  if (scored.length) {
    const hi = Math.max(...scored.map((c) => c.score as number));
    const his = scored.filter((c) => c.score === hi);
    tiles.push({
      label: "Highest winning score",
      value: String(hi),
      unit: "pts",
      holders: his.map((c) => ({
        text: `${c.names.map(cleanName).join(", ")} (${c.year})`,
      })),
    });
  }

  const pushMax = (
    label: string,
    unit: (n: number) => string,
    pick: (r: CareerRow) => number
  ) => {
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
  pushMax(
    "Most titles",
    (n) => (n === 1 ? "title" : "titles"),
    (r) => r.titles
  );
  pushMax(
    "Most top-5 finishes",
    (n) => (n === 1 ? "finish" : "finishes"),
    (r) => r.top5
  );

  // Biggest rank improvement between back-to-back seasons.
  let climb: {
    places: number;
    holders: { row: CareerRow; year: number; from: number; to: number }[];
  } = {
    places: 0,
    holders: [],
  };
  rows.forEach((row) => {
    years.forEach((year) => {
      const a = row.byYear.get(year);
      const b = row.byYear.get(year + 1);
      if (!a || !b) return;
      const places = a.rank - b.rank;
      if (places > climb.places)
        climb = { places, holders: [{ row, year, from: a.rank, to: b.rank }] };
      else if (places > 0 && places === climb.places)
        climb.holders.push({ row, year, from: a.rank, to: b.rank });
    });
  });
  if (climb.places > 0) {
    tiles.push({
      label: "Biggest one-year climb",
      value: String(climb.places),
      unit: "places",
      holders: holdersOf(climb.holders.map((h) => h.row)),
      detail: climb.holders
        .map(
          (h) =>
            `${ordinal(h.from)} in ${h.year} → ${ordinal(h.to)} in ${h.year + 1}`
        )
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
  const everySeason = rows.filter(
    (r) => r.active && years.every((y) => r.byYear.has(y))
  );
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

const tieLabel = (
  rank: number | null,
  counts: Map<number, number>
): string | undefined =>
  rank == null ? undefined : `${(counts.get(rank) ?? 0) > 1 ? "T" : ""}${rank}`;

const countBy = (values: (number | null)[]): Map<number, number> => {
  const counts = new Map<number, number>();
  values.forEach((v) => {
    if (v != null) counts.set(v, (counts.get(v) ?? 0) + 1);
  });
  return counts;
};

export const buildSeasonRows = (
  standings: HistoricalStanding[]
): SeasonRow[] => {
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

// 1 = champion, 2 = 2nd, 3 = 3rd, 4 = 4th-5th, 5 = 6th-10th, 6 = 11th and
// below.
export type FinishTier = 1 | 2 | 3 | 4 | 5 | 6;

export const finishTier = (rank: number): FinishTier => {
  if (rank <= 3) return rank as 1 | 2 | 3;
  if (rank <= 5) return 4;
  if (rank <= 10) return 5;
  return 6;
};
