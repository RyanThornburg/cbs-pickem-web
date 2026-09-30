import Box from "@mui/material/Box";
import { alpha, Theme } from "@mui/material/styles";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import TrendingDownIcon from "@mui/icons-material/TrendingDown";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import CloseIcon from "@mui/icons-material/Close";
import RemoveIcon from "@mui/icons-material/Remove";
import { Game } from "../../../../types";
import { getPickState, PickState, Side } from "../../utils/scoreboardUtils";

// Deliberately not the flame/snowflake -- those mean weekly form on User
// Picks (WeeklyFormIcon). Check/✗ match what the old scoreboard used.
const STATE: Record<
  PickState,
  { word: string; color: (t: Theme) => string; Icon?: typeof CloseIcon }
> = {
  notStarted: { word: "Not started", color: (t) => t.palette.primary.main },
  covering: {
    word: "Covering",
    color: (t) => t.palette.success.main,
    Icon: TrendingUpIcon,
  },
  notCovering: {
    word: "Not covering",
    color: (t) => t.palette.error.main,
    Icon: TrendingDownIcon,
  },
  push: {
    word: "Push",
    color: (t) => t.palette.warning.main,
    Icon: RemoveIcon,
  },
  won: {
    word: "Won",
    color: (t) => t.palette.success.main,
    Icon: CheckCircleOutlineIcon,
  },
  lost: { word: "Lost", color: (t) => t.palette.error.main, Icon: CloseIcon },
};

interface Props {
  game: Game;
  side: Side;
  compact?: boolean;
}

export const YourPickBadge = ({ game, side, compact }: Props) => {
  const state = getPickState(game, side);
  const { word, color, Icon } = STATE[state];
  const abbr = (side === "home" ? game.home_team : game.away_team).abbr;
  const label = compact
    ? `You: ${abbr}`
    : `Your pick: ${abbr}${Icon ? ` · ${word}` : ""}`;

  return (
    <Box
      component="span"
      title={`Your pick: ${abbr}. ${word}.`}
      aria-label={`Your pick: ${abbr}, ${word}`}
      sx={{
        display: "inline-flex",
        alignItems: "center",
        gap: 0.5,
        px: 1,
        py: "2px",
        borderRadius: 999,
        fontSize: "0.78rem",
        fontWeight: 600,
        whiteSpace: "nowrap",
        color,
        bgcolor: (t) => alpha(color(t), 0.12),
        boxShadow: (t) =>
          Icon ? `inset 0 0 0 1px ${alpha(color(t), 0.6)}` : "none",
      }}
    >
      {label}
      {Icon && <Icon sx={{ fontSize: "0.95rem" }} />}
    </Box>
  );
};
