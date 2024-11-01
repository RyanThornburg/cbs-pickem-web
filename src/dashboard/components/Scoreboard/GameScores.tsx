import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid2";
import { Game } from "../../../types";
import GameResult from "./GameResult";

export type Props = {
  header: string;
  games: Game[];
};

export default function GameScores({ header, games }: Props) {
  return (
    <Box sx={{ display: "inline-block", width: "95%", mb: "16px" }}>
      <Box
        sx={{
          textAlign: "left",
          fontSize: "1.25rem",
          p: "0 16px 10px 16px",
        }}
      >
        {header}
      </Box>
      <Grid container spacing={2} size={{ xs: 12, sm: 12, md: 12 }}>
        {games.map((game) => (
          <GameResult game={game} />
        ))}
      </Grid>
    </Box>
  );
}
