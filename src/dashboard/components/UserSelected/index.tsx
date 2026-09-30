import { RankedUser, UserSeasonTrends } from "../../types";
import { Grid2 as Grid } from "@mui/material";
import UserSelectedMain from "./UserSelectedMain";
import UserSelectedMobile from "./UserSelectedMobile";

type Props = {
  userList: RankedUser[];
  userId: string;
  userTrends: UserSeasonTrends | undefined;
  showStreak: boolean;
};

export default function UserSelectedSizes({
  userList,
  userId,
  userTrends,
  showStreak,
}: Props) {
  return (
    <>
      <Grid
        size={{ sm: 12 }}
        sx={{ display: { xs: "none", md: "block", lg: "none" } }}
      >
        <UserSelectedMain
          userId={userId}
          userList={userList}
          userTrends={userTrends}
          showStreak={showStreak}
        />
      </Grid>
      <Grid size={{ xs: 12 }} sx={{ display: { xs: "block", md: "none" } }}>
        <UserSelectedMobile
          userId={userId}
          userList={userList}
          userTrends={userTrends}
          showStreak={showStreak}
        />
      </Grid>
    </>
  );
}
