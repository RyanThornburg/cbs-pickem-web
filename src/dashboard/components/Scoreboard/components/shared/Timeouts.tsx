import styles from "./Timeouts.module.css";

// Three pips, filled for each timeout left. Renders nothing when the feed
// has no count (between plays, or before the pipeline deploy).
export const Timeouts = ({ left }: { left?: number }) => {
  if (left == null) return null;
  return (
    <span
      title={`${left} timeout${left === 1 ? "" : "s"} left`}
      className={styles.pips}
    >
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className={[styles.pip, i < left && styles.left]
            .filter(Boolean)
            .join(" ")}
        />
      ))}
    </span>
  );
};
