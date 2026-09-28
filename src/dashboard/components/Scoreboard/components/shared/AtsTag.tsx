import Box from "@mui/material/Box";
import { alpha } from "@mui/material/styles";
import { Game, GameStatus } from "../../../../types";
import { getCover, Side } from "../../utils/scoreboardUtils";

// Next to whichever team is covering the pool's line (cbs_spread) right now,
// or covered it once final. Both teams get PUSH when it's exactly on the line.
export const AtsTag = ({ game, side }: { game: Game; side: Side }) => {
  const cover = getCover(game);
  if (!cover || (cover.side !== null && cover.side !== side)) return null;

  const push = cover.side === null;
  const final = game.status === GameStatus.Final;
  return (
    <Box
      component="span"
      title={
        push
          ? "Exactly on the spread"
          : final
          ? "Covered the spread"
          : "Covering the spread right now"
      }
      sx={{
        fontSize: "0.66rem",
        fontWeight: 700,
        letterSpacing: "0.04em",
        px: "5px",
        py: "1px",
        borderRadius: "3px",
        whiteSpace: "nowrap",
        color: (t) =>
          push ? t.palette.warning.main : final ? t.palette.text.secondary : t.palette.success.main,
        bgcolor: (t) =>
          alpha(
            push ? t.palette.warning.main : final ? t.palette.text.secondary : t.palette.success.main,
            0.14
          ),
      }}
    >
      {push ? "PUSH" : "✓ ATS"}
    </Box>
  );
};
