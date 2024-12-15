import { memo } from "react";
import { Box, CircularProgress } from "@mui/material";
import { Games } from "./components/Games";
import { useGameData } from "./hooks/useGameData";
import { useGameGroups } from "./hooks/useGameGroups";

interface Props {
  week: number;
}

const Scoreboard = memo(({ week }: Props) => {
  // Custom hook for fetching and managing game data
  const { games, loading, error } = useGameData(week);

  // Custom hook for organizing games by date
  const { gameGroups, gameDates } = useGameGroups(games);

  // Early return states
  if (loading) {
    return <CircularProgress />;
  }

  if (error) {
    return <div>{error.message}</div>;
  }

  if (!games.length) {
    return <Box>No games scheduled for week {week}</Box>;
  }

  return (
    <Box
      id={`gameWeek-${week}`}
      sx={{
        width: "100%",
        flexGrow: 1,
      }}
    >
      {gameDates.map((date, index) => (
        <Games
          key={`gameWeek-${week}-${index}`}
          header={date}
          games={gameGroups[date]}
        />
      ))}
    </Box>
  );
});

// Add display name for debugging
Scoreboard.displayName = "Scoreboard";

export default Scoreboard;

export {};
