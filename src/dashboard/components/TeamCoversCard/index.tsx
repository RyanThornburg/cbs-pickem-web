import { onValue, ref } from "firebase/database";
import { useEffect, useState, useMemo } from "react";
import { db } from "../../../api/firebase";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
} from "@mui/material";

interface TeamData {
  favorite_covers: number;
  home_covers: number;
  loss_count: number;
  win_count: number;
  team: {
    team: {
      short_name: string;
    };
  };
  losses: any[];
  wins: any[];
}

interface TeamResults {
  [key: string]: TeamData;
}

export default function TeamCoversCard() {
  const [teamResults, setTeamResults] = useState<TeamResults>({});

  useEffect(() => {
    const userRef = ref(db, "stats/teamCovers/");
    return onValue(userRef, (snapshot) => {
      if (snapshot.exists()) {
        setTeamResults(snapshot.val());
      }
    });
  }, []);

  const sortedTeams = useMemo(() => {
    return Object.entries(teamResults)
      .map(([teamKey, data]) => ({
        teamKey,
        ...data,
        coverPercentage:
          (data.win_count / (data.win_count + data.loss_count)) * 100,
      }))
      .sort((a, b) => b.win_count - a.win_count);
  }, [teamResults]);

  if (!sortedTeams.length) return null;

  return (
    <TableContainer
      component={Paper}
      sx={{
        borderRadius: 2,
        boxShadow: (theme) => theme.shadows[2],
        bgcolor: "background.paper",
        maxHeight: 440, // Adjust this value as needed
      }}
    >
      <Table stickyHeader size="small" aria-label="team covers table">
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
            <TableCell align="right">Record</TableCell>
            <TableCell align="right">Cover %</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {sortedTeams.map((team) => (
            <TableRow
              key={team.teamKey}
              sx={{
                "&:last-child td, &:last-child th": { border: 0 },
                "&:hover": { bgcolor: "action.selected" },
                transition: "background-color 0.2s ease",
              }}
            >
              <TableCell component="th" scope="row">
                {team.teamKey}
              </TableCell>
              <TableCell align="right">
                {team.win_count}-{team.loss_count}
              </TableCell>
              <TableCell align="right">
                {team.coverPercentage.toFixed(1)}%
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
