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
