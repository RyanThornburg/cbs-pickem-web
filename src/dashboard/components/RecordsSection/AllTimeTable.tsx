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
import { allTimePlaces, byAllTimeRank, CareerRow } from "./recordsUtils";
import { GOLD, rowHoverSx, youRowSx } from "./recordsTheme";

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
    cell: ({ getValue, row }) => (
      <Typography
        variant="body2"
        component="span"
        sx={{ fontWeight: 500, whiteSpace: "nowrap" }}
      >
        {getValue()}
        {!row.original.active && (
          <Box
            component="span"
            sx={{
              color: "text.secondary",
              fontWeight: 400,
              fontSize: "0.75rem",
              ml: 0.5,
            }}
          >
            former
          </Box>
        )}
      </Typography>
    ),
  }),
  columnHelper.accessor("points", {
    header: "Points",
    meta: { mobileHeader: "Pts", align: "center" },
    sortDescFirst: true,
    cell: ({ getValue }) => (
      <Typography variant="body2" sx={{ fontWeight: 700 }}>
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
    meta: { mobileHeader: "Avg fin", align: "center" },
    sortDescFirst: false,
    sortUndefined: "last",
    cell: ({ getValue }) => oneDecimal(getValue()),
  }),
  columnHelper.accessor("avgScore", {
    header: "Avg score",
    meta: { mobileHeader: "Avg pts", align: "center" },
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
  // Place is fixed by the all-time rule, whatever column the table is
  // sorted by.
  const rows = table.options.data;
  const places = useMemo(() => allTimePlaces(rows), [rows]);

  return (
    <>
      <Typography
        variant="body2"
        sx={{ color: "text.secondary", fontSize: "0.8125rem", mb: 1 }}
      >
        Ranked by points: 10 for a title, 9 for 2nd, down to 1 for 10th, added
        up over every season. Ties go to more titles, then the better average
        finish. Averages count every season a player has on record. Tap a column
        heading to sort.
      </Typography>
      <TableContainer>
        <Table
          size="small"
          aria-label="All-time standings"
          sx={{ "& td, & th": { fontVariantNumeric: "tabular-nums" } }}
        >
          <TableHead>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                <TableCell
                  align="center"
                  sx={{ fontSize: "0.75rem", fontWeight: "bold", width: 48 }}
                >
                  Place
                </TableCell>
                {headerGroup.headers.map((header, i) => (
                  <TableCell
                    key={header.id}
                    aria-sort={
                      header.column.getIsSorted() === "asc"
                        ? "ascending"
                        : header.column.getIsSorted() === "desc"
                          ? "descending"
                          : undefined
                    }
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
              const place = places.get(row.original.id);
              return (
                <TableRow key={row.id} hover sx={rowHoverSx}>
                  <TableCell
                    align="center"
                    sx={{
                      fontWeight: 700,
                      ...(isYou && {
                        ...youRowSx,
                        boxShadow: `inset 3px 0 0 ${theme.palette.primary.main}`,
                      }),
                    }}
                  >
                    {place && `${place.tied ? "T" : ""}${place.place}`}
                  </TableCell>
                  {row.getVisibleCells().map((cell, i) => (
                    <TableCell
                      key={cell.id}
                      component={i === 0 ? "th" : "td"}
                      scope={i === 0 ? "row" : undefined}
                      align={cell.column.columnDef.meta?.align ?? "left"}
                      sx={{
                        ...(i === 0 ? stickySx : {}),
                        ...(isYou ? youRowSx : {}),
                      }}
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </>
  );
}
