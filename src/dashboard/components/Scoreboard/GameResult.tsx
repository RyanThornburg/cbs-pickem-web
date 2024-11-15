import { grey } from "@mui/material/colors";
import Grid from "@mui/material/Grid2";
import { Game } from "../../../types";
import TeamScore from "./TeamScore";
export type Props = {
  game: Game;
};

export default function GameResult({ game }: Props) {
  const key = `gameResult-${game.id}`;
  return (
    <Grid
      id={key}
      key={key}
      container
      size={{ xs: 12, sm: 12, md: 5 }}
      sx={{
        m: "0 15px 0 10px",
        p: "15px",
        borderBottom: `2px solid ${grey[500]}`,
      }}
    >
      <Grid key={`${key}-away`} id={`${key}-away`} size={12}>
        {<TeamScore isHome={false} game={game} />}
      </Grid>
      <Grid key={`${key}-home`} id={`${key}-home`} size={12}>
        {<TeamScore isHome={true} game={game} />}
      </Grid>
    </Grid>
  );
}
