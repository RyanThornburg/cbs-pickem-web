import styles from "./ScoreWithCovering.module.css";

// Settled points, then a green "+N" for picks covering right now, so a
// score that could still change reads as such. The same format as the
// leader cards; `total` is what the table sorts and ranks on.
export function ScoreWithCovering({
  total,
  covering,
  hideCoveringOnPhone = false,
}: {
  total: number;
  covering: number;
  // The phone table shows the "+N" once per row (in Score): it's the same
  // picks in every column, and three copies squeeze the name at 360px.
  hideCoveringOnPhone?: boolean;
}) {
  if (covering <= 0) return <>{total}</>;
  return (
    <span className={styles.score}>
      {total - covering}
      <span
        title={`${covering} pick${covering === 1 ? "" : "s"} covering now`}
        className={[styles.covering, hideCoveringOnPhone && styles.hideOnPhone]
          .filter(Boolean)
          .join(" ")}
      >
        +{covering}
      </span>
    </span>
  );
}
