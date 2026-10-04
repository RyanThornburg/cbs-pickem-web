import Box from "@mui/material/Box";
import { alpha, Theme } from "@mui/material/styles";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import TrendingDownIcon from "@mui/icons-material/TrendingDown";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutlined";
import CloseIcon from "@mui/icons-material/Close";
import RemoveIcon from "@mui/icons-material/Remove";
import { Game } from "../../../../types";
import {
  getPickState,
  PickState,
  pickStateText,
  Side,
} from "../../utils/scoreboardUtils";

// Deliberately not the flame/snowflake -- those mean weekly form on User
// Picks (WeeklyFormIcon). Check/✗ match what the old scoreboard used.
// `tint` colors the fill and ring; `ink` (one step darker) is the text, so
// it stays readable on the tint and inside a close game's amber row.
// A push is neutral: nobody won or lost it.
const STATE: Record<
  PickState,
  {
    ink: (t: Theme) => string;
    tint: (t: Theme) => string;
    Icon?: typeof CloseIcon;
  }
> = {
  notStarted: {
    ink: (t) => t.palette.primary.dark,
    tint: (t) => t.palette.primary.main,
  },
  covering: {
    ink: (t) => t.palette.success.dark,
    tint: (t) => t.palette.success.main,
    Icon: TrendingUpIcon,
  },
  notCovering: {
    ink: (t) => t.palette.error.dark,
    tint: (t) => t.palette.error.main,
    Icon: TrendingDownIcon,
  },
  push: {
    ink: (t) => t.palette.text.primary,
    tint: (t) => t.palette.text.secondary,
    Icon: RemoveIcon,
  },
  won: {
    ink: (t) => t.palette.success.dark,
    tint: (t) => t.palette.success.main,
    Icon: CheckCircleOutlineIcon,
  },
  lost: {
    ink: (t) => t.palette.error.dark,
    tint: (t) => t.palette.error.main,
    Icon: CloseIcon,
  },
};

interface Props {
  game: Game;
  side: Side;
  compact?: boolean;
}

export const YourPickBadge = ({ game, side, compact }: Props) => {
  const state = getPickState(game, side);
  const { ink, tint, Icon } = STATE[state];
  const { full, short } = pickStateText(game, side);
  const abbr = (side === "home" ? game.home_team : game.away_team).abbr;
  const label = compact
    ? `You: ${abbr}${short ? ` · ${short}` : ""}`
    : `Your pick: ${abbr}${Icon ? ` · ${full}` : ""}`;

  return (
    <Box
      component="span"
      title={`Your pick: ${abbr}. ${full}.`}
      aria-label={`Your pick: ${abbr}, ${full}`}
      sx={{
        display: "inline-flex",
        alignItems: "center",
        gap: 0.5,
        px: 1,
        py: "2px",
        borderRadius: 999,
        fontSize: "0.75rem",
        fontWeight: 600,
        whiteSpace: "nowrap",
        color: ink,
        bgcolor: (t) => alpha(tint(t), 0.12),
        boxShadow: (t) =>
          Icon ? `inset 0 0 0 1px ${alpha(tint(t), 0.6)}` : "none",
      }}
    >
      {label}
      {Icon && <Icon sx={{ fontSize: "0.95rem" }} />}
    </Box>
  );
};
