import { ReactNode } from "react";
import { Chip } from "../../ui/Chip";
import table from "../../ui/table.module.css";
import { DOWN_SM, useMediaQuery } from "../../ui/useMediaQuery";
import { formatAgo, formatEt } from "./adminUtils";
import styles from "./EventsCard.module.css";

const cx = (...names: (string | false | undefined)[]) =>
  names.filter(Boolean).join(" ");

export type Column<T> = {
  header: string;
  render: (row: T) => ReactNode;
  align?: "right";
  // Long freeform text (an event message). Takes the leftover width in the
  // table, and gets a full-width line of its own on phones.
  wide?: boolean;
};

export type Props<T> = {
  title: string;
  description: string;
  distinctCount: number;
  totalOccurrences: number;
  // Shown as a red "N active" chip in the header when above 0.
  activeCount?: number;
  rows: T[];
  columns: Column<T>[];
  rowKey: (row: T) => string;
  emptyText: string;
  // Anchor id, so the banner and task cards can link here.
  id?: string;
};

export function LastSeenCell({
  iso,
  now,
  active = false,
}: {
  iso: string;
  now: number;
  active?: boolean;
}) {
  return (
    <div className={styles.lastSeen}>
      <p className={`${styles.text} ${styles.noWrap}`}>{formatAgo(iso, now)}</p>
      <span className={`${styles.caption} ${styles.noWrap}`}>
        {formatEt(iso)}
      </span>
      {active && <Chip tone="error" label="Active" />}
    </div>
  );
}

// Phone layout: the short columns side by side with their headers as small
// labels, then the wide column on its own line underneath.
function CompactRows<T>({
  rows,
  columns,
  rowKey,
}: Pick<Props<T>, "rows" | "columns" | "rowKey">) {
  const short = columns.filter((column) => !column.wide);
  const wide = columns.filter((column) => column.wide);
  return (
    <div className={styles.compactRows}>
      {rows.map((row) => (
        <div key={rowKey(row)} className={styles.compactRow}>
          {/* One line: the short columns shrink (and wrap inside) before
              anything drops to a second row. */}
          <div
            className={styles.shortColumns}
            style={{
              gridTemplateColumns: short
                .map((column) =>
                  column.align === "right" ? "auto" : "minmax(0, auto)"
                )
                .join(" "),
            }}
          >
            {short.map((column) => (
              <div
                key={column.header}
                className={styles.shortColumn}
                style={{ textAlign: column.align }}
              >
                <span className={styles.label}>{column.header}</span>
                {column.render(row)}
              </div>
            ))}
          </div>
          {wide.map((column) => (
            <div key={column.header} className={styles.wideColumn}>
              {column.render(row)}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

export default function EventsCard<T>({
  title,
  description,
  distinctCount,
  totalOccurrences,
  activeCount,
  rows,
  columns,
  rowKey,
  emptyText,
  id,
}: Props<T>) {
  // Four columns don't fit a phone: the message got squeezed and pushed
  // Last seen and Count off screen.
  const compact = useMediaQuery(DOWN_SM);
  return (
    <div id={id} className={styles.card}>
      <div className={styles.header}>
        <h3 className={styles.title}>{title}</h3>
        <div className={styles.counts}>
          {activeCount !== undefined && activeCount > 0 && (
            <Chip tone="error" label={`${activeCount} active`} />
          )}
          <p className={`${styles.countsText} ${styles.noWrap}`}>
            {distinctCount} distinct · {totalOccurrences} total
          </p>
        </div>
      </div>
      <span className={styles.caption}>{description}</span>

      {rows.length === 0 ? (
        <p className={styles.empty}>{emptyText}</p>
      ) : compact ? (
        <CompactRows rows={rows} columns={columns} rowKey={rowKey} />
      ) : (
        <table className={cx(table.table, styles.table)}>
          <thead>
            <tr>
              {columns.map((column) => (
                <th
                  key={column.header}
                  scope="col"
                  className={cx(
                    table.cell,
                    table.small,
                    table.head,
                    column.align === "right" && table.right,
                    !column.wide && styles.narrow
                  )}
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={rowKey(row)}>
                {columns.map((column) => (
                  <td
                    key={column.header}
                    className={cx(
                      table.cell,
                      table.small,
                      styles.bodyCell,
                      column.align === "right" && table.right,
                      !column.wide && styles.narrow
                    )}
                  >
                    {column.render(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
