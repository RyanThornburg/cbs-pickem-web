import { Box } from "@mui/material";
import { ordinal } from "../../helper";
import { RecapMove } from "../../types";
import { BadgeTooltip } from "../UsersTable/BadgeTooltip";

const chipSx = {
  fontSize: "0.75rem",
  fontWeight: 700,
  lineHeight: 1.4,
  borderRadius: 0.5,
  px: 0.5,
  whiteSpace: "nowrap",
} as const;

// Leaderboard move of 3+ places since last week (from the recap key).
export function MoverBadge({
  move,
  plain,
}: {
  move: RecapMove | undefined;
  plain?: boolean;
}) {
  if (!move || move.change === 0) return null;
  const up = move.change > 0;
  const places = Math.abs(move.change);
  return (
    <BadgeTooltip
      plain={plain}
      title={`${up ? "Up" : "Down"} ${places} places since last week (${ordinal(move.rank_before)} → ${ordinal(move.rank_after)})`}
    >
      <Box
        component="span"
        sx={{
          ...chipSx,
          fontVariantNumeric: "tabular-nums",
          bgcolor: up ? "hsl(145, 55%, 92%)" : "hsl(0, 80%, 95%)",
          color: up ? "hsl(145, 60%, 28%)" : "hsl(0, 65%, 42%)",
        }}
      >
        {up ? "▲" : "▼"}
        {places}
      </Box>
    </BadgeTooltip>
  );
}

// Went 5-0 this week. (0-5 is deliberately not badged on a player's row.)
export function PerfectWeekBadge({
  perfect,
  plain,
}: {
  perfect: boolean;
  plain?: boolean;
}) {
  if (!perfect) return null;
  return (
    <BadgeTooltip plain={plain} title="Perfect week: 5-0">
      <Box
        component="span"
        sx={{
          ...chipSx,
          bgcolor: "hsl(45, 100%, 90%)",
          color: "hsl(35, 80%, 28%)",
        }}
      >
        5-0
      </Box>
    </BadgeTooltip>
  );
}
