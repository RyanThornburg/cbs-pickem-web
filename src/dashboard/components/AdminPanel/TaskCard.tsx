import { ReactNode } from "react";
import {
  formatAgo,
  formatEt,
  HEALTH_COLOR,
  HEALTH_LABEL,
  healthSeverity,
  isFailing,
  TaskHealth,
} from "./adminUtils";
import { Chip } from "../../ui/Chip";
import styles from "./TaskCard.module.css";

export type TaskRun = {
  label?: string;
  lastAt: string | null;
  lastSuccessAt: string | null;
};

export type Props = {
  name: string;
  health: TaskHealth;
  runs: TaskRun[];
  now: number;
  // Neutral note chip under the name, e.g. "Pauses during games".
  note?: string;
  // Freeform body for a task that doesn't fit the attempt/success shape.
  detail?: ReactNode;
  // The heartbeat is stale (or the page can't reach meta:admin), so this
  // card's health is out of date too: grey it out as "Unknown" rather than
  // keep showing a green "Fresh".
  dimmed?: boolean;
  // Anchor id, so the banner can link to a problem card.
  id?: string;
  // The newest active system event from this task's source, if any.
  event?: string;
  // Where that event's row is, e.g. "#admin-events".
  eventsHref?: string;
};

export default function TaskCard({
  name,
  health,
  runs,
  now,
  note,
  detail,
  dimmed = false,
  id,
  event,
  eventsHref,
}: Props) {
  // A problem card gets a colored edge so it stands out in a grid of healthy
  // ones; the chip alone was easy to miss.
  const severity = dimmed ? null : healthSeverity(health);
  return (
    <div
      id={id}
      className={[
        styles.card,
        dimmed && styles.dimmed,
        severity && styles[severity],
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div className={styles.header}>
        <h6 className={styles.name}>{name}</h6>
        <Chip
          label={dimmed ? "Unknown" : HEALTH_LABEL[health]}
          tone={dimmed ? "neutral" : HEALTH_COLOR[health]}
          variant={
            health === "idle" || health === "ok" || dimmed
              ? "outlined"
              : "filled"
          }
        />
      </div>
      {note && <Chip variant="outlined" label={note} className={styles.note} />}
      <div className={styles.body}>
        {runs.map((run) => {
          // Attempted more recently than it succeeded: lead with how long
          // it's been since it worked, then the failed try.
          const failing = isFailing(run.lastAt, run.lastSuccessAt);
          return (
            <div key={run.label ?? "run"}>
              {/* Wraps to two lines in a narrow card, one line on a phone. */}
              <div className={styles.run}>
                <p className={styles.text}>
                  {run.label && (
                    <span className={styles.muted}>{run.label}: </span>
                  )}
                  {failing ? "last success" : "ok"}{" "}
                  {formatAgo(run.lastSuccessAt, now)}
                </p>
                <span className={styles.caption}>
                  {formatEt(run.lastSuccessAt)}
                </span>
              </div>
              {failing && (
                <span className={styles.failed}>
                  last try {formatAgo(run.lastAt, now)}, failed
                </span>
              )}
            </div>
          );
        })}
        {detail}
        {event && <span className={styles.event}>{event}</span>}
        {event && eventsHref && (
          <a href={eventsHref} className={styles.link}>
            See System events
          </a>
        )}
      </div>
    </div>
  );
}
