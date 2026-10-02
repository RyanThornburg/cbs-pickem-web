import Box from "@mui/material/Box";
import { alpha } from "@mui/material/styles";
import { Game, GameStatus } from "../../../../types";
import { formatPts, getCover, Side } from "../../utils/scoreboardUtils";

// Next to whichever team is covering the pool's line (cbs_spread) right now,
// or covered it once final, with the margin: "✓ Covering by 3½". Both teams
// get "Push" when it's exactly on the line. Compact rows say "✓ by 3½" from
// lg up and just "✓" below that, where the team line has no room (the user's
// own games still show the margin on the your-pick badge).
export const AtsTag = ({
  game,
  side,
  compact,
}: {
  game: Game;
  side: Side;
  compact?: boolean;
}) => {
  const cover = getCover(game);
  if (!cover || (cover.side !== null && cover.side !== side)) return null;

  const push = cover.side === null;
  const final = game.status === GameStatus.Final;
  const by = formatPts(cover.by);
  const label = push ? (
    "Push"
  ) : compact ? (
    <>
      ✓{/* visually hidden below lg, still read out */}
      <Box
        component="span"
        sx={(t) => ({
          [t.breakpoints.down("lg")]: {
            position: "absolute",
            width: "1px",
            height: "1px",
            overflow: "hidden",
            clip: "rect(0 0 0 0)",
            whiteSpace: "nowrap",
          },
        })}
      >
        {` by ${by}`}
      </Box>
    </>
  ) : (
    `✓ ${final ? "Covered" : "Covering"} by ${by}`
  );
  return (
    <Box
      component="span"
      title={
        push
          ? "Exactly on the spread"
          : final
            ? `Covered the spread by ${by}`
            : `Covering the spread by ${by} right now`
      }
      sx={{
        fontSize: "0.75rem",
        fontWeight: 600,
        px: "5px",
        py: "1px",
        borderRadius: "4px",
        whiteSpace: "nowrap",
        color: (t) =>
          push || final ? t.palette.text.primary : t.palette.success.dark,
        bgcolor: (t) =>
          alpha(
            push || final ? t.palette.text.secondary : t.palette.success.main,
            0.12
          ),
      }}
    >
      {label}
    </Box>
  );
};
