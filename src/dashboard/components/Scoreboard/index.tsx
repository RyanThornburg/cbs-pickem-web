import { memo, useState } from "react";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Grid from "@mui/material/Grid2";
import Typography from "@mui/material/Typography";
import CircularProgress from "@mui/material/CircularProgress";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import ViewModuleIcon from "@mui/icons-material/ViewModule";
import ViewListIcon from "@mui/icons-material/ViewList";
import { useGameData } from "./hooks/useGameData";
import { groupGames } from "./utils/scoreboardUtils";
import { GameCard } from "./components/GameCard";
import { GameRow } from "./components/GameRow";

type Layout = "full" | "compact";
const LAYOUT_KEY = "scoreboardLayout";

const readLayout = (): Layout => {
  try {
    return localStorage.getItem(LAYOUT_KEY) === "compact" ? "compact" : "full";
  } catch {
    return "full";
  }
};

interface Props {
  week: number;
  // Selected user -- drives "Your pick" badges and highlights
  userId?: string;
  totalUsers?: number;
}

const GroupHeader = ({ children }: { children: string }) => (
  <Typography variant="overline" sx={{ fontWeight: 700, color: "text.secondary", letterSpacing: "0.08em" }}>
    {children}
  </Typography>
);

const Scoreboard = memo(({ week, userId, totalUsers }: Props) => {
  const { games, loading, error } = useGameData(week);
  const [layout, setLayout] = useState<Layout>(readLayout);

  const changeLayout = (_: unknown, next: Layout | null) => {
    if (!next) return;
    setLayout(next);
    try {
      localStorage.setItem(LAYOUT_KEY, next);
    } catch {
      // storage blocked -- layout just won't persist
    }
  };

  if (loading) return <CircularProgress />;
  if (error) return <div>{error.message}</div>;
  if (!games.length) return <Box>No games scheduled for week {week}</Box>;

  const groups = groupGames(games);

  return (
    <Box id={`gameWeek-${week}`} sx={{ width: "100%", display: "flex", flexDirection: "column", gap: 2, textAlign: "left" }}>
      <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
        <ToggleButtonGroup size="small" exclusive value={layout} onChange={changeLayout} aria-label="Scoreboard layout">
          <ToggleButton value="full" aria-label="Full cards">
            <ViewModuleIcon fontSize="small" sx={{ mr: 0.5 }} />
            Full
          </ToggleButton>
          <ToggleButton value="compact" aria-label="Compact list">
            <ViewListIcon fontSize="small" sx={{ mr: 0.5 }} />
            Compact
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {layout === "full" ? (
        groups.map(({ group, games }) => (
          <Box key={group} sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
            <GroupHeader>{group}</GroupHeader>
            <Grid container spacing={2} sx={{ alignItems: "flex-start" }}>
              {games.map((game) => (
                <Grid key={game.game_id} size={{ xs: 12, md: 6, xl: 4 }}>
                  <GameCard game={game} userId={userId} totalUsers={totalUsers} />
                </Grid>
              ))}
            </Grid>
          </Box>
        ))
      ) : (
        <Paper variant="outlined" sx={{ overflow: "hidden" }}>
          {groups.map(({ group, games }) => (
            <Box key={group}>
              <Box sx={{ px: 1.75, py: 0.5, bgcolor: "action.hover", borderBottom: 1, borderColor: "divider" }}>
                <GroupHeader>{group}</GroupHeader>
              </Box>
              {games.map((game) => (
                <GameRow key={game.game_id} game={game} userId={userId} />
              ))}
            </Box>
          ))}
        </Paper>
      )}
    </Box>
  );
});

Scoreboard.displayName = "Scoreboard";

export default Scoreboard;
