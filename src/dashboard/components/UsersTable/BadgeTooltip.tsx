import { ReactNode } from "react";
import { Tooltip } from "../../ui/Tooltip";
import styles from "./BadgeTooltip.module.css";

// The small marks next to names and in the Week column. Each explains
// itself on hover, on keyboard focus, or on a tap (no long-press), and is
// announced by its full meaning. A tap doesn't also open the row.
// `plain` draws the mark alone, with no tooltip or focus stop, for the
// badge key.
export function BadgeTooltip({
  title,
  plain = false,
  children,
}: {
  title: string;
  plain?: boolean;
  children: ReactNode;
}) {
  if (plain) {
    return (
      <span aria-hidden className={styles.plain}>
        {children}
      </span>
    );
  }
  return (
    <Tooltip title={title} stopPropagation>
      <span
        role="img"
        tabIndex={0}
        aria-label={title}
        className={styles.trigger}
      >
        {children}
      </span>
    </Tooltip>
  );
}
