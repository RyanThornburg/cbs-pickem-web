import TrendingDownIcon from "@mui/icons-material/TrendingDown";
import TrendingFlatIcon from "@mui/icons-material/TrendingFlat";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import { onValue, ref } from "firebase/database";
import { useEffect, useState } from "react";
import { db } from "../../components/firebase";
import { WeekCover } from "../../types";

export type Props = {
  week: number;
  isCurrent: boolean;
};

const defaultResult: WeekCover = { correct: 0, total: 0, result: 0, week: "0" };
const weekResult = (weekResult: number) => {
  return weekResult ? `${Math.round(weekResult)}%` : "";
};

export default function StatsWeeklyResult({ week, isCurrent }: Props) {
  const [currentResults, setCurrentResults] = useState({});
  const weekPath = `/stats/coverResults/`;

  useEffect(() => {
    const userRef = ref(db, weekPath);
    return onValue(userRef, (snapshot) => {
      if (snapshot.exists()) {
        setCurrentResults(snapshot.val());
      }
    });
  }, [week, weekPath]);

  const lastWeekNum = week > 1 ? week - 1 : 1;

  const lastWeek: WeekCover = currentResults
    ? currentResults[`week${lastWeekNum}` as keyof typeof currentResults]
    : defaultResult;

  const currentWeek: WeekCover = currentResults
    ? currentResults[`week${week}` as keyof typeof currentResults]
    : defaultResult;

  const isActive = currentWeek?.total > 0;
  const results = () => {
    return isActive ? weekResult(currentWeek?.result) : "TBD";
  };

  function lastWeekBox() {
    if (!currentWeek || currentWeek?.result === 0) {
      return "";
    }

    const diff: number = Math.round(currentWeek.result - lastWeek.result);
    const colorTheme =
      diff > 0 ? "success.dark" : diff < 0 ? "error.dark" : "info.dark";
    const iconWeek =
      diff > 0
        ? TrendingUpIcon
        : diff < 0
        ? TrendingDownIcon
        : TrendingFlatIcon;

    return (
      <Stack
        sx={{
          justifyContent: "center",
          alignItems: "center",
        }}
        spacing={0}
        direction={"row"}
      >
        <Box
          component={iconWeek}
          sx={{ color: colorTheme, fontSize: "1rem", verticalAlign: "sub" }}
        />
        <Box
          sx={{
            display: "inline",
            fontSize: "0.875rem",
            fontWeight: "bold",
            color: colorTheme,
            mx: 0.5,
          }}
        >
          {`${diff}%`}
        </Box>
      </Stack>
    );
  }

  return (
    <Box
      sx={{
        p: 2,
        border: "1px solid",
        borderColor: "divider",
        bgcolor: "background.default",
        borderRadius: 2,
        height: "100%",
        flexGrow: 1,
      }}
    >
      {isCurrent && <Box sx={{ color: "text.secondary" }}>Current Week</Box>}
      {!isCurrent && <Box sx={{ color: "text.secondary" }}>Week {week}</Box>}
      <Box
        sx={{
          color: "text.primary",
          fontSize: "4.125rem",
          fontWeight: "medium",
        }}
      >
        {results()}
      </Box>
      {currentResults && lastWeekBox()}
      <Box
        sx={{
          color: "text.secondary",
          display: "inline",
          fontSize: "0.875rem",
        }}
      >
        vs. last week
      </Box>
    </Box>
  );
}
