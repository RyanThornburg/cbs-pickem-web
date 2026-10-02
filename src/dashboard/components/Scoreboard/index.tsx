import { memo, useMemo, useState } from "react";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";
import Alert from "@mui/material/Alert";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import ViewModuleIcon from "@mui/icons-material/ViewModule";
import ViewListIcon from "@mui/icons-material/ViewList";
import { useGameData } from "./hooks/useGameData";
import { useWeekTotals } from "./hooks/useWeekTotals";
import { byeTeams } from "../../data/weekGames";
import { ByeTeams } from "../ByeTeams";
import {
  groupGames,
  pickDeadline,
  picksRevealed,
} from "./utils/scoreboardUtils";
import { GameCard } from "./components/GameCard";
import { GameRow } from "./components/GameRow";
import { YourPicksStrip } from "./components/YourPicksStrip";
import { Game, WeekRecap } from "../../types";
import { gameTagsById } from "../Recap/recapBadges";
import TabIntro from "../TabIntro";
import TabSkeleton from "../TabSkeleton";

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
  // This week's recap, for the "Upset of the week" / "Won, didn't cover" tags.
  recap?: WeekRecap;
}

const GroupHeader = ({ children }: { children: string }) => (
  <Typography
    variant="overline"
    sx={{ fontWeight: 700, color: "text.secondary", letterSpacing: "0.08em" }}
  >
    {children}
  </Typography>
);

const Scoreboard = memo(({ week, userId, totalUsers, recap }: Props) => {
  const gameTags = useMemo(() => gameTagsById(recap), [recap]);
  const { games, loading, failed } = useGameData(week);
  const deadline = useMemo(() => pickDeadline(games), [games]);
  const totals = useWeekTotals(week);
  const byes = useMemo(() => byeTeams(games), [games]);
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

  const intro = (actions?: React.ReactNode) => (
    <TabIntro title="Scoreboard" week={week} actions={actions} />
  );
  if (loading) {
    return (
      <>
        {intro()}
        <TabSkeleton shape="cards" label={`Loading week ${week} scores`} />
      </>
    );
  }
  if (failed) {
    return (
      <>
        {intro()}
        <Alert severity="error" sx={{ textAlign: "left" }}>
          Couldn't load week {week}'s scores. Trying again every minute.
        </Alert>
      </>
    );
  }
  if (!games.length) {
    return (
      <>
        {intro()}
        <Box sx={{ textAlign: "left", color: "text.secondary" }}>
          No games scheduled for week {week}.
        </Box>
      </>
    );
  }

  const groups = groupGames(games);
  // Re-checked on every games poll (once a minute), which is plenty for a
  // kickoff or the Sunday deadline.
  const now = Date.now();

  const controls = (
    <ToggleButtonGroup
      size="small"
      exclusive
      value={layout}
      onChange={changeLayout}
      aria-label="Scoreboard layout"
      sx={{ "& .MuiToggleButton-root": { py: 0.25, px: 1.25 } }}
    >
      <ToggleButton value="full" aria-label="Full cards">
        <ViewModuleIcon fontSize="small" sx={{ mr: 0.5 }} />
        Full
      </ToggleButton>
      <ToggleButton value="compact" aria-label="Compact list">
        <ViewListIcon fontSize="small" sx={{ mr: 0.5 }} />
        Compact
      </ToggleButton>
    </ToggleButtonGroup>
  );

  const row = (game: Game) => (
    <GameRow
      key={game.game_id}
      game={game}
      userId={userId}
      tags={gameTags.get(game.game_id)}
      picksRevealed={picksRevealed(game, deadline, now)}
      total={totals.get(game.game_id)}
    />
  );

  // The layout controls sit on the tab's intro row, like every tab's own
  // controls.
  return (
    <>
      {intro(controls)}
      <Box
        id={`gameWeek-${week}`}
        sx={{
          width: "100%",
          display: "flex",
          flexDirection: "column",
          gap: layout === "full" ? 2 : 1,
          textAlign: "left",
        }}
      >
        <YourPicksStrip games={games} userId={userId} />
        {layout === "full" ? (
          groups.map(({ group, games }) => (
            <Box
              key={group}
              sx={{ display: "flex", flexDirection: "column", gap: 1 }}
            >
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: 1,
                }}
              >
                <GroupHeader>{group}</GroupHeader>
              </Box>
              {/* Upcoming games are rows even in Full: before kickoff a card
                  has nothing a row doesn't (its linescore is all dashes), and
                  15 empty cards buried the one result between game days. */}
              {group === "Upcoming" ? (
                <Paper variant="outlined" sx={{ overflow: "hidden" }}>
                  {games.map(row)}
                </Paper>
              ) : (
                <Grid container spacing={2} sx={{ alignItems: "flex-start" }}>
                  {games.map((game) => (
                    <Grid key={game.game_id} size={{ xs: 12, md: 6, xl: 4 }}>
                      <GameCard
                        game={game}
                        userId={userId}
                        totalUsers={totalUsers}
                        tags={gameTags.get(game.game_id)}
                        picksRevealed={picksRevealed(game, deadline, now)}
                        total={totals.get(game.game_id)}
                      />
                    </Grid>
                  ))}
                </Grid>
              )}
            </Box>
          ))
        ) : (
          <>
            <Paper variant="outlined" sx={{ overflow: "hidden" }}>
              {groups.map(({ group, games }) => (
                <Box key={group}>
                  <Box
                    sx={{
                      px: 1.75,
                      py: 0.5,
                      bgcolor: "action.hover",
                      borderBottom: 1,
                      borderColor: "divider",
                    }}
                  >
                    <GroupHeader>{group}</GroupHeader>
                  </Box>
                  {games.map(row)}
                </Box>
              ))}
            </Paper>
          </>
        )}
        <ByeTeams teams={byes} />
      </Box>
    </>
  );
});

Scoreboard.displayName = "Scoreboard";

export default Scoreboard;
