import Box from "@mui/material/Box";
import Tooltip from "@mui/material/Tooltip";
import LocalFireDepartmentIcon from "@mui/icons-material/LocalFireDepartment";
import AcUnitIcon from "@mui/icons-material/AcUnit";
import FiberManualRecordIcon from "@mui/icons-material/FiberManualRecord";
import { UserPick } from "../../types";
import { getWeeklyForm, WeeklyFormResult } from "./usersTableUtils";

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

const weeklyFormTooltip = (result: WeeklyFormResult): string => {
  const parts = [
    result.won && `${result.won} won`,
    result.lost && `${result.lost} lost`,
    result.covering && `${result.covering} covering`,
    result.notCovering && `${result.notCovering} not covering`,
  ].filter(Boolean);
  if (!parts.length) return "This week: no picks decided yet";
  const summary = parts.join(", ");
  return result.tooEarly
    ? `This week: too early to call (${result.decided} of ${result.total} decided). ${summary}`
    : `This week: ${summary}`;
};

// Per-week hot/cold, derived from this week's picks already loaded in
// RankedUser -- no separate endpoint. Distinct from StreakBadge's
// season-level streak. Always rendered (neutral until enough picks decide).
export function WeeklyFormIcon({ picks }: { picks: UserPick[] }) {
  const result = getWeeklyForm(picks);
  const style = FORM_STYLES[result.form];

  return (
    <Tooltip title={weeklyFormTooltip(result)}>
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
