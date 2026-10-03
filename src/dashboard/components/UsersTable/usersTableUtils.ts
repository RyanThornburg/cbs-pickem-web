import { PayPeriod, RankedUser, UserPick } from "../../types";
import { ordinal } from "../../helper";
import {
  activePeriods,
  OVERALL_KEY,
  overallPeriod,
  periodName,
  periodWeeksLeft,
  segmentsRankedLikeOverall,
  shownSegment,
} from "../../utils/payPeriods";

// Frontend display config, same reasoning as GamesCard's WEATHER_THRESHOLDS --
// the data repo exposes raw is_correct per pick; what counts as "hot" or
// "cold" for a given week is a judgment call likely to get retuned, so it
// lives here rather than in the data pipeline. Decided 2026-09-23.
export const WEEKLY_FORM_HOT_PCT = 0.75;
export const WEEKLY_FORM_COLD_PCT = 0.25;
// Below this many decided picks (final, or live and currently covering/not
// covering) the sample's too small to call -- early in a week everyone would
// otherwise show as "hot" or "cold" off one or two results. Those users still
// get the neutral icon, just flagged as too early rather than hidden.
export const WEEKLY_FORM_MIN_GRADED_PICKS = 3;

// A user only gets the season streak badge once they've actually strung
// together more than one week -- a single hot week isn't a "streak".
export const SEASON_STREAK_MIN_WEEKS = 2;

// pick_bias.*.current_streak counts consecutive PICKS, not weeks, with no
// guarantee those picks were even in the same week -- "N picks in a row"
// implies a traceable sequence a fan can't actually verify (5 one week, 5
// the next isn't a meaningful "streak" to a person). Using the season-wide
// pct instead sidesteps that entirely: a plain proportion, no ordering
// claim. Only surfaced once there's enough of a sample and a real lean.
export const PICK_BIAS_MIN_PICKS = 5;
export const PICK_BIAS_MIN_PCT = 0.65;

export type WeeklyForm = "hot" | "cold" | "neutral";

export interface WeeklyFormResult {
  form: WeeklyForm;
  won: number;
  lost: number;
  covering: number;
  notCovering: number;
  // won + lost + covering + notCovering -- what the hot/cold pct is taken over
  decided: number;
  total: number;
  // Fewer than WEEKLY_FORM_MIN_GRADED_PICKS decided: always "neutral"
  tooEarly: boolean;
}

// Final picks count by is_correct; picks in a live game count by their
// trending_status (CORRECT = covering, INCORRECT = not covering), so the icon
// moves during Sunday instead of waiting for games to go final. Always returns
// a result -- every user gets an icon, neutral until there's enough to call.
export const getWeeklyForm = (picks: UserPick[]): WeeklyFormResult => {
  let won = 0;
  let lost = 0;
  let covering = 0;
  let notCovering = 0;
  for (const pick of picks) {
    if (pick.is_correct === true) won++;
    else if (pick.is_correct === false) lost++;
    else if (pick.trending_status === "CORRECT") covering++;
    else if (pick.trending_status === "INCORRECT") notCovering++;
  }

  const decided = won + lost + covering + notCovering;
  const tooEarly = decided < WEEKLY_FORM_MIN_GRADED_PICKS;
  const pct = decided ? (won + covering) / decided : 0;

  const form: WeeklyForm = tooEarly
    ? "neutral"
    : pct >= WEEKLY_FORM_HOT_PCT
      ? "hot"
      : pct <= WEEKLY_FORM_COLD_PCT
        ? "cold"
        : "neutral";

  return {
    form,
    won,
    lost,
    covering,
    notCovering,
    decided,
    total: picks.length,
    tooEarly,
  };
};

export interface PaidLine {
  label: string;
  // The period it's for, matched against MoneyStanding.key.
  key: string;
}

// A row's displayed place and score (live bonus included) in each period,
// keyed by PayPeriod.key.
export type RowPeriods = Record<
  string,
  { place: number | null; score: number } | undefined
>;

// The displayed places and scores for a user's row: graded points plus the
// live bonus in every period the browsed week belongs to (the same scores
// GetUserByWeek ranks on).
export const rowPeriods = (
  user: Pick<
    RankedUser,
    "place" | "periods" | "cumulative_score" | "trending_score"
  >,
  periods: PayPeriod[],
  week: number
): RowPeriods => {
  const active = new Set(activePeriods(periods, week).map((p) => p.key));
  const out: RowPeriods = {
    [OVERALL_KEY]: {
      place: user.place,
      score: user.cumulative_score + user.trending_score,
    },
  };
  periods.forEach((period) => {
    if (period.key === OVERALL_KEY) return;
    const standing = user.periods[period.key];
    out[period.key] = {
      place: standing?.place ?? null,
      score:
        (standing?.score ?? 0) +
        (active.has(period.key) ? user.trending_score : 0),
    };
  });
  return out;
};

interface PaidLineRow {
  periods: RowPeriods;
}

const periodPlace = (row: PaidLineRow, key: string) =>
  row.periods[key]?.place ?? null;

