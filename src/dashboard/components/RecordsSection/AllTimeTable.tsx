import { useMemo, useState } from "react";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  SortingState,
  Table as TanstackTable,
  useReactTable,
} from "@tanstack/react-table";
import { ordinal } from "../../helper";
import {
  allTimePlaces,
  AVG_SORT_MIN_SEASONS,
  byAllTimeRank,
  CareerRow,
} from "./recordsUtils";
import { Icon } from "../../ui/Icon";
import { SortLabel } from "../../ui/SortLabel";
import table from "../../ui/table.module.css";
import { DOWN_SM, useMediaQuery } from "../../ui/useMediaQuery";
import shared from "./recordsTable.module.css";
import styles from "./AllTimeTable.module.css";

const cx = (...names: (string | false | undefined)[]) =>
  names.filter(Boolean).join(" ");

const dash = <p className={styles.dash}>–</p>;
const oneDecimal = (n: number | undefined) =>
  n === undefined ? dash : n.toFixed(1);

// Averages over fewer than AVG_SORT_MIN_SEASONS sort as missing (last, either
// direction) and show muted, though the value is still there.
const sortableAvg = (row: CareerRow, n: number | undefined) =>
  row.seasons >= AVG_SORT_MIN_SEASONS ? n : undefined;
const avgCell = (row: CareerRow, n: number | undefined) =>
  n !== undefined && row.seasons < AVG_SORT_MIN_SEASONS ? (
    <span className={styles.muted}>{n.toFixed(1)}</span>
  ) : (
    oneDecimal(n)
  );

const columnHelper = createColumnHelper<CareerRow>();

const columns = [
  columnHelper.accessor("name", {
    header: "Player",
    meta: { mobileHeader: "Player" },
    sortingFn: (a, b) =>
      a.original.name.localeCompare(b.original.name, undefined, {
        sensitivity: "base",
      }),
    cell: ({ getValue, row }) => (
      <span className={styles.name}>
        {getValue()}
        {!row.original.active && <span className={styles.former}>former</span>}
      </span>
    ),
  }),
  columnHelper.accessor("points", {
    header: "Career pts",
    meta: { mobileHeader: "Career", align: "center" },
    sortDescFirst: true,
    cell: ({ getValue }) => <p className={styles.points}>{getValue()}</p>,
  }),
  columnHelper.accessor("titles", {
    header: "Titles",
    meta: { mobileHeader: "Titles", align: "center" },
    sortDescFirst: true,
    cell: ({ getValue }) =>
      getValue() > 0 ? (
        <div className={styles.titles}>
          {getValue()}
          <div className={styles.trophies}>
            {Array.from({ length: getValue() }, (_, i) => (
              <Icon key={i} name="EmojiEvents" className={styles.trophy} />
            ))}
          </div>
        </div>
      ) : (
        dash
      ),
  }),
  columnHelper.accessor("top3", {
    header: "Top 3",
    meta: { mobileHeader: "T3", align: "center" },
    sortDescFirst: true,
    cell: ({ getValue }) => getValue() || dash,
  }),
  columnHelper.accessor("top5", {
    header: "Top 5",
    meta: { mobileHeader: "T5", align: "center" },
    sortDescFirst: true,
    cell: ({ getValue }) => getValue() || dash,
  }),
  columnHelper.accessor("best", {
    header: "Best",
    meta: { mobileHeader: "Best", align: "center" },
    sortDescFirst: false,
    sortUndefined: "last",
    cell: ({ getValue }) => {
      const best = getValue();
      return best === undefined ? dash : ordinal(best);
    },
  }),
  columnHelper.accessor((row) => sortableAvg(row, row.avgFinish), {
    id: "avgFinish",
    header: "Avg finish",
    meta: { mobileHeader: "Avg fin", align: "center" },
    sortDescFirst: false,
    sortUndefined: "last",
    cell: ({ row }) => avgCell(row.original, row.original.avgFinish),
  }),
  columnHelper.accessor((row) => sortableAvg(row, row.avgScore), {
    id: "avgScore",
    header: "Avg score",
    meta: { mobileHeader: "Avg pts", align: "center" },
    sortDescFirst: true,
    sortUndefined: "last",
    cell: ({ row }) => avgCell(row.original, row.original.avgScore),
  }),
  columnHelper.accessor("seasons", {
    header: "Seasons",
    meta: { mobileHeader: "Yrs", align: "center" },
    sortDescFirst: true,
  }),
];

