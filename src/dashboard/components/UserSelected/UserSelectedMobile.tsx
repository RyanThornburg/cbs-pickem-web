import { RankedUser, UserSeasonTrends } from "../../types";
import { Box, Divider, Grid, Stack } from "@mui/material";
import { useEffect, useState } from "react";
import { ordinal } from "../../helper";
import { UserGamePicksStack } from "../UsersTable/UserPickStack";
import UserAvatar from "../UserAvatar";
import { StreakBadge } from "../UsersTable/StreakBadge";
import { ScoreWithCovering } from "../UsersTable/ScoreWithCovering";

export type Props = {
  userList: RankedUser[];
  userId: string;
  userTrends: UserSeasonTrends | undefined;
  // False while browsing a past week: the streak is only known as of now.
  showStreak: boolean;
};

export default function UserSelected({
  userList,
  userId,
  userTrends,
  showStreak,
}: Props) {
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

  const commonBoxStyles = {
    fontSize: {
      xs: "0.75rem",
      sm: "0.8rem",
    }, // 14px - consistent font size for all boxes
    whiteSpace: "nowrap",
  };

  const gridStyle = {
    mb: "8px",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
  };

  return (
    <Grid container>
      <Grid size={{ xs: 12, sm: 6 }} sx={gridStyle}>
        {/* Wraps instead of running off both edges at 360px when the
            streak pill, a "+N" and the 2nd-half score all show. */}
        <Stack
          direction="row"
          divider={<Divider orientation="vertical" flexItem />}
          spacing={{ xs: 1, md: 1, xl: 2 }}
          useFlexGap
          sx={{
            alignItems: "center",
            justifyContent: "center",
            flexWrap: "wrap",
            rowGap: 0.5,
            mb: { md: "8px", xl: "0px" },
          }}
        >
          <Stack sx={{ alignItems: "center" }} direction="row" spacing={1}>
            <UserAvatar
              userName={user.name ?? ""}
              userId={user.id}
              fontSize={{
                xs: "0.75rem",
              }}
            />
            <StreakBadge
              weeks={
                showStreak
                  ? (userTrends?.current_season.hot_streak.current_streak ?? 0)
                  : 0
              }
              thresholdPct={userTrends?.current_season.hot_streak.threshold_pct}
            />
          </Stack>

          <Box sx={commonBoxStyles}>
            Score:{" "}
            <ScoreWithCovering
              total={(user.cumulative_score ?? 0) + (user.trending_score ?? 0)}
              covering={user.trending_score ?? 0}
            />
            {user.place != null && (
              <Box component="span" sx={{ color: "text.secondary" }}>
                {" · "}
                {ordinal(user.place)}
              </Box>
            )}
          </Box>

          {user.second_half_score !== null && (
            <Box sx={commonBoxStyles}>
              2nd Half:{" "}
              <ScoreWithCovering
                total={
                  (user.second_half_score ?? 0) + (user.trending_score ?? 0)
                }
                covering={user.trending_score ?? 0}
              />
              {user.second_half_place != null && (
                <Box component="span" sx={{ color: "text.secondary" }}>
                  {" · "}
                  {ordinal(user.second_half_place)}
                </Box>
              )}
            </Box>
          )}
        </Stack>
      </Grid>
      <Grid sx={gridStyle} size={{ xs: 12, sm: 6 }}>
        {UserGamePicksStack(user.picks, true, user.has_submitted_picks)}
      </Grid>
    </Grid>
  );
}
