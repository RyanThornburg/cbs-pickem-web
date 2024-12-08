import Looks3Icon from "@mui/icons-material/Looks3";
import LooksOneIcon from "@mui/icons-material/LooksOne";
import LooksTwoIcon from "@mui/icons-material/LooksTwo";
import Looks4 from "@mui/icons-material/Looks4";
import Looks5 from "@mui/icons-material/Looks5";

import {
  Box,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import Avatar from "@mui/material/Avatar";
import Stack from "@mui/material/Stack";
import { onValue, ref } from "firebase/database";
import { useEffect, useState } from "react";
import { db } from "../../components/firebase";
import { User } from "../../types";
import { stringAvatar } from "../helper";

interface UserLeader extends User {
  place: number;
}

const iconLookup = {
  1: <LooksOneIcon color="success"></LooksOneIcon>,
  2: <LooksTwoIcon color="primary"></LooksTwoIcon>,
  3: <Looks3Icon color="secondary"></Looks3Icon>,
  4: <Looks4 color="warning"></Looks4>,
  5: <Looks5 color="error"></Looks5>,
};

const totalScore = (score: number, trend: number): number => {
  return score + trend;
};
export type StatsLeaderboardProps = {
  week: number;
  isSecondHalf: boolean;
  userId: string;
};

export default function StatsLeaderboard({
  week,
  isSecondHalf,
  userId,
}: StatsLeaderboardProps) {
  const [users, setUsers] = useState<User[]>([]);
  const weekFormat = week.toString().padStart(2, "0") ?? "08";
  const weekPath = "userPicks/";

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
  }, [week]);

  const userScore = (user: User): number => {
    return (
      (isSecondHalf ? user.second_half ?? 0 : user.score) + user.trending_score
    );
  };

  const createUserList = () => {
    let top5 = 5;
    let place = 1;
    const avatarUsers: UserLeader[] = [];
    const sortUsers: User[] = users.sort((a: User, b: User) =>
      userScore(a) > userScore(b) ? -1 : 1
    );

    sortUsers.forEach((user: User, index) => {
      const nextUser = index + 1 < users.length ? users[index + 1] : user;
      const nextScore = userScore(nextUser);
      const currentScore = userScore(user);
      if (index === 0 || top5 > 0) {
        avatarUsers.push({ place: place, ...user });
        if (nextScore < currentScore) {
          top5 -= 1;
          place += 1;
          if (avatarUsers.length > 4) {
            top5 = 0;
          }
        }
      }
    });
    return avatarUsers;
  };

  const avatarUsers = createUserList();

  function UserRow(name: string) {
    return (
      <Stack
        sx={{
          alignItems: "center",
        }}
        direction="row"
        spacing={2}
      >
        <Avatar
          {...stringAvatar(name, { width: 24, height: 24, fontSize: 12 })}
        />
        <Box>{name}</Box>
      </Stack>
    );
  }
  return (
    <Card variant="outlined" sx={{ height: "100%", flexGrow: 1 }}>
      <CardContent>
        <Typography sx={{ color: "text.secondary" }}>
          {isSecondHalf ? "Second Half" : "Overall"} Leaderboard
        </Typography>
        <TableContainer style={{ maxHeight: 165 }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Place</TableCell>
                <TableCell>Name</TableCell>
                <TableCell>Score</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {avatarUsers.map((row) => (
                <TableRow
                  className={row.id == userId ? "highlight" : ""}
                  key={row.id}
                  sx={{
                    "&:last-child td, &:last-child th": { border: 0 },
                    ".highlight": {
                      bgcolor: (theme) =>
                        theme.palette.mode === "dark" ? "#78909c" : "#f0f4c3",
                    },
                  }}
                >
                  <TableCell align="center" component="th" scope="row">
                    {iconLookup[row.place as keyof typeof iconLookup]}
                  </TableCell>
                  <TableCell>{UserRow(row.name)}</TableCell>
                  <TableCell align="center">
                    {(isSecondHalf ? row.second_half ?? 0 : row.score) +
                      row.trending_score}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </CardContent>
    </Card>
  );
}
