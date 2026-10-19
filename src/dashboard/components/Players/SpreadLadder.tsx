import { SpreadBucketRecord } from "../../types";
import uiStyles from "../../ui/ui.module.css";
import { SPREAD_BUCKET_LABELS } from "./playerUtils";
import styles from "./SpreadLadder.module.css";

// The tallest bar's height; every bar is to the same scale.
const MAX_BAR = 64;
// A half column: the tallest bar plus its count's line.
const HALF = { height: MAX_BAR + 18 };

// Wins up, losses down, one column per line size from big favorites to big
// underdogs, so "where do this player's picks win" reads left to right.
export function SpreadLadder({ buckets }: { buckets: SpreadBucketRecord[] }) {
  const max = Math.max(1, ...buckets.map((b) => Math.max(b.wins, b.losses)));
  const unit = MAX_BAR / max;
  const bar = (count: number, up: boolean) => (
    <div
      className={`${styles.half} ${up ? styles.won : styles.lost}`}
      style={HALF}
    >
      {count > 0 && (
        <>
          <div className={styles.bar} style={{ height: count * unit }} />
          <p aria-hidden className={styles.count}>
            {count}
          </p>
        </>
      )}
    </div>
  );
  return (
    <div className={styles.ladder}>
      <div aria-hidden className={styles.legend}>
        <div className={styles.legendWon} style={HALF}>
          Won
        </div>
        <div className={styles.legendAxis} />
        <div className={styles.legendLost}>Lost</div>
      </div>
      {buckets.map((bucket) => {
        const { short, long } = SPREAD_BUCKET_LABELS[bucket.bucket];
        return (
          <div
            key={bucket.bucket}
            role="group"
            aria-label={long}
            className={styles.column}
          >
            {bar(bucket.wins, true)}
            <div className={styles.axis} />
            {bar(bucket.losses, false)}
            <p
              aria-hidden
              className={
                bucket.picks
                  ? styles.label
                  : `${styles.label} ${styles.noPicks}`
              }
            >
              {short}
            </p>
            <span className={uiStyles.visuallyHidden}>
              {bucket.wins} won, {bucket.losses} lost
            </span>
          </div>
        );
      })}
    </div>
  );
}
