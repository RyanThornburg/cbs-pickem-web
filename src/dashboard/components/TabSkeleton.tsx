import Skeleton from "@mui/material/Skeleton";
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
  const animation = animate ? "pulse" : false;
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
          animation={animation}
          variant="text"
          width={140}
          sx={{ fontSize: "1.25rem", mb: 1 }}
        />
        <div className={styles.tilesRow}>
          {Array.from({ length: 6 }, (_, i) => (
            <Skeleton
              key={i}
              animation={animation}
              variant="rounded"
              height={150}
              sx={{ flex: "0 0 156px", borderRadius: 2 }}
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
          animation={animation}
          variant="rounded"
          height={176}
          sx={{ borderRadius: 2 }}
        />
      ))}
    </div>
  );
}
