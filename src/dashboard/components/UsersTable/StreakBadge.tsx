import Box from "@mui/material/Box";
import Tooltip from "@mui/material/Tooltip";
import LocalFireDepartmentIcon from "@mui/icons-material/LocalFireDepartment";
import { SEASON_STREAK_MIN_WEEKS } from "./usersTableUtils";

// Season-level hot streak, from the user:N:season endpoint's
// current_season.hot_streak.current_streak -- distinct from WeeklyFormIcon's
// per-week signal, which is derived from picks already on screen.
// thresholdPct is hot_streak.threshold_pct (0.8 as of 2026): a week counts
// when that share of the 5 picks is right, i.e. 4 or more.
const PICKS_PER_WEEK = 5;

export function StreakBadge({
  weeks,
  thresholdPct = 0.8,
}: {
  weeks: number;
  thresholdPct?: number;
}) {
  if (weeks < SEASON_STREAK_MIN_WEEKS) return null;
  const minCorrect = Math.ceil(thresholdPct * PICKS_PER_WEEK - 1e-9);

  return (
    <Tooltip
      title={`Hot streak: ${weeks} straight weeks going ${minCorrect}+ or better`}
    >
      <Box
        sx={{
          display: "inline-flex",
          alignItems: "center",
          gap: 0.3,
          // Deep enough for white text at 11px (5.6:1); the brighter
          // #ff7043 → #ff5252 flame was 2.7:1.
          background: "linear-gradient(90deg, #bf360c, #c62828)",
          color: "#fff",
          borderRadius: "12px",
          padding: "1px 7px 1px 5px",
          fontSize: "0.6875rem",
          fontWeight: 700,
          lineHeight: 1.4,
          whiteSpace: "nowrap",
        }}
      >
        <LocalFireDepartmentIcon sx={{ fontSize: "0.8125rem" }} />
        {/* The unit tells it apart from the Week column's flame, which is
            this week only. */}
        {weeks} wks
      </Box>
    </Tooltip>
  );
}
