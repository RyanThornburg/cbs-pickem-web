import { RankedUser } from "../../types";
import { useCurrentWeek } from "../CurrentWeekContext";
import {
  moneyStandings,
  rowPeriods,
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
  const { periods } = useCurrentWeek();
  if (!userId) return [];
  const standings = moneyStandings(
    userList.map((user) => ({
      id: user.id,
      periods: rowPeriods(user, periods, week),
    })),
    userId,
    periods,
    week
  );
  return shownMoneyStandings(standings, periods, week, weekComplete);
}
