import { Game, GameStatus } from "../../../../types";
import { formatPts, getCover, Side } from "../../utils/scoreboardUtils";
import styles from "./AtsTag.module.css";

// Next to whichever team is covering the pool's line (cbs_spread) right now,
// or covered it once final, with the margin: "✓ Covering by 3½". Both teams
// get "Push" when it's exactly on the line. Compact rows say "✓ by 3½" from
// lg up and just "✓" below that, where the team line has no room (the user's
// own games still show the margin on the your-pick badge).
export const AtsTag = ({
  game,
  side,
  compact,
}: {
  game: Game;
  side: Side;
  compact?: boolean;
}) => {
  const cover = getCover(game);
  if (!cover || (cover.side !== null && cover.side !== side)) return null;

  const push = cover.side === null;
  const final = game.status === GameStatus.Final;
  const by = formatPts(cover.by);
  const label = push ? (
    "Push"
  ) : compact ? (
    <>
      ✓{/* visually hidden below lg, still read out */}
      <span className={styles.marginBelowLg}>{` by ${by}`}</span>
    </>
  ) : (
    `✓ ${final ? "Covered" : "Covering"} by ${by}`
  );
  return (
    <span
      title={
        push
          ? "Exactly on the spread"
          : final
            ? `Covered the spread by ${by}`
            : `Covering the spread by ${by} right now`
      }
      className={`${styles.tag} ${push || final ? styles.settled : styles.covering}`}
    >
      {label}
    </span>
  );
};
