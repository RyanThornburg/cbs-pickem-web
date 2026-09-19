import { RankedUser } from "../../types";
import { Box, Divider, Stack } from "@mui/material";
import { useEffect, useState } from "react";
import { getOrdinal } from "../../helper";
import { UserGamePicksStack } from "../UsersTable/UserPickStack";
import UserAvatar from "../UserAvatar";

export type Props = {
  userList: RankedUser[];
  userId: string;
};

export default function UserSelectedMain({ userList, userId }: Props) {
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
      sx={{ alignItems: "center", mb: { md: "8px", xl: "0px" } }}
    >
      <Stack sx={{ alignItems: "center" }} direction="row" spacing={2}>
        <UserAvatar
          userName={user.name ?? ""}
          userId={user.id}
          size={24}
          fontSize={"0.875rem"}
        />
      </Stack>

      <Box>
        Score: {(user.cumulative_score ?? 0) + (user.trending_score ?? 0)}
      </Box>
      <Box>
        {user.place}
        {getOrdinal(user.place)}
        {" Place"}
      </Box>
      {user.second_half_score !== null && (
        <>
          <Box>
            2nd Half:{" "}
            {(user.second_half_score ?? 0) + (user.trending_score ?? 0)}
          </Box>
          <Box>
            {user?.second_half_place}
            {getOrdinal(user?.second_half_place ?? 0)}
            {" Place"}
          </Box>
        </>
      )}

      {UserGamePicksStack(user.picks, true)}
    </Stack>
  );
}