// Where the dashed "paid" lines go in User Picks, keyed by the index of the
// row they sit under. Only drawn when the table is in rank order: by place
// (overall, plus any segment that started with the season while it's being
// played, since until the next one starts both rank the same points) or by
// the shown segment's place. Everyone tied at a cutoff sits above its line,
// and there's no line when nobody is below it (e.g. week 1 before any
// scores, when everyone is tied for 1st).
export const paidLines = (
  rows: PaidLineRow[],
  sort: { id: string; desc: boolean } | undefined,
  periods: PayPeriod[],
  week: number
): Map<number, PaidLine[]> => {
  const lines = new Map<number, PaidLine[]>();
  if (!sort || sort.desc) return lines;

  const add = (period: PayPeriod) => {
    const cutoff = period.paid_places;
    const what =
      period.key === OVERALL_KEY ? " overall" : `, ${periodName(period)}`;
    let last = -1;
    rows.forEach((row, i) => {
      const place = periodPlace(row, period.key);
      if (place != null && place <= cutoff) last = i;
    });
    const next = rows[last + 1];
    const nextPlace = next ? periodPlace(next, period.key) : null;
    if (last < 0 || nextPlace == null || nextPlace <= cutoff) return;
    const inMoney = last + 1;
    const tie = inMoney > cutoff ? ` (${inMoney} with the tie)` : "";
    const list = lines.get(last) ?? [];
    list.push({ label: `Paid · top ${cutoff}${what}${tie}`, key: period.key });
    lines.set(last, list);
  };

  if (sort.id === "place") {
    segmentsRankedLikeOverall(periods, week).forEach(add);
    const overall = overallPeriod(periods);
    if (overall) add(overall);
  } else if (sort.id === "segment_place") {
    const segment = shownSegment(periods, week);
    if (segment) add(segment);
  }
  return lines;
};

export interface MoneyStanding {
  key: string;
  // The period's name, "1st half" or "Overall".
  prize: string;
  cutoff: number;
  inMoney: boolean;
  // Points behind the last paid score (tying it is enough); 0 when in.
  ptsOut: number;
}

interface MoneyStandingRow {
  id: string;
  periods: RowPeriods;
}

// Where one player stands against each prize being played for in this
// week (the current segment, then overall), on the same displayed scores
// and ranks as the table and its paid lines. Empty before anyone has
// scored, when everyone is tied for 1st.
export const moneyStandings = (
  rows: MoneyStandingRow[],
  userId: string,
  periods: PayPeriod[],
  week: number
): MoneyStanding[] => {
  const me = rows.find((row) => row.id === userId);
  const overallScore = (row: MoneyStandingRow) =>
    row.periods[OVERALL_KEY]?.score ?? 0;
  if (!me || !rows.some((row) => overallScore(row) > 0)) return [];

  const standing = (period: PayPeriod): MoneyStanding | null => {
    const prize = periodName(period);
    const cutoff = period.paid_places;
    const mine = me.periods[period.key];
    if (mine?.place == null) return null;
    if (mine.place <= cutoff) {
      return { key: period.key, prize, cutoff, inMoney: true, ptsOut: 0 };
    }
    const paidScores = rows
      .map((row) => row.periods[period.key])
      .filter((p) => p?.place != null && p.place <= cutoff)
      .map((p) => p!.score);
    if (!paidScores.length) return null;
    const ptsOut = Math.max(0, Math.min(...paidScores) - mine.score);
    return { key: period.key, prize, cutoff, inMoney: false, ptsOut };
  };

  return activePeriods(periods, week)
    .map(standing)
    .filter((s): s is MoneyStanding => s !== null);
};

// About how many points two players' scores drift apart in a week of five
// picks. The gap someone can still close grows with the square root of the
// weeks left, so a money line only shows when the gap is within
// round(MONEY_REACH_PTS * sqrt(weeks left)): 4 pts with 6 weeks left, 2 with
// 1. A display judgment, retuned like the thresholds above.
export const MONEY_REACH_PTS = 1.6;

export const moneyReach = (weeksLeft: number): number =>
  Math.round(MONEY_REACH_PTS * Math.sqrt(weeksLeft));

export interface ShownMoneyStanding extends MoneyStanding {
  weeksLeft: number;
}

// The standings worth showing a player: prizes they're in the money for,
// or close enough to catch with the weeks left. Prizes out of reach are
// left out rather than reported as "N pts out".
export const shownMoneyStandings = (
  standings: MoneyStanding[],
  periods: PayPeriod[],
  week: number,
  weekComplete: boolean
): ShownMoneyStanding[] =>
  standings
    .flatMap((standing) => {
      const period = periods.find((p) => p.key === standing.key);
      return period
        ? [
            {
              ...standing,
              weeksLeft: periodWeeksLeft(period, week, weekComplete),
            },
          ]
        : [];
    })
    .filter(
      (standing) =>
        standing.inMoney || standing.ptsOut <= moneyReach(standing.weeksLeft)
    );

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;

// What a screen reader hears for the header's player card: the card lays
// its facts out in a grid with no words between them, so read as text they
// would run together ("Scott Miller4th · 9 pts1st half…").
export const playerSummaryText = (
  user: Pick<
    RankedUser,
    "name" | "place" | "periods" | "cumulative_score" | "trending_score"
  >,
  // The shown segment (shownSegment), for "2nd half 3rd".
  segment: PayPeriod | null,
  standings: ShownMoneyStanding[],
  asOfWeek?: number
): string => {
  const parts = [user.name];
  if (user.place != null) parts.push(ordinal(user.place));
  const total = user.cumulative_score + user.trending_score;
  parts.push(
    plural(total, "point") +
      (user.trending_score > 0 ? `, ${user.trending_score} covering now` : "")
  );
  const segmentPlace = segment && user.periods[segment.key]?.place;
  if (segment && segmentPlace != null) {
    parts.push(`${periodName(segment)} ${ordinal(segmentPlace)}`);
  }
  const money = standings.map(
    (s) =>
      `${s.prize}: ${
        s.inMoney
          ? `in the money, top ${s.cutoff}`
          : `${plural(s.ptsOut, "point")} out, ${plural(s.weeksLeft, "week")} left`
      }`
  );
  return [
    parts.join(", "),
    ...money,
    ...(asOfWeek != null ? [`As of week ${asOfWeek}`] : []),
  ].join(". ");
};
