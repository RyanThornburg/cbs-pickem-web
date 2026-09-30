import { RankedUser, UserSeasonTrends } from "../../types";
import { Box, Divider, Stack } from "@mui/material";
import { useEffect, useState } from "react";
import { ordinal } from "../../helper";
import { UserGamePicksStack } from "../UsersTable/UserPickStack";
import UserAvatar from "../UserAvatar";
import { StreakBadge } from "../UsersTable/StreakBadge";

export type Props = {
  userList: RankedUser[];
  userId: string;
  userTrends: UserSeasonTrends | undefined;
  // False while browsing a past week: the streak is only known as of now.
  showStreak: boolean;
};

const PlaceSuffix = ({ place }: { place: number | null | undefined }) =>
  place ? (
    <Box component="span" sx={{ color: "text.secondary" }}>
      {" · "}
      {ordinal(place)}
    </Box>
  ) : null;

export default function UserSelectedMain({ userList, userId, userTrends, showStreak }: Props) {
  const [user, setUser] = useState<RankedUser | undefined>(undefined);

  useEffect(() => {
    // Only update if userList has items and userId exists
    if (userList.length > 0 && userId) {
      const foundUser = userList.find((user: RankedUser) => user.id === userId);
      setUser(foundUser);
    }
  }, [userList, userId]);

  if (!user) {
    return null;
  }
  return (
    <Stack
      direction={{ xs: "column", sm: "row" }}
      divider={<Divider orientation="vertical" flexItem />}
      spacing={{ xs: 1, md: 1, xl: 2 }}
      // 13px while it shares the header row with the title at 1200-1535px.
      sx={{
        alignItems: "center",
        // Only needs space below when it has its own row (md).
        mb: { md: "8px", lg: 0 },
        fontSize: { lg: "0.8125rem", xl: "0.875rem" },
      }}
    >
      <Stack sx={{ alignItems: "center" }} direction="row" spacing={1}>
        <UserAvatar
          userName={user.name ?? ""}
          userId={user.id}
          size={24}
          fontSize={"0.875rem"}
        />
        <StreakBadge
          weeks={showStreak ? userTrends?.current_season.hot_streak.current_streak ?? 0 : 0}
          thresholdPct={userTrends?.current_season.hot_streak.threshold_pct}
        />
      </Stack>

      {/* Score and place share one item ("Score: 7 · 13th") to keep the
          header on one row at 1200px+. */}
      <Box sx={{ whiteSpace: "nowrap" }}>
        Score: {(user.cumulative_score ?? 0) + (user.trending_score ?? 0)}
        <PlaceSuffix place={user.place} />
      </Box>
      {user.second_half_score !== null && (
        <Box sx={{ whiteSpace: "nowrap" }}>
          2nd Half:{" "}
          {(user.second_half_score ?? 0) + (user.trending_score ?? 0)}
          <PlaceSuffix place={user.second_half_place} />
        </Box>
      )}

      {UserGamePicksStack(user.picks, true)}
    </Stack>
  );
}
