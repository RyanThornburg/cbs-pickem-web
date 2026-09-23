import Box from "@mui/material/Box";
import Tooltip from "@mui/material/Tooltip";
import LocalFireDepartmentIcon from "@mui/icons-material/LocalFireDepartment";
import AcUnitIcon from "@mui/icons-material/AcUnit";
import FiberManualRecordIcon from "@mui/icons-material/FiberManualRecord";
import { UserPick } from "../../types";
import { getWeeklyForm } from "./usersTableUtils";

const FORM_STYLES = {
  hot: {
    bg: "rgba(255,112,67,0.18)",
    icon: <LocalFireDepartmentIcon sx={{ fontSize: "0.8125rem" }} htmlColor="#ff7043" />,
    label: "hot",
  },
  cold: {
    bg: "rgba(79,195,247,0.16)",
    icon: <AcUnitIcon sx={{ fontSize: "0.75rem" }} htmlColor="#4fc3f7" />,
    label: "cold",
  },
  neutral: {
    bg: "rgba(154,164,178,0.14)",
    icon: <FiberManualRecordIcon sx={{ fontSize: "0.5rem" }} htmlColor="#9aa4b2" />,
    label: "even",
  },
} as const;

// Per-week hot/cold, derived from this week's picks already loaded in
// RankedUser -- no separate endpoint. Distinct from StreakBadge's
// season-level streak.
export function WeeklyFormIcon({ picks }: { picks: UserPick[] }) {
  const result = getWeeklyForm(picks);
  if (!result) return null;

  const style = FORM_STYLES[result.form];

  return (
    <Tooltip title={`This week: ${result.correct}/${result.graded} correct so far`}>
      <Box
        sx={{
          width: 22,
          height: 22,
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          bgcolor: style.bg,
        }}
      >
        {style.icon}
      </Box>
    </Tooltip>
  );
}
