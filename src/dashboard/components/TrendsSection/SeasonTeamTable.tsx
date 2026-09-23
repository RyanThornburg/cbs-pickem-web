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
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  Tooltip,
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
import { getTeamData } from "../../utils/teamAssets";
import TeamLogo from "./TeamLogo";

export type Props = {
  teamPickTotals: TeamPickTotal[];
  coldTeamsSeason: ColdTeamSeason[];
  teamAtsRecord: TeamAtsRecord[];
  teamBelieversFaders: TeamBelieversFaders[];
};

// One row per team, joined by team id across the three season datasets.
// "Picks" is the believers count -- believers.pick_count always equals
// team_pick_totals' total_picks (a believer is just anyone who picked the
// team), so there's no separate believers-count column. Accuracy/gap/cover
// fields are undefined (not 0) when there's nothing to grade, so they sort
// last instead of reading as a real 0%.
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

const accuracyColor = (n: number | undefined): string => {
  if (n === undefined) return "text.secondary";
  if (n >= 0.55) return "success.main";
  if (n <= 0.45) return "error.main";
  return "text.primary";
};

const columnHelper = createColumnHelper<SeasonTeamRow>();

const buildColumns = (maxPicks: number) => [
  columnHelper.accessor("abbr", {
    header: "Team",
    meta: { mobileHeader: "Team" },
    cell: ({ getValue }) => (
      <Stack direction="row" alignItems="center" spacing={1}>
        <TeamLogo abbr={getValue()} size={20} />
        <Typography variant="body2">{getValue()}</Typography>
      </Stack>
    ),
  }),
  columnHelper.accessor("picks", {
    header: "Picks",
    meta: { mobileHeader: "Pk", align: "center" },
    sortDescFirst: true,
    cell: ({ row }) => (
      <Box>
        <Typography variant="body2" sx={{ whiteSpace: "nowrap" }}>
          {row.original.picks}
          <Typography component="span" variant="caption" color="text.secondary">
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
            bgcolor: "action.hover",
            overflow: "hidden",
          }}
        >
          <Box
            sx={{
              width: `${maxPicks > 0 ? (row.original.picks / maxPicks) * 100 : 0}%`,
              height: "100%",
              bgcolor: `#${getTeamData(row.original.abbr).color}`,
            }}
          />
        </Box>
      </Box>
    ),
  }),
  columnHelper.accessor("pickAccuracy", {
    header: "Pick acc.",
    meta: { mobileHeader: "Pk%", align: "center" },
    sortDescFirst: true,
    sortUndefined: "last",
    cell: ({ getValue }) => (
      <Typography variant="body2" sx={{ color: accuracyColor(getValue()) }}>
        {pct(getValue())}
      </Typography>
    ),
  }),
  columnHelper.accessor("fades", {
    header: "Fades",
    meta: { mobileHeader: "Fd", align: "center" },
    sortDescFirst: true,
  }),
  columnHelper.accessor("fadeAccuracy", {
    header: "Fade acc.",
    meta: { mobileHeader: "Fd%", align: "center" },
    sortDescFirst: true,
    sortUndefined: "last",
    cell: ({ getValue }) => (
      <Typography variant="body2" sx={{ color: accuracyColor(getValue()) }}>
        {pct(getValue())}
      </Typography>
    ),
  }),
  columnHelper.accessor("gap", {
    header: () => (
      <Tooltip title="Pick accuracy minus fade accuracy, in percentage points. Positive = the people picking this team have been right more than the people fading it.">
        <span>Gap</span>
      </Tooltip>
    ),
    meta: { mobileHeader: "Gap", align: "center" },
    sortDescFirst: true,
    sortUndefined: "last",
    cell: ({ getValue }) => {
      const gap = getValue();
      if (gap === undefined) {
        return <Typography variant="body2" color="text.secondary">—</Typography>;
      }
      const pts = Math.round(gap * 100);
      return (
        <Typography
          variant="body2"
          sx={{
            color: pts > 0 ? "success.main" : pts < 0 ? "error.main" : "text.primary",
          }}
        >
          {pts > 0 ? `+${pts}` : pts} pts
        </Typography>
      );
    },
  }),
  columnHelper.accessor("coverPct", {
    header: "ATS",
    meta: { mobileHeader: "ATS", align: "center" },
    sortDescFirst: true,
    sortUndefined: "last",
    cell: ({ row, getValue }) => (
      <Typography variant="body2" sx={{ whiteSpace: "nowrap" }}>
        {row.original.covers}-{row.original.losses}
        {row.original.pushes > 0 ? `-${row.original.pushes}` : ""}
        <Typography
          component="span"
          variant="caption"
          sx={{ color: accuracyColor(getValue()) }}
        >
          {" "}
          · {pct(getValue())}
        </Typography>
      </Typography>
    ),
  }),
];

export default function SeasonTeamTable(props: Props) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const [sorting, setSorting] = useState<SortingState>([{ id: "picks", desc: true }]);

  const data = useMemo(
    () => buildRows(props),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [props.teamPickTotals, props.coldTeamsSeason, props.teamAtsRecord, props.teamBelieversFaders]
  );
  const maxPicks = useMemo(() => Math.max(0, ...data.map((r) => r.picks)), [data]);
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
    return <Typography color="text.secondary">No season pick data yet.</Typography>;
  }

  // Full height, no vertical scroll -- 32 rows is short enough to just let the
  // page scroll. Team column stays pinned while the rest scrolls sideways on
  // narrow screens.
  const stickySx = {
    position: "sticky",
    left: 0,
    zIndex: 1,
    bgcolor: "background.paper",
  } as const;

  return (
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
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableSortLabel>
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableHead>
        <TableBody>
          {table.getRowModel().rows.map((row) => (
            <TableRow key={row.id} hover>
              {row.getVisibleCells().map((cell, i) => (
                <TableCell
                  key={cell.id}
                  align={cell.column.columnDef.meta?.align ?? "left"}
                  sx={i === 0 ? stickySx : undefined}
                >
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
