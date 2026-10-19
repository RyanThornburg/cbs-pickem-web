import { Fragment } from "react";
import { flexRender } from "@tanstack/react-table";
import { UserGridWithTrendsProps } from "./types";
import { useUsersTable } from "./useUsersTable";
import { PaidLineRule } from "./PaidLineRule";
import { formatUpdated } from "../../utils/updatedTime";
import { paidLineNote } from "./MoneyLines";
import { BadgeKey } from "./BadgeKey";
import { SortLabel } from "../../ui/SortLabel";
import table from "../../ui/table.module.css";
import styles from "./UserDataGrid.module.css";

const cx = (...names: (string | false | undefined)[]) =>
  names.filter(Boolean).join(" ");

const UserDataGrid = ({
  userList,
  onOpenPlayer: openPlayer,
  userId,
  week,
  recap,
  showStreak,
  trends,
  moneyStandings,
  leaderboardStatus,
}: UserGridWithTrendsProps) => {
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
              {headerGroup.headers.map((header) => (
                <th
                  key={header.id}
                  scope="col"
                  className={cx(
                    table.cell,
                    table.small,
                    table.head,
                    styles.headCell,
                    header.column.columnDef.meta?.align === "center" &&
                      table.center
                  )}
                >
                  {header.column.getCanSort() ? (
                    <SortLabel
                      active={header.column.getIsSorted() !== false}
                      direction={header.column.getIsSorted() || "asc"}
                      onClick={header.column.getToggleSortingHandler()}
                    >
                      {flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                    </SortLabel>
                  ) : (
                    flexRender(
                      header.column.columnDef.header,
                      header.getContext()
                    )
                  )}
                  {header.column.id === "name" && <BadgeKey />}
                  {/* The last refresh, in the header row's spare room. The
                      phone table has none, so it shows nowhere there. */}
                  {header.column.id === "picks" &&
                    leaderboardStatus.updatedAt &&
                    !leaderboardStatus.failed && (
                      <span className={styles.updated}>
                        Updated {formatUpdated(leaderboardStatus.updatedAt)}
                      </span>
                    )}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {usersTable.getRowModel().rows.map((row, rowIndex) => {
            const isSelected = row.id === userId;

            return (
              <Fragment key={row.id}>
                <tr
                  data-user-row={row.id}
                  onClick={() => openPlayer(row.id)}
                  className={cx(styles.row, isSelected && styles.selected)}
                >
                  {row.getVisibleCells().map((cell) => (
                    <td
                      key={cell.id}
                      className={cx(
                        table.cell,
                        table.small,
                        cell.column.columnDef.meta?.align === "center" &&
                          table.center
                      )}
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </td>
                  ))}
                </tr>
                {paidLinesAfter(rowIndex).map((line) => (
                  <tr key={line.label}>
                    <td
                      colSpan={row.getVisibleCells().length}
                      className={cx(table.cell, table.small, styles.lineCell)}
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
};

export default UserDataGrid;
