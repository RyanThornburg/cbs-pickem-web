import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import { LineChart } from "@mui/x-charts/LineChart";
import { onValue, ref } from "firebase/database";
import { useEffect, useState } from "react";
import { db } from "../../../api/firebase";
import { WeekCover } from "../../types";

export default function WeeklyCoverChart() {
  const [coverResults, setCoverResults] = useState<any>([]);

  useEffect(() => {
    const userRef = ref(db, "stats/coverResults/");
    return onValue(userRef, (snapshot) => {
      if (snapshot.exists()) {
        const coverData: WeekCover[] = [];
        var weekly: WeekCover[] = Object.values(snapshot.val());
        weekly.forEach((week) => {
          if (week.total > 0) {
            coverData.push(week);
          }
        });
        const sortCover = coverData.sort((a, b) => (a.week < b.week ? -1 : 1));
        setCoverResults(sortCover);
      }
    });
  }, []);

  return (
    <Card variant="outlined" sx={{ height: "100%", flexGrow: 1 }}>
      <CardContent>
        <Typography sx={{ color: "text.secondary" }}>Weekly Results</Typography>

        <LineChart
          yAxis={[
            {
              valueFormatter: (v) => {
                return `${v ?? 0}%`;
              },
              tickNumber: 3,
            },
          ]}
          xAxis={[
            {
              dataKey: "week",
              tickMinStep: 1,
              valueFormatter: (v) => {
                return `Week ${v ?? 0}`;
              },
              tickMaxStep: 1,
            },
          ]}
          series={[
            {
              dataKey: "result",
              valueFormatter: (v) => {
                return `${Math.round(v ?? 0)}%`;
              },
              area: true,
            },
          ]}
          dataset={coverResults}
          height={165}
        ></LineChart>
      </CardContent>
    </Card>
  );
}
