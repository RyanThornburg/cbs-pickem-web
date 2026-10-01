import Box from "@mui/material/Box";
import LocalFireDepartmentIcon from "@mui/icons-material/LocalFireDepartment";
import AcUnitIcon from "@mui/icons-material/AcUnit";
import FiberManualRecordIcon from "@mui/icons-material/FiberManualRecord";
import { UserPick } from "../../types";
import { getWeeklyForm, WeeklyForm, WeeklyFormResult } from "./usersTableUtils";
import { BadgeTooltip } from "./BadgeTooltip";

// Icon colors are at least 3:1 on their tinted tiles (the brighter
// #ff7043 / #4fc3f7 / #9aa4b2 were 1.8 to 2.3:1).
const FORM_STYLES = {
  hot: {
    bg: "rgba(255,112,67,0.18)",
    icon: (
      <LocalFireDepartmentIcon
        sx={{ fontSize: "0.8125rem" }}
        htmlColor="#d84315"
      />
    ),
    label: "hot",
  },
  cold: {
    bg: "rgba(79,195,247,0.16)",
    icon: <AcUnitIcon sx={{ fontSize: "0.75rem" }} htmlColor="#0277bd" />,
    label: "cold",
  },
  neutral: {
    bg: "rgba(154,164,178,0.14)",
    icon: (
      <FiberManualRecordIcon sx={{ fontSize: "0.5rem" }} htmlColor="#717a8a" />
    ),
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
  if (result.tooEarly)
    return `This week: too early to call (${result.decided} of ${result.total} decided). ${summary}`;
  // Named, so the key's "hot week" / "cold week" matches what a tap says.
  const lead =
    result.form === "hot"
      ? "Hot week"
      : result.form === "cold"
        ? "Cold week"
        : "This week";
  return `${lead}: ${summary}`;
};

// Per-week hot/cold, derived from this week's picks already loaded in
// RankedUser -- no separate endpoint. Distinct from StreakBadge's
// season-level streak. Always rendered (neutral until enough picks decide).
export function WeeklyFormIcon({ picks }: { picks: UserPick[] }) {
  const result = getWeeklyForm(picks);
  return (
    <BadgeTooltip title={weeklyFormTooltip(result)}>
      <FormTile form={result.form} />
    </BadgeTooltip>
  );
}

// The tile alone, also drawn in the badge key.
export function FormTile({ form }: { form: WeeklyForm }) {
  const style = FORM_STYLES[form];
  return (
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
  );
}
