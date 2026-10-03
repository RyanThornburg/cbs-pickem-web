import { PayPeriod } from "../types";

// The season length isn't always in the data (a period's end_week is null
// until the data side has loaded the season's weeks), so this is the
// fallback.
export const REGULAR_SEASON_WEEKS = 18;

export const OVERALL_KEY = "overall";

const endOf = (period: PayPeriod) => period.end_week ?? REGULAR_SEASON_WEEKS;

const covers = (period: PayPeriod, week: number) =>
  week >= period.start_week && week <= endOf(period);

export const overallPeriod = (periods: PayPeriod[]): PayPeriod | undefined =>
  periods.find((p) => p.key === OVERALL_KEY);

// Every period being played in this week: the season segments first, then
// overall, the order the money lines and paid lines read in.
export const activePeriods = (
  periods: PayPeriod[],
  week: number
): PayPeriod[] => [
  ...periods.filter((p) => p.key !== OVERALL_KEY && covers(p, week)),
  ...periods.filter((p) => p.key === OVERALL_KEY),
];

// The segment that gets its own place and score columns, leader card and
// "2nd half 3rd" in the header: the one being played this week, unless it
// started with the season. Until then it ranks the same points as overall
// (the 1st half today), so it would only repeat it.
export const shownSegment = (
  periods: PayPeriod[],
  week: number
): PayPeriod | null => {
  const seasonStart = overallPeriod(periods)?.start_week ?? 1;
  return (
    periods.find(
      (p) =>
        p.key !== OVERALL_KEY && p.start_week > seasonStart && covers(p, week)
    ) ?? null
  );
};

// Segments that rank the same points as overall this week (they started
// with the season), so the overall place column carries their paid lines.
export const segmentsRankedLikeOverall = (
  periods: PayPeriod[],
  week: number
): PayPeriod[] => {
  const seasonStart = overallPeriod(periods)?.start_week ?? 1;
  return periods.filter(
    (p) =>
      p.key !== OVERALL_KEY && p.start_week === seasonStart && covers(p, week)
  );
};

const ORDINAL_WORDS: Record<string, string> = {
  first: "1st",
  second: "2nd",
  third: "3rd",
  fourth: "4th",
  fifth: "5th",
  sixth: "6th",
};

// "Second Half" → "2nd half", "Overall" → "Overall": the sentence-case
// label the app uses in money lines, headers and cards.
export const periodName = (period: Pick<PayPeriod, "label">): string => {
  const words = period.label.trim().split(/\s+/);
  return words
    .map((word, i) => {
      const lower = word.toLowerCase();
      // Only before another word: "Second Third" is "2nd third".
      if (ORDINAL_WORDS[lower] && i < words.length - 1) {
        return ORDINAL_WORDS[lower];
      }
      return i === 0
        ? word[0].toUpperCase() + word.slice(1).toLowerCase()
        : lower;
    })
    .join(" ");
};

// Narrow column header on phones: "2nd half" → "2H", "3rd quarter" → "3Q".
// Anything that doesn't start with an ordinal keeps its first word.
export const periodAbbr = (period: Pick<PayPeriod, "label">): string => {
  const [first, second] = periodName(period).split(" ");
  const ordinal = /^(\d+)(st|nd|rd|th)$/.exec(first);
  if (ordinal && second) return `${ordinal[1]}${second[0].toUpperCase()}`;
  return first;
};

// "the whole season", "weeks 1–9", "week 10 on" (no known end).
export const periodWeeksText = (period: PayPeriod): string => {
  if (period.key === OVERALL_KEY) return "the whole season";
  if (period.end_week == null) return `week ${period.start_week} on`;
  if (period.end_week === period.start_week) return `week ${period.start_week}`;
  return `weeks ${period.start_week}–${period.end_week}`;
};

// Weeks still to be scored in a period, counting the browsed week until all
// of its games are final.
export const periodWeeksLeft = (
  period: PayPeriod,
  week: number,
  weekComplete: boolean
): number => Math.max(0, endOf(period) - week + (weekComplete ? 0 : 1));
