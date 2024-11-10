import * as React from "react";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Paper from "@mui/material/Paper";
import { useEffect, useState } from "react";
import { onValue, ref } from "firebase/database";
import { db } from "../../components/firebase";
import { GameStatus, Pick, PickStatus, User } from "../../types";
import Stack from "@mui/material/Stack";
import Divider from "@mui/material/Divider";
import { StatusColor, stringAvatar } from "../helper";
import { styled } from "@mui/material/styles";
import Box from "@mui/material/Box";
import Avatar from "@mui/material/Avatar";
import { grey } from "@mui/material/colors";
import { Typography } from "@mui/material";

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
    pick.pick_status == "CORRECT" && {
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
    <Box>
      <Item>{team}</Item>
    </Box>
  );
};

function RenderPicks(picks: Array<Pick>) {
  return (
    <Stack
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

interface UserRow {
  name: string;
  userScore: number;
  weekScore: number;
  secondHalf: number;
  userPicks: JSX.Element;
}

function createUserData(user: User): UserRow {
  const { name, score, period_score, trending_score, second_half, picks } =
    user;
  const userScore = score + trending_score;
  const weekScore = trending_score + period_score;
  const secondHalf = (second_half ?? 0) + weekScore;
  const userPicks = RenderPicks(picks);
  return { name, userScore, weekScore, secondHalf, userPicks };
}

function userAvatar(userName: string) {
  return (
    <Stack
      sx={{
        alignItems: "center",
        justifyContent: "flex-start",
      }}
      direction="row"
      spacing={1}
    >
      <Avatar
        {...stringAvatar(userName ?? "", {
          width: 20,
          height: 20,
          fontSize: 10,
        })}
      />
      <Box sx={{ fontSize: "1rem" }}>
        <Typography noWrap={true}>{userName}</Typography>
      </Box>
    </Stack>
  );
}

function Row(props: { row: UserRow }) {
  const { row } = props;
  const [open, setOpen] = React.useState(true);

  return (
    <React.Fragment>
      <TableRow sx={{ borderTop: `2px solid ${grey[300]}` }}>
        <TableCell component="th" scope="row">
          {userAvatar(row.name)}
        </TableCell>
        <TableCell align="center">{row.userScore}</TableCell>
        <TableCell align="center">{row.secondHalf}</TableCell>
        <TableCell align="center">{row.weekScore}</TableCell>
      </TableRow>
      <TableRow sx={{ mb: 2 }}>
        <TableCell style={{ paddingBottom: "4px", paddingTop: 0 }} colSpan={4}>
          {row.userPicks}
        </TableCell>
      </TableRow>
    </React.Fragment>
  );
}

export type Props = {
  week: number;
};

export default function UserDataMobile({ week }: Props) {
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
  }, []);

  const rows = users.map(createUserData);

  return (
    <TableContainer>
      <Table size="small" aria-label="a dense table">
        <TableHead>
          <TableRow>
            <TableCell>Name</TableCell>
            <TableCell align="center">Score</TableCell>
            <TableCell align="center">2nd Half</TableCell>
            <TableCell align="center">Week</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row) => (
            <Row key={row.name} row={row} />
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
