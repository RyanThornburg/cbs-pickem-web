import { Box, Tooltip } from "@mui/material";
import { getOrdinal } from "../../helper";
import { RecapMove } from "../../types";

// Leaderboard move of 3+ places since last week (from the recap key).
export function MoverBadge({ move }: { move: RecapMove | undefined }) {
  if (!move || move.change === 0) return null;
  const up = move.change > 0;
  const places = Math.abs(move.change);
  return (
    <Tooltip
      title={`${up ? "Up" : "Down"} ${places} places since last week (${move.rank_before}${getOrdinal(
        move.rank_before
      )} → ${move.rank_after}${getOrdinal(move.rank_after)})`}
    >
      <Box
        component="span"
        sx={{
          fontSize: "0.68rem",
          fontWeight: 800,
          lineHeight: 1.5,
          borderRadius: 0.5,
          px: 0.5,
          whiteSpace: "nowrap",
          fontVariantNumeric: "tabular-nums",
          flexShrink: 0,
          bgcolor: up ? "hsl(145, 55%, 92%)" : "hsl(0, 80%, 95%)",
          color: up ? "hsl(145, 60%, 28%)" : "hsl(0, 65%, 42%)",
        }}
      >
        {up ? "▲" : "▼"}
        {places}
      </Box>
    </Tooltip>
  );
}

// Went 5-0 this week. (0-5 is deliberately not badged on a player's row.)
export function PerfectWeekBadge({ perfect }: { perfect: boolean }) {
  if (!perfect) return null;
  return (
    <Tooltip title="Perfect week: 5-0">
      <Box
        component="span"
        sx={{
          fontSize: "0.68rem",
          fontWeight: 800,
          lineHeight: 1.5,
          borderRadius: 0.5,
          px: 0.5,
          whiteSpace: "nowrap",
          flexShrink: 0,
          bgcolor: "hsl(45, 100%, 90%)",
          color: "hsl(35, 80%, 28%)",
        }}
      >
        5-0
      </Box>
    </Tooltip>
  );
}
