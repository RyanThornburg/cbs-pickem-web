import { Icon } from "../../ui/Icon";
import { BadgeTooltip } from "./BadgeTooltip";
import styles from "./DefendingChampionBadge.module.css";

// Only the most recently closed season's winner gets this -- not an
// all-time "ever won a title" badge (career.titles), which isn't shown
// here. Derived from career.trend.last_season.rank === 1, so it clears
// itself automatically once a new season closes with a different winner.
export function DefendingChampionBadge({
  season,
  plain,
}: {
  season: number | null;
  plain?: boolean;
}) {
  if (season == null) return null;

  return (
    <BadgeTooltip plain={plain} title={`Defending champion (${season})`}>
      <div className={styles.tile}>
        <Icon name="EmojiEvents" className={styles.icon} />
      </div>
    </BadgeTooltip>
  );
}
