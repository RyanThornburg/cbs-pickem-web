import { onValue, ref } from "firebase/database";
import { useEffect, useState, useMemo } from "react";
import { db } from "../../../api/firebase";
import {
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  alpha,
} from "@mui/material";

interface Pick {
  game_id: string;
  game_status: string;
  game_time: number;
  pick_status: "CORRECT" | "INCORRECT";
  team: string;
  team_id: number;
  visible: boolean;
}

interface WeekData {
  id: string;
  name: string;
  period_score: number;
  picks: Pick[];
  rank: number;
  score: number;
  second_half: number;
  trending_score: number;
  week: number;
}

interface TeamRecord {
  team: string;
  wins: number;
  losses: number;
  percentage: number;
}

interface TeamStats extends TeamRecord {
  recentTrend?: "up" | "down" | "neutral";
  lastFiveResults?: ("W" | "L")[];
}

export default function UserPicks({ userId }: { userId: string }) {
  const [userResults, setUserResults] = useState<{ [key: string]: WeekData }>(
    {}
  );

  useEffect(() => {
    const userRef = ref(db, `userPicks/${userId}`);
    return onValue(userRef, (snapshot) => {
      if (snapshot.exists()) {
        setUserResults(snapshot.val());
      }
    });
  }, [userId]);

  const TeamTable = ({
    data,
    title,
  }: {
    data: (TeamStats | TeamRecord)[];
    title: string;
  }) => (
    <TableContainer
      component={Paper}
      sx={{
        boxShadow: (theme) => theme.shadows[2],
        bgcolor: "background.paper",
        mb: 2,
        maxHeight: "400px", // Set max height if more than 5 rows
      }}
    >
      <Typography
        variant="h6"
        sx={{
          p: 2,
          fontWeight: 600,
          color: "primary.main",
          fontSize: { xs: "1rem" },
          position: "sticky",
          top: 0,
          bgcolor: "background.paper",
          zIndex: 2,
        }}
      >
        {title}
      </Typography>
      <Table size="small" stickyHeader>
        <TableHead>
          <TableRow>
            <TableCell
              sx={{
                bgcolor: "background.paper",
                fontWeight: "bold",
              }}
            >
              Team
            </TableCell>
            <TableCell
              align="right"
              sx={{
                bgcolor: "background.paper",
                fontWeight: "bold",
              }}
            >
              Record
            </TableCell>
            <TableCell
              align="right"
              sx={{
                bgcolor: "background.paper",
                fontWeight: "bold",
              }}
            >
              Win %
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {data.map((record) => (
            <TableRow
              key={record.team}
              sx={{
                "&:last-child td, &:last-child th": { border: 0 },
                "&:hover": { bgcolor: "action.hover" },
                bgcolor: (theme) =>
                  record.percentage >= 60
                    ? alpha(theme.palette.success.main, 0.1)
                    : record.percentage <= 40
                    ? alpha(theme.palette.error.main, 0.1)
                    : "inherit",
              }}
            >
              <TableCell>{record.team}</TableCell>
              <TableCell align="right">
                {record.wins}-{record.losses}
              </TableCell>
              <TableCell
                align="right"
                sx={{
                  color: (theme) => {
                    if (record.percentage >= 60)
                      return theme.palette.success.main;
                    if (record.percentage <= 40)
                      return theme.palette.error.main;
                    return theme.palette.text.primary;
                  },
                }}
              >
                {record.percentage.toFixed(1)}%
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );

  const teamStats = useMemo(() => {
    const records: { [key: string]: TeamStats } = {};

    Object.values(userResults).forEach((weekData) => {
      if (!weekData.picks) return;

      weekData.picks.forEach((pick) => {
        if (!pick.team) return;

        if (!records[pick.team]) {
          records[pick.team] = {
            team: pick.team,
            wins: 0,
            losses: 0,
            percentage: 0,
            lastFiveResults: [],
          };
        }

        if (pick.pick_status === "CORRECT") {
          records[pick.team].wins += 1;
          records[pick.team].lastFiveResults?.unshift("W");
        } else if (pick.pick_status === "INCORRECT") {
          records[pick.team].losses += 1;
          records[pick.team].lastFiveResults?.unshift("L");
        }

        // Keep only last 5 results
        if (records[pick.team].lastFiveResults!.length > 5) {
          records[pick.team].lastFiveResults = records[
            pick.team
          ].lastFiveResults!.slice(0, 5);
        }
      });
    });

    return Object.values(records)
      .filter((record) => record.team)
      .map((record) => {
        const total = record.wins + record.losses;
        const percentage = (record.wins / total) * 100;

        // Calculate trend
        const recentResults = record.lastFiveResults || [];
        const recentWins = recentResults.filter((r) => r === "W").length;
        const recentLosses = recentResults.filter((r) => r === "L").length;

        let trend: "up" | "down" | "neutral" = "neutral";
        if (recentWins > recentLosses) trend = "up";
        if (recentLosses > recentWins) trend = "down";

        return {
          ...record,
          percentage,
          recentTrend: trend,
        };
      })
      .filter((record) => record.wins + record.losses >= 2) // Minimum 2 picks
      .sort((a, b) => b.percentage - a.percentage);
  }, [userResults]);

  // const bestTeams = useMemo(() => {
  //   return teamStats
  //     .filter((team) => team.percentage > 50)
  //     .sort((a, b) => b.percentage - a.percentage);
  // }, [teamStats]);

  // const worstTeams = useMemo(() => {
  //   return teamStats
  //     .filter((team) => team.percentage < 50)
  //     .sort((a, b) => a.percentage - b.percentage);
  // }, [teamStats]);

  // const renderTrendIndicator = (trend?: "up" | "down" | "neutral") => {
  //   switch (trend) {
  //     case "up":
  //       return <span style={{ color: "green" }}>↑</span>;
  //     case "down":
  //       return <span style={{ color: "red" }}>↓</span>;
  //     default:
  //       return <span style={{ color: "gray" }}>→</span>;
  //   }
  // };

  if (!teamStats.length) return null;

  return (
    <Card variant="outlined" sx={{ height: "100%", flexGrow: 1 }}>
      <CardContent>
        <TeamTable data={teamStats} title="All Team Records" />
      </CardContent>
    </Card>
  );
}
