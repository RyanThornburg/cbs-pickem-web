import { Game } from "../../../../types";
import {
  getPickState,
  PickState,
  pickStateText,
  Side,
} from "../../utils/scoreboardUtils";
import { Icon, IconName } from "../../../../ui/Icon";
import styles from "./YourPickBadge.module.css";

// Deliberately not the flame/snowflake -- those mean weekly form on User
// Picks (WeeklyFormIcon). Check/✗ match what the old scoreboard used.
// The colors are in YourPickBadge.module.css, one class per state.
const ICONS: Record<PickState, IconName | undefined> = {
  notStarted: undefined,
  covering: "TrendingUp",
  notCovering: "TrendingDown",
  push: "Remove",
  won: "CheckCircleOutlined",
  lost: "Close",
};

interface Props {
  game: Game;
  side: Side;
  compact?: boolean;
}

export const YourPickBadge = ({ game, side, compact }: Props) => {
  const state = getPickState(game, side);
  const icon = ICONS[state];
  const { full, short } = pickStateText(game, side);
  const abbr = (side === "home" ? game.home_team : game.away_team).abbr;
  const label = compact
    ? `You: ${abbr}${short ? ` · ${short}` : ""}`
    : `Your pick: ${abbr}${icon ? ` · ${full}` : ""}`;

  return (
    <span
      title={`Your pick: ${abbr}. ${full}.`}
      aria-label={`Your pick: ${abbr}, ${full}`}
      className={[styles.badge, styles[state], icon && styles.ringed]
        .filter(Boolean)
        .join(" ")}
    >
      {label}
      {icon && <Icon name={icon} className={styles.icon} />}
    </span>
  );
};
