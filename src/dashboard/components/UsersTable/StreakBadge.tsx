import { Icon } from "../../ui/Icon";
import { SEASON_STREAK_MIN_WEEKS } from "./usersTableUtils";
import { BadgeTooltip } from "./BadgeTooltip";
import styles from "./StreakBadge.module.css";

// Season-level hot streak, from the user:N:season endpoint's
// current_season.hot_streak.current_streak -- distinct from WeeklyFormIcon's
// per-week signal, which is derived from picks already on screen.
// thresholdPct is hot_streak.threshold_pct (0.8 as of 2026): a week counts
// when that share of the 5 picks is right, i.e. 4 or more.
const PICKS_PER_WEEK = 5;

export function StreakBadge({
  weeks,
  thresholdPct = 0.8,
  plain,
}: {
  weeks: number;
  thresholdPct?: number;
  plain?: boolean;
}) {
  if (weeks < SEASON_STREAK_MIN_WEEKS) return null;
  const minCorrect = Math.ceil(thresholdPct * PICKS_PER_WEEK - 1e-9);

  return (
    <BadgeTooltip
      plain={plain}
      title={`Hot streak: ${weeks} straight weeks going ${minCorrect}+ or better`}
    >
      <div className={styles.pill}>
        <Icon name="LocalFireDepartment" className={styles.icon} />
        {/* The unit tells it apart from the Week column's flame, which is
            this week only. */}
        {weeks} wks
      </div>
    </BadgeTooltip>
  );
}
