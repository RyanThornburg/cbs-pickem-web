import { RankedUser, UserSeasonTrends, WeekRecap } from "../../types";

export type UserGridProps = {
  userList: RankedUser[];
  userId: string;
  showSecondHalf: boolean;
  week: number;
  season: number;
  // This week's recap, for the mover and 5-0 badges next to names.
  recap?: WeekRecap;
  // False while browsing a past week: the hot streak is only known as of now.
  showStreak: boolean;
};

// UsersTable/index.tsx fetches season trends itself (derived from
// userList) and hands the result down to the desktop/mobile variants as
// this extra prop, rather than making every UsersTable caller supply it.
export type UserGridWithTrendsProps = UserGridProps & {
  trends: Record<string, UserSeasonTrends>;
};
