import { MouseEventHandler, ReactNode } from "react";
import { Icon } from "./Icon";
import styles from "./SortLabel.module.css";

// A sortable column's header (MUI's TableSortLabel): the label as a
// button with the arrow after it. `active` when the table is sorted on
// this column; `direction` which way. The th carries aria-sort.
export function SortLabel({
  active,
  direction,
  onClick,
  hideInactiveIcon = false,
  className,
  children,
}: {
  active: boolean;
  direction: "asc" | "desc";
  onClick?: MouseEventHandler<HTMLButtonElement>;
  // Drop the inactive arrow's space entirely, as MUI's hideSortIcon did.
  hideInactiveIcon?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        styles.label,
        active && styles.active,
        direction === "asc" && styles.asc,
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
      {(active || !hideInactiveIcon) && (
        <Icon name="ArrowDownward" size="inherit" className={styles.icon} />
      )}
    </button>
  );
}
