import { ordinal } from "../../helper";
import { Icon } from "../../ui/Icon";
import { BadgeTooltip } from "./BadgeTooltip";
import { SegmentPrize } from "./usersTableUtils";
import styles from "./SegmentPrizeBadge.module.css";

const TONE: Record<number, string> = {
  1: styles.gold,
  2: styles.silver,
  3: styles.bronze,
};

// "1st half winner", "1st half · 2nd place", "1st half · tied for 3rd".
export const segmentPrizeText = ({ prize, place, tied }: SegmentPrize) =>
  place === 1 && !tied
    ? `${prize} winner`
    : `${prize} · ${tied ? "tied for " : ""}${ordinal(place)} place`;

// A medal for each finished segment the player was paid in (the 1st half
// from week 10 on), colored by place. Kept apart from the defending
// champion's trophy, which is last season's overall title.
export function SegmentPrizeBadge({
  prize,
  plain,
}: {
  prize: SegmentPrize;
  plain?: boolean;
}) {
  return (
    <BadgeTooltip plain={plain} title={segmentPrizeText(prize)}>
      <div className={`${styles.tile} ${TONE[prize.place] ?? styles.paid}`}>
        <Icon name="MilitaryTech" className={styles.icon} />
      </div>
    </BadgeTooltip>
  );
}
