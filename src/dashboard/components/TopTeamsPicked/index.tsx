import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import { blue, green, red } from "@mui/material/colors";
import { BarChart } from "@mui/x-charts/BarChart";
import { onValue, ref } from "firebase/database";
import { useEffect, useState } from "react";
import { db } from "../../../api/firebase";
import { GameStatus, TeamPicked } from "../../types";
import SmallHeader from "../SmallHeader";

export type Props = {
  week: number;
};

export default function TopTeamsPicked({ week }: Props) {
  const [teamPicks, setTeamPicks] = useState<TeamPicked[]>([]);
  const weekFormat = week.toString().padStart(2, "0") ?? "01";
  const weekPath = `weeks/week${weekFormat}/stats/teamsPicked/`;

  useEffect(() => {
    const userRef = ref(db, weekPath);
    return onValue(userRef, (snapshot) => {
      if (snapshot.exists()) {
        setTeamPicks(snapshot.val());
      }
    });
  }, [weekPath]);

  const getBarColor = (team: TeamPicked) => {
    if (team.is_game || team.game_status === GameStatus.Scheduled) {
      return blue[300];
    }
    return team.cover ? green[300] : red[300];
  };

  const formatTeamLabel = (team: string) => team.replace("at", " @ ");

  return (
    <Card
      variant="outlined"
      sx={{
        display: "flex",
        flexDirection: "column",
        gap: 1,
        flexGrow: 1,
        p: 1,
        backgroundColor: "background.paper",
        boxShadow: 1,
      }}
    >
      <CardContent sx={{ p: 2 }}>
        <SmallHeader title="Most Popular Picks" />

        <BarChart
          yAxis={[
            {
              id: "barCategories",
              data: teamPicks.map((team) => team.team),
              scaleType: "band",
              colorMap: {
                type: "ordinal",
                colors: teamPicks.map(getBarColor),
              },
            },
          ]}
          barLabel={(item, _context) => {
            const teamPicked = teamPicks[item.dataIndex];
            return teamPicked.is_game
              ? `Picks Pending for ${formatTeamLabel(teamPicked.team)}`
              : item.value?.toString();
          }}
          series={[
            {
              data: teamPicks.map((team) => team.count),
              highlightScope: {
                highlighted: "item",
                faded: "global",
              },
              color: "primary.main",
            },
          ]}
          layout="horizontal"
          height={1044}
          grid={{
            vertical: true,
            horizontal: true,
          }}
          sx={{
            ".MuiBarElement-root:hover": {
              filter: "brightness(0.9)",
            },
          }}
        />
      </CardContent>
    </Card>
  );
}
