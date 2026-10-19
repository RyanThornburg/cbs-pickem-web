import { Icon, IconName } from "../../ui/Icon";
import { UserPick } from "../../types";
import { getWeeklyForm, WeeklyForm, WeeklyFormResult } from "./usersTableUtils";
import { BadgeTooltip } from "./BadgeTooltip";
import styles from "./WeeklyFormIcon.module.css";

// Each form's icon; its tile and icon colors are in the CSS module.
const FORM_ICONS: Record<WeeklyForm, IconName> = {
  hot: "LocalFireDepartment",
  cold: "AcUnit",
  neutral: "FiberManualRecord",
};

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
  return (
    <div className={`${styles.tile} ${styles[form]}`}>
      <Icon name={FORM_ICONS[form]} className={styles[`${form}Icon`]} />
    </div>
  );
}
