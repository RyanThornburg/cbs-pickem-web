import { Fragment } from "react";
import { flexRender } from "@tanstack/react-table";
import { UserGridWithTrendsProps } from "./types";
import { useUsersTable } from "./useUsersTable";
import { PaidLineRule } from "./PaidLineRule";
import { paidLineNote } from "./MoneyLines";
import { BadgeKey } from "./BadgeKey";
import { SortLabel } from "../../ui/SortLabel";
import table from "../../ui/table.module.css";
import styles from "./UserDataMobile.module.css";

const cx = (...names: (string | false | undefined)[]) =>
  names.filter(Boolean).join(" ");

export default function UserDataMobile({
  userList,
  onOpenPlayer: openPlayer,
  userId,
  week,
  recap,
  showStreak,
  trends,
  moneyStandings,
}: UserGridWithTrendsProps) {
  const { table: usersTable, paidLinesAfter } = useUsersTable({
    userList,
    trends,
    week,
    recap,
    showStreak,
  });

  return (
    <div className={table.container}>
      <table className={table.table} aria-label="Standings and picks">
        <thead>
          {usersTable.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers
                .filter((header) => header.column.id !== "picks")
                .map((header) => (
                  <th
                    key={header.id}
                    scope="col"
                    className={cx(
                      table.cell,
                      table.small,
                      table.head,
                      styles.cell,
                      styles.headCell,
                      header.column.columnDef.meta?.align === "center" &&
                        table.center
                    )}
                  >
                    {header.column.getCanSort() ? (
                      <SortLabel
                        // An inactive arrow still takes ~22px per column,
                        // which the name needs at 360px (six columns from
                        // the 2nd half on).
                        hideInactiveIcon
                        active={header.column.getIsSorted() !== false}
                        direction={header.column.getIsSorted() || "asc"}
                        onClick={header.column.getToggleSortingHandler()}
                        className={styles.sortLabel}
                      >
                        {header.column.columnDef.meta?.mobileHeader ??
                          flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                      </SortLabel>
                    ) : (
                      (header.column.columnDef.meta?.mobileHeader ??
                      flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      ))
                    )}
                    {header.column.id === "name" && <BadgeKey />}
                  </th>
                ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {usersTable.getRowModel().rows.map((row, rowIndex) => {
            const cells = row.getVisibleCells();
            const picksCell = cells.find((cell) => cell.column.id === "picks");
            const mainCells = cells.filter(
              (cell) => cell.column.id !== "picks"
            );
            const isSelected = row.id === userId;

            return (
              <Fragment key={row.id}>
                <tr
                  data-user-row={row.id}
                  onClick={() => openPlayer(row.id)}
                  className={cx(
                    styles.row,
                    styles.firstRow,
                    isSelected && styles.selected
                  )}
                >
                  {mainCells.map((cell) => (
                    <td
                      key={cell.id}
                      className={cx(
                        table.cell,
                        table.small,
                        styles.cell,
                        cell.column.columnDef.meta?.align === "center" &&
                          table.center,
                        // The name takes whatever the number columns leave,
                        // so it truncates only when it really can't fit.
                        cell.column.id === "name"
                          ? styles.nameCell
                          : styles.numberCell
                      )}
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </td>
                  ))}
                </tr>
                {picksCell && (
                  <tr
                    onClick={() => openPlayer(row.id)}
                    className={cx(styles.row, isSelected && styles.selected)}
                  >
                    <td
                      colSpan={mainCells.length}
                      className={cx(
                        table.cell,
                        table.small,
                        styles.cell,
                        styles.picksCell
                      )}
                    >
                      {flexRender(
                        picksCell.column.columnDef.cell,
                        picksCell.getContext()
                      )}
                    </td>
                  </tr>
                )}
                {paidLinesAfter(rowIndex).map((line) => (
                  <tr key={line.label}>
                    <td
                      colSpan={mainCells.length}
                      className={cx(
                        table.cell,
                        table.small,
                        styles.cell,
                        styles.lineCell
                      )}
                    >
                      <PaidLineRule
                        label={line.label}
                        note={paidLineNote(moneyStandings, line.key)}
                      />
                    </td>
                  </tr>
                ))}
              </Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
