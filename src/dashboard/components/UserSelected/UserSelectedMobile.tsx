import { RankedUser, UserSeasonTrends } from "../../types";
import { Box, Divider, Grid2 as Grid, Stack } from "@mui/material";
import { useEffect, useState } from "react";
import { stringOrdinalPlace } from "../../helper";
import { UserGamePicksStack } from "../UsersTable/UserPickStack";
import UserAvatar from "../UserAvatar";
import { StreakBadge } from "../UsersTable/StreakBadge";

export type Props = {
  userList: RankedUser[];
  userId: string;
  userTrends: UserSeasonTrends | undefined;
};

export default function UserSelected({ userList, userId, userTrends }: Props) {
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
        <Stack
          direction="row"
          divider={<Divider orientation="vertical" flexItem />}
          spacing={{ xs: 1, md: 1, xl: 2 }}
          sx={{ alignItems: "center", mb: { md: "8px", xl: "0px" } }}
        >
          <Stack sx={{ alignItems: "center" }} direction="row" spacing={1}>
            <UserAvatar
              userName={user.name ?? ""}
              userId={user.id}
              fontSize={{
                xs: "0.75rem",
              }}
            />
            <StreakBadge weeks={userTrends?.current_season.hot_streak.current_streak ?? 0} />
          </Stack>

          <Box sx={commonBoxStyles}>
            Score: {(user.cumulative_score ?? 0) + (user.trending_score ?? 0)} (
            {stringOrdinalPlace(user.place)})
          </Box>

          {user.second_half_score !== null && (
            <Box sx={commonBoxStyles}>
              2nd Half:{" "}
              {(user.second_half_score ?? 0) + (user.trending_score ?? 0)} (
              {stringOrdinalPlace(user.second_half_place ?? 99)})
            </Box>
          )}
        </Stack>
      </Grid>
      <Grid sx={gridStyle} size={{ xs: 12, sm: 6 }}>
        {UserGamePicksStack(user.picks, true)}
      </Grid>
    </Grid>
  );
}
