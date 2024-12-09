import Grid from "@mui/material/Grid2";
import { User, UserLeader, Pick, PickStatus, GameStatus } from "../../types";
import { StatusColor, stringAvatar } from "../helper";
import { Avatar, Box, Card, CardContent, Divider, Stack } from "@mui/material";
import { useEffect, useState } from "react";
import { onValue, ref } from "firebase/database";
import { db } from "../../components/firebase";
import Paper from "@mui/material/Paper";
import { styled } from "@mui/material/styles";
import { getOrdinal } from "../helper";
export type Props = {
  week: number;
  userId: string;
};

const FormatOnePick = (pick: Pick, index: number) => {
  if (index > 4) {
    // why cbs allows this?
    return;
  }

  const team = pick.visible
    ? pick.team
    : pick.pick_status === PickStatus.Missing
    ? "N/A"
    : pick.game_status === GameStatus.Scheduled
    ? "TBD"
    : "???";

  let fontWeight = "regular";
  let fontStyle = "normal";

  const isGameOver = pick.visible && pick.game_status === GameStatus.Final;
  const inProgress = pick.visible && pick.game_status === GameStatus.Inprogress;

  const statusColor =
    StatusColor[(pick.pick_status as keyof typeof StatusColor) ?? "TBD"];

  const Item = styled(Paper)(({ theme }) => [
    {
      backgroundColor: statusColor.bgColor,
      ...theme.typography.body2,
      padding: 0.5,
      width: 60,
      textAlign: "center",
      color: theme.palette.text.primary,
      fontSize: "0.8rem",
      fontWeight: fontWeight,
      fontStyle: fontStyle,
      ...theme.applyStyles("dark", { backgroundColor: statusColor.bgBack }),
    },
    pick.pick_status === "CORRECT" && {
      backgroundColor: theme.palette.primary[50],
    },
    isGameOver && {
      border: `thin solid ${statusColor.borderColor}`,
    },
    inProgress && {
      border: `dashed ${statusColor.borderInProgressColor}`,
      fontStyle: "italic",
    },
  ]);

  return (
    <Box key={index}>
      <Item>{team}</Item>
    </Box>
  );
};

function RenderPicks(picks: Array<Pick>, id: string) {
  return (
    <Stack
      key={`userPickMobile-${id}`}
      sx={{
        justifyContent: "flex-start",
        alignItems: "center",
      }}
      direction="row"
      spacing={0.5}
      divider={<Divider orientation="vertical" flexItem />}
    >
      {picks && picks.map(FormatOnePick)}
    </Stack>
  );
}

export default function UserSelected({ week, userId }: Props) {
  const [users, setUsers] = useState<User[] | UserLeader[]>([]);
  const weekFormat = week.toString().padStart(2, "0") ?? "08";
  const weekPath = "userPicks/";

  const userScore = (user: User, isSecondHalf: boolean): number => {
    return (
      (isSecondHalf ? user.second_half ?? 0 : user.score) + user.trending_score
    );
  };

  const findUserRank = (isSecondHalf: boolean, userId: string) => {
    let place = 1;

    const sortUsers: User[] = users.sort((a: User, b: User) =>
      userScore(a, isSecondHalf) > userScore(b, isSecondHalf) ? -1 : 1
    );
    let stopChecking = false;
    sortUsers.forEach((user: User, index) => {
      const nextUser = index + 1 < users.length ? users[index + 1] : user;
      const nextScore = userScore(nextUser, isSecondHalf);
      const currentScore = userScore(user, isSecondHalf);

      if (user.id === userId) {
        stopChecking = true;
      }

      if (nextScore < currentScore && !stopChecking) {
        place += 1;
      }
    });
    return place;
  };

  useEffect(() => {
    if (week === 0) {
      return;
    }
    const userRef = ref(db, weekPath);
    return onValue(userRef, (snapshot) => {
      if (snapshot.exists()) {
        const filteredUsers: User[] = Object.entries(snapshot.val()).map(
          ([key, weeks]: [string, any]) => weeks[`week${weekFormat}`]
        );
        setUsers(filteredUsers);
      }
    });
  }, [week, weekFormat, userId]);

  const user = users.filter((user: User) => user.id === userId)[0];
  const userRank = {
    place: findUserRank(false, userId),
    second_half_place: findUserRank(true, userId),
    ...user,
  };

  if (!user) {
    return <Grid size={{ xs: 12, sm: 12, lg: 12 }}></Grid>;
  }

  return (
    <Stack
      direction={{ xs: "column", lg: "row" }}
      divider={<Divider orientation="vertical" flexItem />}
      spacing={{ xs: 1, lg: 2 }}
    >
      <Stack sx={{ alignItems: "center" }} direction="row" spacing={2}>
        <Avatar
          {...stringAvatar(userRank?.name ?? "", {
            width: 24,
            height: 24,
            fontSize: 12,
          })}
        />
        <Box>{userRank?.name ?? ""}</Box>
      </Stack>

      <Box>
        Season: {(userRank?.score ?? 0) + (userRank?.trending_score ?? 0)}
      </Box>
      <Box>
        {userRank.place}
        {getOrdinal(userRank.place)}
        {" Place"}
      </Box>
      <Box>
        2nd Half:{" "}
        {(userRank?.second_half ?? 0) + (userRank?.trending_score ?? 0)}
      </Box>
      <Box>
        {userRank.second_half_place}
        {getOrdinal(userRank.second_half_place)}
        {" Place"}
      </Box>
      {RenderPicks(userRank.picks, userRank.id)}
    </Stack>
  );
}
