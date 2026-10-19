import { Skeleton } from "../ui/Skeleton";
import { StandingsSkeleton } from "./UsersTable/StandingsStatus";
import styles from "./TabSkeleton.module.css";

// A loading placeholder shaped like the tab it stands in for, so the page
// doesn't briefly turn into a table on the Scoreboard: standings rows,
// game cards, or the Records tiles.
export type TabSkeletonShape = "rows" | "cards" | "tiles";

export default function TabSkeleton({
  shape,
  label,
  animate = true,
}: {
  shape: TabSkeletonShape;
  label: string;
  // Off once a load has failed, so the placeholders don't read as "still
  // loading" next to the error.
  animate?: boolean;
}) {
  if (shape === "rows") {
    return <StandingsSkeleton label={label} animate={animate} />;
  }

  if (shape === "tiles") {
    return (
      <div
        role="status"
        aria-busy={animate}
        aria-label={label}
        className={animate ? undefined : styles.stopped}
      >
        <Skeleton
          animate={animate}
          variant="text"
          width={140}
          className={styles.tilesTitle}
        />
        <div className={styles.tilesRow}>
          {Array.from({ length: 6 }, (_, i) => (
            <Skeleton
              key={i}
              animate={animate}
              variant="rounded"
              height={150}
              className={styles.tile}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div
      role="status"
      aria-busy={animate}
      aria-label={label}
      className={[styles.cards, !animate && styles.stopped]
        .filter(Boolean)
        .join(" ")}
    >
      {Array.from({ length: 6 }, (_, i) => (
        <Skeleton
          key={i}
          animate={animate}
          variant="rounded"
          height={176}
          className={styles.card}
        />
      ))}
    </div>
  );
}
