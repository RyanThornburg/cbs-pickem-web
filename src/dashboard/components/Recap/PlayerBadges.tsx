import { ordinal } from "../../helper";
import { RecapMove } from "../../types";
import { BadgeTooltip } from "../UsersTable/BadgeTooltip";
import styles from "./PlayerBadges.module.css";

// Leaderboard move of 3+ places since last week (from the recap key).
export function MoverBadge({
  move,
  plain,
}: {
  move: RecapMove | undefined;
  plain?: boolean;
}) {
  if (!move || move.change === 0) return null;
  const up = move.change > 0;
  const places = Math.abs(move.change);
  return (
    <BadgeTooltip
      plain={plain}
      title={`${up ? "Up" : "Down"} ${places} places since last week (${ordinal(move.rank_before)} → ${ordinal(move.rank_after)})`}
    >
      <span
        className={`${styles.chip} ${styles.mover} ${up ? styles.up : styles.down}`}
      >
        {up ? "▲" : "▼"}
        {places}
      </span>
    </BadgeTooltip>
  );
}

// Went 5-0 this week. (0-5 is deliberately not badged on a player's row.)
export function PerfectWeekBadge({
  perfect,
  plain,
}: {
  perfect: boolean;
  plain?: boolean;
}) {
  if (!perfect) return null;
  return (
    <BadgeTooltip plain={plain} title="Perfect week: 5-0">
      <span className={`${styles.chip} ${styles.perfect}`}>5-0</span>
    </BadgeTooltip>
  );
}
