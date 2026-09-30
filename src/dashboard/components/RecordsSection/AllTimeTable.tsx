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
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { ordinal } from "../../helper";
import { CareerRow } from "./recordsUtils";
import { GOLD, youRowSx } from "./recordsTheme";

const dash = (
  <Typography
    variant="body2"
    sx={{
      color: "text.secondary",
    }}
  >
    –
  </Typography>
);
const oneDecimal = (n: number | undefined) =>
  n === undefined ? dash : n.toFixed(1);

const columnHelper = createColumnHelper<CareerRow>();

const columns = [
  columnHelper.accessor("name", {
    header: "Player",
    meta: { mobileHeader: "Player" },
    sortingFn: (a, b) =>
      a.original.name.localeCompare(b.original.name, undefined, {
        sensitivity: "base",
      }),
    cell: ({ getValue }) => (
      <Typography
        variant="body2"
        sx={{ fontWeight: 500, whiteSpace: "nowrap" }}
      >
        {getValue()}
      </Typography>
    ),
  }),
  columnHelper.accessor("titles", {
    header: "Titles",
    meta: { mobileHeader: "Titles", align: "center" },
    sortDescFirst: true,
    cell: ({ getValue }) =>
      getValue() > 0 ? (
        <Box sx={{ display: "inline-flex", alignItems: "center", gap: 0.5 }}>
          {getValue()}
          <Box sx={{ display: "inline-flex" }}>
            {Array.from({ length: getValue() }, (_, i) => (
              <EmojiEventsIcon
                key={i}
                sx={{ fontSize: "0.9rem" }}
                htmlColor={GOLD}
              />
            ))}
          </Box>
        </Box>
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
  columnHelper.accessor("avgFinish", {
    header: "Avg finish",
    meta: { mobileHeader: "Avg", align: "center" },
    sortDescFirst: false,
    sortUndefined: "last",
    cell: ({ getValue }) => oneDecimal(getValue()),
  }),
  columnHelper.accessor("avgScore", {
    header: "Avg score",
    meta: { mobileHeader: "Pts", align: "center" },
    sortDescFirst: true,
    sortUndefined: "last",
    cell: ({ getValue }) => oneDecimal(getValue()),
  }),
  columnHelper.accessor("seasons", {
    header: "Seasons",
    meta: { mobileHeader: "Yrs", align: "center" },
    sortDescFirst: true,
  }),
];

// The default order doubles as every column's tiebreak: TanStack's sort is
// stable, so rows that tie on the clicked column keep this order.
const byAllTimeRank = (a: CareerRow, b: CareerRow) =>
  b.titles - a.titles ||
  b.top3 - a.top3 ||
  b.top5 - a.top5 ||
  (a.avgFinish ?? Infinity) - (b.avgFinish ?? Infinity);

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

const stickySx = {
  position: "sticky",
  left: 0,
  zIndex: 1,
  bgcolor: "background.paper",
} as const;

type Props = {
  table: TanstackTable<CareerRow>;
  userId: string;
};

export default function AllTimeTable({ table, userId }: Props) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  return (
    <TableContainer>
      <Table
        size="small"
        sx={{ "& td, & th": { fontVariantNumeric: "tabular-nums" } }}
      >
        <TableHead>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header, i) => (
                <TableCell
                  key={header.id}
                  align={header.column.columnDef.meta?.align ?? "left"}
                  sx={{
                    fontSize: "0.75rem",
                    fontWeight: "bold",
                    whiteSpace: "nowrap",
                    ...(i === 0 ? { ...stickySx, zIndex: 3 } : {}),
                  }}
                >
                  <TableSortLabel
                    active={header.column.getIsSorted() !== false}
                    direction={header.column.getIsSorted() || "desc"}
                    onClick={header.column.getToggleSortingHandler()}
                  >
                    {isMobile
                      ? header.column.columnDef.meta?.mobileHeader
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableSortLabel>
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableHead>
        <TableBody>
          {table.getRowModel().rows.map((row) => {
            const isYou = row.id === userId;
            return (
              <TableRow key={row.id} hover>
                {row.getVisibleCells().map((cell, i) => (
                  <TableCell
                    key={cell.id}
                    align={cell.column.columnDef.meta?.align ?? "left"}
                    sx={{
                      ...(i === 0 ? stickySx : {}),
                      ...(isYou ? youRowSx : {}),
                      ...(isYou && i === 0
                        ? {
                            boxShadow: `inset 3px 0 0 ${theme.palette.primary.main}`,
                          }
                        : {}),
                    }}
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