// Lives in RecordsSection so the finishes grid can follow this table's sort.
export const useAllTimeTable = (rows: CareerRow[]) => {
  const [sorting, setSorting] = useState<SortingState>([]);
  const data = useMemo(() => [...rows].sort(byAllTimeRank), [rows]);
  return useReactTable({
    data,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getRowId: (row) => String(row.id),
  });
};

type Props = {
  table: TanstackTable<CareerRow>;
  userId: string;
};

export default function AllTimeTable({ table: reactTable, userId }: Props) {
  const isMobile = useMediaQuery(DOWN_SM);
  // Place is fixed by the all-time rule, whatever column the table is
  // sorted by.
  const rows = reactTable.options.data;
  const places = useMemo(() => allTimePlaces(rows), [rows]);
  const alignClass = (align: "left" | "center" | undefined) =>
    align === "center" && table.center;

  return (
    <>
      <p className={styles.rule}>
        Career pts: 10 for a title, down to 1 for 10th, every season. Ties go to
        titles, then avg finish. Averages sort players with{" "}
        {AVG_SORT_MIN_SEASONS}+ seasons first.
      </p>
      <div className={table.container}>
        {/* Sized to its columns rather than the page, so a row stays easy to
            follow across on wide screens. */}
        <table
          aria-label="All-time standings"
          className={cx(table.table, styles.table, shared.tabular)}
        >
          <thead>
            {reactTable.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                <th
                  scope="col"
                  className={cx(
                    table.cell,
                    table.small,
                    table.head,
                    table.center,
                    shared.headCell,
                    styles.placeHead
                  )}
                >
                  Place
                </th>
                {headerGroup.headers.map((header, i) => (
                  <th
                    key={header.id}
                    scope="col"
                    aria-sort={
                      header.column.getIsSorted() === "asc"
                        ? "ascending"
                        : header.column.getIsSorted() === "desc"
                          ? "descending"
                          : undefined
                    }
                    className={cx(
                      table.cell,
                      table.small,
                      table.head,
                      alignClass(header.column.columnDef.meta?.align),
                      shared.headCell,
                      shared.nowrap,
                      i === 0 && shared.sticky,
                      i === 0 && shared.stickyHead
                    )}
                  >
                    <SortLabel
                      active={header.column.getIsSorted() !== false}
                      direction={header.column.getIsSorted() || "desc"}
                      onClick={header.column.getToggleSortingHandler()}
                      className={styles.sortLabel}
                    >
                      {isMobile
                        ? header.column.columnDef.meta?.mobileHeader
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </SortLabel>
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {reactTable.getRowModel().rows.map((row) => {
              const isYou = row.id === userId;
              const place = places.get(row.original.id);
              return (
                <tr key={row.id} className={cx(table.hover, shared.rowHover)}>
                  <td
                    className={cx(
                      table.cell,
                      table.small,
                      table.center,
                      styles.place,
                      isYou && shared.you,
                      isYou && shared.youEdge
                    )}
                  >
                    {place && `${place.tied ? "T" : ""}${place.place}`}
                  </td>
                  {row.getVisibleCells().map((cell, i) => {
                    const Cell = i === 0 ? "th" : "td";
                    return (
                      <Cell
                        key={cell.id}
                        scope={i === 0 ? "row" : undefined}
                        className={cx(
                          table.cell,
                          table.small,
                          alignClass(cell.column.columnDef.meta?.align),
                          i === 0 && shared.sticky,
                          isYou && shared.you
                        )}
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </Cell>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
