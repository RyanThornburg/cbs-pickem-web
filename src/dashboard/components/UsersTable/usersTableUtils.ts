import { UserPick } from "../../types";

// Frontend display config, same reasoning as GamesCard's WEATHER_THRESHOLDS --
// the data repo exposes raw is_correct per pick; what counts as "hot" or
// "cold" for a given week is a judgment call likely to get retuned, so it
// lives here rather than in the data pipeline. Decided 2026-09-23.
export const WEEKLY_FORM_HOT_PCT = 0.75;
export const WEEKLY_FORM_COLD_PCT = 0.25;
// Below this many graded picks in a week, the sample's too small to call --
// early in a week before most games kick off, everyone would otherwise show
// as "hot" or "cold" off one or two results.
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
  correct: number;
  graded: number;
}

export const getWeeklyForm = (picks: UserPick[]): WeeklyFormResult | null => {
  const graded = picks.filter((pick) => pick.is_correct !== null);
  if (graded.length < WEEKLY_FORM_MIN_GRADED_PICKS) return null;

  const correct = graded.filter((pick) => pick.is_correct === true).length;
  const pct = correct / graded.length;

  const form: WeeklyForm =
    pct >= WEEKLY_FORM_HOT_PCT
      ? "hot"
      : pct <= WEEKLY_FORM_COLD_PCT
      ? "cold"
      : "neutral";

  return { form, correct, graded: graded.length };
};
