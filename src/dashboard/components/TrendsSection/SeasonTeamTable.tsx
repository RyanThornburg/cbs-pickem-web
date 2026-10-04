import { useMemo, useState } from "react";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
} from "@tanstack/react-table";
import {
  Box,
  Button,
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
import {
  ColdTeamSeason,
  TeamAtsRecord,
  TeamBelieversFaders,
  TeamPickTotal,
} from "../../types";
import { TeamLink } from "../shared/TeamLink";
import { TeamLogo } from "../shared/TeamLogo";
import { pool } from "../../shared-theme/themePrimitives";

export type Props = {
  teamPickTotals: TeamPickTotal[];
  coldTeamsSeason: ColdTeamSeason[];
  teamAtsRecord: TeamAtsRecord[];
  teamBelieversFaders: TeamBelieversFaders[];
};

// One row per team, joined by team id across the season datasets. "Picks"
// is the believers count -- believers.pick_count always equals
// team_pick_totals' total_picks (a believer is just anyone who picked the
// team). Fades, fade accuracy and the pick-vs-fade gap are still built (the
// data has them) but no longer shown: four plain columns read right on the
// first try, and the gap was noise on a few games. Accuracy/cover fields are
// undefined (not 0) when there's nothing to grade, so they sort last instead
// of reading as a real 0%.
interface SeasonTeamRow {
  id: number;
  abbr: string;
  picks: number;
  pctOfAllPicks: number;
  pickAccuracy: number | undefined;
  fades: number;
  fadeAccuracy: number | undefined;
  gap: number | undefined;
  covers: number;
  losses: number;
  pushes: number;
  coverPct: number | undefined;
}

const buildRows = ({
  teamPickTotals,
  coldTeamsSeason,
  teamAtsRecord,
  teamBelieversFaders,
}: Props): SeasonTeamRow[] => {
  // Union of every team id seen in any dataset, so a team missing from one
  // list (e.g. a never-picked team that only shows up in cold_teams_season)
  // still gets a row.
  const abbrById = new Map<number, string>();
  [teamPickTotals, coldTeamsSeason, teamAtsRecord, teamBelieversFaders].forEach(
    (list) => list.forEach((team) => abbrById.set(team.id, team.abbr))
  );
  const picksById = new Map(teamPickTotals.map((t) => [t.id, t]));
  const atsById = new Map(teamAtsRecord.map((t) => [t.id, t]));
  const bfById = new Map(teamBelieversFaders.map((t) => [t.id, t]));

  return Array.from(abbrById, ([id, abbr]) => {
    const picks = picksById.get(id);
    const ats = atsById.get(id);
    const bf = bfById.get(id);
    const pickCount = picks?.total_picks ?? bf?.believers.pick_count ?? 0;
    const fades = bf?.faders.pick_count ?? 0;
    const pickAccuracy = pickCount > 0 ? bf?.believers.accuracy : undefined;
    const fadeAccuracy = fades > 0 ? bf?.faders.accuracy : undefined;
    const graded = (ats?.covers ?? 0) + (ats?.losses ?? 0) + (ats?.pushes ?? 0);

    return {
      id,
      abbr,
      picks: pickCount,
      pctOfAllPicks: picks?.pct_of_all_picks ?? 0,
      pickAccuracy,
      fades,
      fadeAccuracy,
      gap:
        pickAccuracy !== undefined && fadeAccuracy !== undefined
          ? pickAccuracy - fadeAccuracy
          : undefined,
      covers: ats?.covers ?? 0,
      losses: ats?.losses ?? 0,
      pushes: ats?.pushes ?? 0,
      coverPct: graded > 0 ? ats?.cover_pct : undefined,
    };
  });
};

const pct = (n: number | undefined): string =>
  n === undefined ? "—" : `${Math.round(n * 100)}%`;

const columnHelper = createColumnHelper<SeasonTeamRow>();

// No red/green in this table: a team's numbers aren't the reader's win or
// loss, and 32 rows of colored cells drowned the one you were looking for.
const buildColumns = (maxPicks: number) => [
  columnHelper.accessor("abbr", {
    header: "Team",
    meta: { mobileHeader: "Team" },
    cell: ({ getValue }) => (
      <TeamLink abbr={getValue()} sx={{ gap: 1 }}>
        <TeamLogo abbr={getValue()} size={20} decorative />
        <Typography variant="body2">{getValue()}</Typography>
      </TeamLink>
    ),
  }),
  columnHelper.accessor("picks", {
    header: "Times picked",
    meta: { mobileHeader: "Picked", align: "center" },
    sortDescFirst: true,
    cell: ({ row }) => (
      <Box>
        <Typography variant="body2" sx={{ whiteSpace: "nowrap" }}>
          {row.original.picks}
          <Typography
            component="span"
            variant="caption"
            // The share of all picks only fits from sm up; phones keep the
            // count so all four columns fit at 360px.
            sx={{
              color: "text.secondary",
              display: { xs: "none", sm: "inline" },
            }}
          >
            {" "}
            · {pct(row.original.pctOfAllPicks)}
          </Typography>
        </Typography>
        <Box
          sx={{
            display: { xs: "none", sm: "block" },
            height: 4,
            mt: 0.25,
            borderRadius: 2,
            bgcolor: pool[100],
            overflow: "hidden",
          }}
        >
          <Box
            sx={{
              width: `${maxPicks > 0 ? (row.original.picks / maxPicks) * 100 : 0}%`,
              height: "100%",
              // The pool's color: this counts the pool's picks. A team color
              // would read as that team, and red/green are pick results.
              bgcolor: pool[500],
            }}
          />
        </Box>
      </Box>
    ),
  }),
  columnHelper.accessor("pickAccuracy", {
    header: "Picks right",
    meta: { mobileHeader: "Right", align: "center" },
    sortDescFirst: true,
    sortUndefined: "last",
    cell: ({ getValue }) => (
      <Typography variant="body2" sx={{ fontVariantNumeric: "tabular-nums" }}>
        {pct(getValue())}
      </Typography>
    ),
  }),
  columnHelper.accessor("coverPct", {
    header: "Team covered",
    meta: { mobileHeader: "Covered", align: "center" },
    sortDescFirst: true,
    sortUndefined: "last",
    cell: ({ row }) => {
      const { covers, losses, pushes } = row.original;
      const games = covers + losses + pushes;
      return (
        <Typography
          variant="body2"
          sx={{ whiteSpace: "nowrap", fontVariantNumeric: "tabular-nums" }}
        >
          {games ? `${covers} of ${games}` : "—"}
        </Typography>
      );
    },
  }),
];

// The top of the current sort; the rest is one tap away.
const INITIAL_ROWS = 10;

export default function SeasonTeamTable(props: Props) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const [showAll, setShowAll] = useState(false);
  const [sorting, setSorting] = useState<SortingState>([
    { id: "picks", desc: true },
  ]);

  const data = useMemo(
    () => buildRows(props),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      props.teamPickTotals,
      props.coldTeamsSeason,
      props.teamAtsRecord,
      props.teamBelieversFaders,
    ]
  );
  const maxPicks = useMemo(
    () => Math.max(0, ...data.map((r) => r.picks)),
    [data]
  );
  const columns = useMemo(() => buildColumns(maxPicks), [maxPicks]);

  const table = useReactTable({
    data,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getRowId: (row) => String(row.id),
  });

  if (data.length === 0) {
    return (
      <Typography variant="body2" sx={{ color: "text.secondary" }}>
        No picks graded yet this season.
      </Typography>
    );
  }

  // Team column stays pinned if the table ever scrolls sideways. Its solid
  // background hides cells scrolling under it, so the row hover tint is
  // painted on top of it as a gradient.
  const stickySx = {
    position: "sticky",
    left: 0,
    zIndex: 1,
    bgcolor: "background.paper",
  } as const;
  const rows = table.getRowModel().rows;
  const visibleRows = showAll ? rows : rows.slice(0, INITIAL_ROWS);

  return (
    <Box>
      <TableContainer>
        <Table size="small">
          <TableHead>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header, i) => (
                  <TableCell
                    key={header.id}
                    align={header.column.columnDef.meta?.align ?? "left"}
                    sx={{
                      fontSize: "0.75rem",
                      fontWeight: 700,
                      whiteSpace: "nowrap",
                      py: 0,
                      px: { xs: 1, sm: 2 },
                      height: 44,
                      ...(i === 0 ? { ...stickySx, zIndex: 3 } : {}),
                    }}
                  >
                    <TableSortLabel
                      active={header.column.getIsSorted() !== false}
                      direction={header.column.getIsSorted() || "desc"}
                      onClick={header.column.getToggleSortingHandler()}
                      sx={{ minHeight: 44 }}
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
            {visibleRows.map((row) => (
              <TableRow
                key={row.id}
                hover
                sx={{
                  "&:hover > td:first-of-type": {
                    backgroundImage:
                      "linear-gradient(rgba(0, 0, 0, 0.04), rgba(0, 0, 0, 0.04))",
                  },
                }}
              >
                {row.getVisibleCells().map((cell, i) => (
                  <TableCell
                    key={cell.id}
                    align={cell.column.columnDef.meta?.align ?? "left"}
                    sx={{ px: { xs: 1, sm: 2 }, ...(i === 0 ? stickySx : {}) }}
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      {rows.length > INITIAL_ROWS && (
        <Button
          size="small"
          onClick={() => setShowAll((s) => !s)}
          aria-expanded={showAll}
          sx={{ mt: 0.5, minHeight: 44 }}
        >
          {showAll ? "Show top 10" : `Show all ${rows.length} teams`}
        </Button>
      )}
    </Box>
  );
}
