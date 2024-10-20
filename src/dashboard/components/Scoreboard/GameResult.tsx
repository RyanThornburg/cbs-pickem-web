import { grey } from "@mui/material/colors";
import Grid from "@mui/material/Grid2";
import { Game } from "../../../types";
import TeamScore from "./TeamScore";
export type Props = {
  game: Game;
};

export default function GameResult({ game }: Props) {
  return (
    <Grid
      container
      size={{ xs: 12, sm: 12, md: 5 }}
      sx={{
        m: "0 15px 0 10px",
        p: "15px",
        borderBottom: `2px solid ${grey[500]}`,
      }}
    >
      <Grid size={12}>{<TeamScore isHome={false} game={game} />}</Grid>
      <Grid size={12}>{<TeamScore isHome={true} game={game} />}</Grid>
    </Grid>
  );
}
