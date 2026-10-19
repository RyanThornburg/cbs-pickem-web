import { LeaderboardStatus } from "../useWeekData";
import { formatUpdated } from "../../utils/updatedTime";
import LoadError from "../shared/LoadError";
import { Button } from "../../ui/Button";
import { Icon } from "../../ui/Icon";
import { Skeleton } from "../../ui/Skeleton";
import styles from "./StandingsStatus.module.css";

// Deep trophy gold for text: 5.1:1 on white (DESIGN.md's #a87f12 was 3.7:1).
export const MONEY_GOLD = "#8a6a0f";

// Shown above the table only when the last refresh failed (or the page
// opened on this browser's saved copy and couldn't refresh it). A good
// refresh shows its time in the desktop table's header row instead, and
// nowhere on phones, so it never takes a row of its own.
export function RefreshFailedLine({
  leaderboardStatus,
  onRetry,
}: {
  leaderboardStatus: LeaderboardStatus;
  onRetry: () => void;
}) {
  const { updatedAt, failed } = leaderboardStatus;
  if (!failed || !updatedAt) return null;
  return (
    <div role="status" className={styles.refreshFailed}>
      <span className={styles.refreshFailedText}>
        <Icon
          name="ErrorOutlineOutlined"
          className={styles.refreshFailedIcon}
        />
        {`Couldn't refresh. Showing ${formatUpdated(updatedAt)}, trying again every minute.`}
      </span>
      <Button size="small" onClick={onRetry}>
        Try now
      </Button>
    </div>
  );
}

// What User Picks shows before there's a table: skeleton rows while the
// week loads, a retrying error when it can't, and an empty note when the
// week loaded with nobody in it. Never a blank tab.
export function StandingsPlaceholder({
  week,
  leaderboardStatus,
  onRetry,
}: {
  week: number;
  leaderboardStatus: LeaderboardStatus;
  onRetry: () => void;
}) {
  const { updatedAt, failed } = leaderboardStatus;

  if (failed) {
    return (
      <LoadError
        title={`Couldn't load the week ${week} standings.`}
        detail="Trying again every minute."
        onRetry={onRetry}
      />
    );
  }
  if (updatedAt) {
    return <LoadError title={`No standings for week ${week} yet.`} />;
  }

  return <StandingsSkeleton label={`Loading the week ${week} standings`} />;
}

// Placeholder standings rows, also the app's body while meta first loads
// (AppShellStatus), so User Picks looks the same through both loads.
export function StandingsSkeleton({
  label,
  animate = true,
}: {
  label: string;
  animate?: boolean;
}) {
  return (
    // Still and faded when nothing is loading (StandingsStatus.module.css).
    <div
      role="status"
      aria-busy={animate}
      aria-label={label}
      className={animate ? undefined : styles.skeletonStill}
    >
      {Array.from({ length: 8 }, (_, i) => (
        <div key={i} className={styles.skeletonRow}>
          <Skeleton animate={animate} variant="text" width={20} />
          <Skeleton
            animate={animate}
            variant="circular"
            width={26}
            height={26}
          />
          <Skeleton
            animate={animate}
            variant="text"
            className={styles.skeletonName}
          />
          <Skeleton
            animate={animate}
            variant="rounded"
            height={24}
            className={styles.skeletonPicks}
          />
        </div>
      ))}
    </div>
  );
}
