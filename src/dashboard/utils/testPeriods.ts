import { PayPeriod } from "../types";

// Test fixtures: 2026's real periods, and a thirds season with last place
// paid on overall, for checking nothing assumes halves.
const period = (
  key: string,
  label: string,
  start_week: number,
  end_week: number,
  paid_places: number,
  pay_last_place = false
): PayPeriod => ({
  key,
  label,
  start_week,
  end_week,
  paid_places,
  pay_last_place,
});

export const HALVES: PayPeriod[] = [
  period("overall", "Overall", 1, 18, 5),
  period("first_half", "First Half", 1, 9, 3),
  period("second_half", "Second Half", 10, 18, 3),
];

export const THIRDS: PayPeriod[] = [
  period("overall", "Overall", 1, 18, 5, true),
  period("first_third", "First Third", 1, 6, 2),
  period("second_third", "Second Third", 7, 12, 2),
  period("final_third", "Final Third", 13, 18, 2),
];
