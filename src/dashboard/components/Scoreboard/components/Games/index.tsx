// components/Games/index.tsx
import { memo } from "react";
import { Box, Grid2 as Grid, Stack } from "@mui/material";
import { Game } from "../../../../types";
import { GameCard } from "../GameCard";

interface GamesProps {
  header: string;
  games: Game[];
}

export const Games = memo(({ header, games }: GamesProps) => {
  return (
    <Stack spacing={1}>
      <Box sx={{ fontSize: "1.25rem", paddingTop: "8px", textAlign: "left" }}>
        {header}
      </Box>

      <Stack spacing={1}>
        <Grid container spacing={2} size={{ xs: 12, sm: 12, md: 12 }}>
          {games.map((game) => (
            <GameCard key={game.game_id} game={game} />
          ))}
        </Grid>
      </Stack>
    </Stack>
  );
});

Games.displayName = "Games";
