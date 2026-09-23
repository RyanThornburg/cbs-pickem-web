import Box from "@mui/material/Box";
import Tooltip from "@mui/material/Tooltip";
import LocalFireDepartmentIcon from "@mui/icons-material/LocalFireDepartment";
import { SEASON_STREAK_MIN_WEEKS } from "./usersTableUtils";

// Season-level hot streak, from the user:N:season endpoint's
// current_season.hot_streak.current_streak -- distinct from WeeklyFormIcon's
// per-week signal, which is derived from picks already on screen.
export function StreakBadge({ weeks }: { weeks: number }) {
  if (weeks < SEASON_STREAK_MIN_WEEKS) return null;

  return (
    <Tooltip title={`Hot streak: ${weeks} weeks in a row hitting their accuracy threshold`}>
      <Box
        sx={{
          display: "inline-flex",
          alignItems: "center",
          gap: 0.3,
          background: "linear-gradient(90deg, #ff7043, #ff5252)",
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
        {weeks}
      </Box>
    </Tooltip>
  );
}
