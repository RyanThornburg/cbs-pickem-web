import { UserPick } from "../../types";

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
  prize: "1st half" | "2nd half" | "Overall";
}

interface PaidLineRow {
  place: number | null;
  second_half_place: number | null;
}

// Where the dashed "paid" lines go in User Picks, keyed by the index of the
// row they sit under. Only drawn when the table is in rank order: by place
// (overall, plus the 1st half while it's being played, since until the 2nd
// half starts both rank the same points) or by 2nd-half place. Everyone tied
// at a cutoff sits above its line, and there's no line when nobody is below
// it (e.g. week 1 before any scores, when everyone is tied for 1st).
export const paidLines = (
  rows: PaidLineRow[],
  sort: { id: string; desc: boolean } | undefined,
  paid: { overall: number; first_half: number; second_half: number },
  secondHalf: boolean
): Map<number, PaidLine[]> => {
  const lines = new Map<number, PaidLine[]>();
  if (!sort || sort.desc) return lines;

  const add = (
    placeOf: (row: PaidLineRow) => number | null,
    cutoff: number,
    prize: PaidLine["prize"]
  ) => {
    const what = prize === "Overall" ? " overall" : `, ${prize}`;
    let last = -1;
    rows.forEach((row, i) => {
      const place = placeOf(row);
      if (place != null && place <= cutoff) last = i;
    });
    const next = rows[last + 1];
    const nextPlace = next ? placeOf(next) : null;
    if (last < 0 || nextPlace == null || nextPlace <= cutoff) return;
    const inMoney = last + 1;
    const tie = inMoney > cutoff ? ` (${inMoney} with the tie)` : "";
    const list = lines.get(last) ?? [];
    list.push({ label: `Paid · top ${cutoff}${what}${tie}`, prize });
    lines.set(last, list);
  };

  if (sort.id === "place") {
    if (!secondHalf) add((r) => r.place, paid.first_half, "1st half");
    add((r) => r.place, paid.overall, "Overall");
  } else if (sort.id === "second_half_place" && secondHalf) {
    add((r) => r.second_half_place, paid.second_half, "2nd half");
  }
  return lines;
};

export interface MoneyStanding {
  prize: "1st half" | "2nd half" | "Overall";
  cutoff: number;
  inMoney: boolean;
  // Points behind the last paid score (tying it is enough); 0 when in.
  ptsOut: number;
}

interface MoneyStandingRow {
  id: string;
  place: number | null;
  second_half_place: number | null;
  score: number;
  second_half_score: number;
}

// Where one player stands against each prize being played for right now,
// on the same displayed scores and ranks as the table and its paid lines:
// the 1st half and overall until the 2nd half starts (both rank the same
// points), then the 2nd half and overall. Empty before anyone has scored,
// when everyone is tied for 1st.
export const moneyStandings = (
  rows: MoneyStandingRow[],
  userId: string,
  paid: { overall: number; first_half: number; second_half: number },
  secondHalf: boolean
): MoneyStanding[] => {
  const me = rows.find((row) => row.id === userId);
  if (!me || !rows.some((row) => row.score > 0)) return [];

  const standing = (
    prize: MoneyStanding["prize"],
    cutoff: number,
    placeOf: (row: MoneyStandingRow) => number | null,
    scoreOf: (row: MoneyStandingRow) => number
  ): MoneyStanding | null => {
    const myPlace = placeOf(me);
    if (myPlace == null) return null;
    if (myPlace <= cutoff) return { prize, cutoff, inMoney: true, ptsOut: 0 };
    const paidScores = rows
      .filter((row) => {
        const place = placeOf(row);
        return place != null && place <= cutoff;
      })
      .map(scoreOf);
    if (!paidScores.length) return null;
    const ptsOut = Math.max(0, Math.min(...paidScores) - scoreOf(me));
    return { prize, cutoff, inMoney: false, ptsOut };
  };

  const half = secondHalf
    ? standing(
        "2nd half",
        paid.second_half,
        (row) => row.second_half_place,
        (row) => row.second_half_score
      )
    : standing(
        "1st half",
        paid.first_half,
        (row) => row.place,
        (row) => row.score
      );
  const overall = standing(
    "Overall",
    paid.overall,
    (row) => row.place,
    (row) => row.score
  );
  return [half, overall].filter((s): s is MoneyStanding => s !== null);
};

// The season length isn't in the data, so it's frontend config like the
// thresholds above. The 1st half ends the week before
// `second_half_start_week`; the 2nd half and overall run to this week.
export const REGULAR_SEASON_WEEKS = 18;

// About how many points two players' scores drift apart in a week of five
// picks. The gap someone can still close grows with the square root of the
// weeks left, so a money line only shows when the gap is within
// round(MONEY_REACH_PTS * sqrt(weeks left)): 4 pts with 6 weeks left, 2 with
// 1. A display judgment, retuned like the thresholds above.
export const MONEY_REACH_PTS = 1.6;

// Weeks still to be scored for a prize, counting the browsed week until all
// of its games are final.
export const prizeWeeksLeft = (
  prize: MoneyStanding["prize"],
  week: number,
  secondHalfStartWeek: number,
  weekComplete: boolean
): number => {
  const lastWeek =
    prize === "1st half" ? secondHalfStartWeek - 1 : REGULAR_SEASON_WEEKS;
  return Math.max(0, lastWeek - week + (weekComplete ? 0 : 1));
};

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
  week: number,
  secondHalfStartWeek: number,
  weekComplete: boolean
): ShownMoneyStanding[] =>
  standings
    .map((standing) => ({
      ...standing,
      weeksLeft: prizeWeeksLeft(
        standing.prize,
        week,
        secondHalfStartWeek,
        weekComplete
      ),
    }))
    .filter(
      (standing) =>
        standing.inMoney || standing.ptsOut <= moneyReach(standing.weeksLeft)
    );
