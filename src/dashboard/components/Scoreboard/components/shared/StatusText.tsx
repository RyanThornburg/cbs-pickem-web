import Box from "@mui/material/Box";
import { Game, GameStatus } from "../../../../types";
import { statusLabel } from "../../utils/scoreboardUtils";
import { formatGameShort } from "../../utils/dateFormatters";

export const StatusText = ({ game }: { game: Game }) => {
  const live = game.status === GameStatus.Inprogress;
  // Live and halftime read in ink; only the pulsing dot says "live". Red and
  // green are kept for how the pool's picks are doing.
  const color =
    live ||
    game.status === GameStatus.Halftime ||
    game.status === GameStatus.Delayed
      ? "text.primary"
      : "text.secondary";
  const label =
    game.status === GameStatus.Scheduled
      ? formatGameShort(game.game_time)
      : statusLabel(game);

  return (
    <Box
      component="span"
      sx={{
        display: "inline-flex",
        alignItems: "center",
        gap: 0.75,
        fontWeight: 700,
        fontSize: "0.85rem",
        letterSpacing: "0.03em",
        textTransform: "uppercase",
        // kickoff times ("MON 8:15 PM") may wrap in the narrow compact column
        whiteSpace: game.status === GameStatus.Scheduled ? "normal" : "nowrap",
        color,
        "@keyframes scoreboardPulse": { "50%": { opacity: 0.35 } },
        ...(live && {
          "&::before": {
            content: '""',
            width: 7,
            height: 7,
            borderRadius: "50%",
            bgcolor: "error.main",
            animation: "scoreboardPulse 1.6s infinite",
            "@media (prefers-reduced-motion: reduce)": { animation: "none" },
          },
        }),
      }}
    >
      {label}
    </Box>
  );
};

const TV_NAMES: Record<string, string> = { ESPD: "ESPN", AMZN: "Prime" };
export const tvName = (tv?: string) => (tv ? (TV_NAMES[tv] ?? tv) : "");
