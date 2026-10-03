import { RankedUser, UserSeasonTrends, WeekRecap } from "../../types";
import { LeaderboardStatus } from "../useWeekData";
import { ShownMoneyStanding } from "./usersTableUtils";

export type UserGridProps = {
  userList: RankedUser[];
  // Loading, failed and "Updated" state of the userList poll.
  leaderboardStatus: LeaderboardStatus;
  // Restarts the leaderboard poll now ("Try now").
  onRetryLeaderboard: () => void;
  userId: string;
  week: number;
  season: number;
  // This week's recap, for the mover and 5-0 badges next to names.
  recap?: WeekRecap;
  // False while browsing a past week: the hot streak is only known as of now.
  showStreak: boolean;
  // The selected player's money standings worth showing (useMoneyStandings),
  // for the paid-line notes and the pinned row on phones.
  moneyStandings: ShownMoneyStanding[];
};

// UsersTable/index.tsx fetches season trends itself (derived from
// userList) and hands the result down to the desktop/mobile variants as
// this extra prop, rather than making every UsersTable caller supply it.
export type UserGridWithTrendsProps = UserGridProps & {
  trends: Record<string, UserSeasonTrends>;
};
