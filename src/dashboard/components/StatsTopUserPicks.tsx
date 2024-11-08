import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import { blue, green, red } from "@mui/material/colors";
import { BarChart } from "@mui/x-charts/BarChart";
import { onValue, ref } from "firebase/database";
import { useEffect, useState } from "react";
import { db } from "../../components/firebase";
import { GameStatus, TeamPicked } from "../../types";
import SmallHeader from "./SmallHeader";

export type Props = {
  week: number;
};

export default function StatsTopUserPicks({ week }: Props) {
  const [teamPicks, setTeamPicks] = useState([]);
  const weekFormat = week.toString().padStart(2, "0") ?? "01";
  const weekPath = `weeks/week${weekFormat}/tats/teamsPicked/`;

  useEffect(() => {
    const userRef = ref(db, "stats/teamsPicked/");
    return onValue(userRef, (snapshot) => {
      if (snapshot.exists()) {
        setTeamPicks(snapshot.val());
      }
    });
  }, []);

  function barColors() {
    return teamPicks.map((team: TeamPicked) => {
      const pickColor =
        team.is_game || team.game_status === GameStatus.Scheduled
          ? blue[300]
          : team.cover
          ? green[300]
          : red[300];

      return pickColor;
    });
  }

  function barLabels() {
    return teamPicks.map((team: TeamPicked) => {
      const pickColor = team.is_game ? 1 : 0;
      return pickColor.toString();
    });
  }

  return (
    <Card
      variant="outlined"
      sx={{ display: "flex", flexDirection: "column", gap: "8px", flexGrow: 1 }}
    >
      <CardContent>
        <SmallHeader title={"Most Popular Picks"} />

        <BarChart
          yAxis={[
            {
              id: "barCategories",
              data: teamPicks.map((team: TeamPicked) => {
                return team.team;
              }),
              scaleType: "band",
              colorMap: {
                type: "ordinal",
                colors: barColors(),
              },
            },
          ]}
          barLabel={(item, context) => {
            const teamPicked: TeamPicked = teamPicks[item.dataIndex];
            return teamPicked.is_game
              ? `Picks Pending for ${teamPicked.team.replace("at", " @ ")}`
              : item.value?.toString();
          }}
          series={[
            {
              data: teamPicks.map((team: TeamPicked) => {
                return team.count;
              }),
            },
          ]}
          layout="horizontal"
          height={1044}
          grid={{ vertical: true }}
        />
      </CardContent>
    </Card>
  );
}
