import { useEffect, useState } from "react";
import { Grid2 as Grid } from "@mui/material";
import UserDataGrid from "./UserDataGrid";
import UserDataMobile from "./UserDataMobile";
import { UserGridProps } from "./types";
import { UserSeasonTrends } from "../../types";
import { GetUserSeasonTrends } from "../../data/GetUserSeasonTrends";

export default function UsersTable(props: UserGridProps) {
  const { userList, season } = props;
  const [trends, setTrends] = useState<Record<string, UserSeasonTrends>>({});

  // Sorted, joined into one string so the effect only re-runs when the set
  // of user ids actually changes (not on every userList poll tick, which
  // returns a new array reference each time even when membership is the
  // same) -- season trends don't change week to week the way picks do.
  const userIdsKey = [...userList.map((user) => user.id)].sort().join(",");

  useEffect(() => {
    if (!userIdsKey) return undefined;
    const userIds = userIdsKey.split(",");
    const unsubscribe = GetUserSeasonTrends(userIds, season, setTrends);
    return unsubscribe;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userIdsKey, season]);

  const gridProps = { ...props, trends };

  return (
    <>
      <Grid
        id="gridUser"
        width={"fit-content"}
        display="flex"
        justifyContent="center"
        alignItems="center"
        sx={{ display: { xs: "none", sm: "block" } }}
        size={{ xs: 12, sm: 12, xl: 7 }}
      >
        <UserDataGrid {...gridProps} />
      </Grid>
      <Grid sx={{ display: { xs: "block", sm: "none" } }} size={{ xs: 12 }}>
        <UserDataMobile {...gridProps} />
      </Grid>
    </>
  );
}
