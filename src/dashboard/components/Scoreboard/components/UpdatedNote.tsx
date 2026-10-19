import { formatUpdated } from "../../../utils/updatedTime";
import { Button } from "../../../ui/Button";
import { Icon } from "../../../ui/Icon";
import styles from "./UpdatedNote.module.css";

// The Scoreboard's freshness line on the tab intro, at every width: while a
// game is live, when the scores were last fetched; after a failed refresh,
// that the scores on screen are from then (User Picks' wording). Nothing on
// a quiet day, when the time would only be noise.
export function UpdatedNote({
  updatedAt,
  refreshFailed,
  onRetry,
  live,
}: {
  updatedAt: Date | null;
  refreshFailed: boolean;
  // "Try now" after a failed refresh, as on User Picks.
  onRetry?: () => void;
  live: boolean;
}) {
  if (!updatedAt || !(live || refreshFailed)) return null;
  return (
    <span role="status" className={styles.note}>
      {refreshFailed && (
        <Icon name="ErrorOutlineOutlined" className={styles.icon} />
      )}
      {refreshFailed
        ? `Couldn't refresh. Showing ${formatUpdated(updatedAt)}, trying again every minute.`
        : `Updated ${formatUpdated(updatedAt)}`}
      {refreshFailed && onRetry && (
        <Button size="small" onClick={onRetry}>
          Try now
        </Button>
      )}
    </span>
  );
}
