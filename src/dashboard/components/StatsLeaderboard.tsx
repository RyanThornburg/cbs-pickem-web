import Looks3Icon from "@mui/icons-material/Looks3";
import LooksOneIcon from "@mui/icons-material/LooksOne";
import LooksTwoIcon from "@mui/icons-material/LooksTwo";
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

function placeToIcon(place: number) {
  switch (place) {
    case 1: {
      return <LooksOneIcon color="success"></LooksOneIcon>;
    }
    case 2: {
      return <LooksTwoIcon color="primary"></LooksTwoIcon>;
    }
    case 3: {
      return <Looks3Icon color="secondary"></Looks3Icon>;
    }
  }
}

const totalScore = (score: number, trend: number): number => {
  return score + trend;
};

export default function StatsLeaderboard() {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    const userRef = ref(db, "users/");
    return onValue(userRef, (snapshot) => {
      if (snapshot.exists()) {
        setUsers(snapshot.val());
      }
    });
  }, []);

  const createUserList = () => {
    let top3 = 3;
    let place = 1;
    const avatarUsers: UserLeader[] = [];
    const sortUsers: User[] = users.sort((a: User, b: User) =>
      totalScore(a.score, a.trending_score) >
      totalScore(b.score, b.trending_score)
        ? -1
        : 1
    );
    sortUsers.forEach((user: User, index) => {
      const nextUser = index + 1 < users.length ? users[index + 1] : user;

      const nextScore = nextUser.score + nextUser.trending_score;
      const currentScore = user.score + nextUser.trending_score;
      if (index === 0 || top3 > 0) {
        avatarUsers.push({ place: place, ...user });
        if (nextScore < currentScore) {
          top3 -= 1;
          place += 1;
        }
      }
    });
    return avatarUsers;
  };

  const avatarUsers = createUserList();

  function UserRow(name: string) {
    return (
      <Stack sx={{ alignItems: "center" }} direction="row" spacing={2}>
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
        <Typography sx={{ color: "text.secondary" }}>Leaderboard</Typography>
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
                  key={row.id}
                  sx={{ "&:last-child td, &:last-child th": { border: 0 } }}
                >
                  <TableCell align="center" component="th" scope="row">
                    {placeToIcon(row.place)}
                  </TableCell>
                  <TableCell>{UserRow(row.name)}</TableCell>
                  <TableCell align="center">
                    {row.score + row.trending_score}
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
