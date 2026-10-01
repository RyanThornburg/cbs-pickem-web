import { RankedUser } from "../../types";
import { useCurrentWeek } from "../CurrentWeekContext";
import {
  moneyStandings,
  ShownMoneyStanding,
  shownMoneyStandings,
} from "./usersTableUtils";

// The selected player's money standings worth showing for the browsed week:
// the header's player card on desktop, and the paid lines and pinned row on
// phones. Measured on the same displayed scores and ranks as the table.
export function useMoneyStandings(
  userList: RankedUser[],
  userId: string,
  week: number,
  weekComplete: boolean
): ShownMoneyStanding[] {
  const { paidPlaces, secondHalfStartWeek } = useCurrentWeek();
  if (!userId) return [];
  const standings = moneyStandings(
    userList.map((user) => ({
      id: user.id,
      place: user.place,
      second_half_place: user.second_half_place,
      score: user.cumulative_score + user.trending_score,
      second_half_score: (user.second_half_score ?? 0) + user.trending_score,
    })),
    userId,
    paidPlaces,
    week >= secondHalfStartWeek
  );
  return shownMoneyStandings(
    standings,
    week,
    secondHalfStartWeek,
    weekComplete
  );
}
