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
  ColdTeamSeason,
  TeamAtsRecord,
  TeamBelieversFaders,
  TeamPickTotal,
} from "../../types";
import { TeamLink } from "../shared/TeamLink";
import { TeamLogo } from "../shared/TeamLogo";
import { Button } from "../../ui/Button";
import { SortLabel } from "../../ui/SortLabel";
import table from "../../ui/table.module.css";
import { DOWN_SM, useMediaQuery } from "../../ui/useMediaQuery";
import styles from "./SeasonTeamTable.module.css";

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
      <TeamLink abbr={getValue()} className={styles.teamLink}>
        <TeamLogo abbr={getValue()} size={20} decorative />
        <p className={styles.text}>{getValue()}</p>
      </TeamLink>
    ),
  }),
  columnHelper.accessor("picks", {
    header: "Times picked",
    meta: { mobileHeader: "Picked", align: "center" },
    sortDescFirst: true,
    cell: ({ row }) => (
      <div>
        <p className={styles.picks}>
          {row.original.picks}
          <span className={styles.share}>
            {" "}
            · {pct(row.original.pctOfAllPicks)}
          </span>
        </p>
        <div className={styles.track}>
          <div
            className={styles.fill}
            style={{
              width: `${maxPicks > 0 ? (row.original.picks / maxPicks) * 100 : 0}%`,
            }}
          />
        </div>
      </div>
    ),
  }),
  columnHelper.accessor("pickAccuracy", {
    header: "Picks right",
    meta: { mobileHeader: "Right", align: "center" },
    sortDescFirst: true,
    sortUndefined: "last",
    cell: ({ getValue }) => <p className={styles.percent}>{pct(getValue())}</p>,
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
        <p className={styles.number}>{games ? `${covers} of ${games}` : "—"}</p>
      );
    },
  }),
];

const cx = (...names: (string | false | undefined)[]) =>
  names.filter(Boolean).join(" ");

// The top of the current sort; the rest is one tap away.
const INITIAL_ROWS = 10;

export default function SeasonTeamTable(props: Props) {
  const isMobile = useMediaQuery(DOWN_SM);
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

  const reactTable = useReactTable({
    data,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getRowId: (row) => String(row.id),
  });

  if (data.length === 0) {
    return <p className={styles.empty}>No picks graded yet this season.</p>;
  }

  const rows = reactTable.getRowModel().rows;
  const visibleRows = showAll ? rows : rows.slice(0, INITIAL_ROWS);

  return (
    <div>
      <div className={table.container}>
        <table className={table.table}>
          <thead>
            {reactTable.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header, i) => (
                  <th
                    key={header.id}
                    className={cx(
                      table.cell,
                      table.small,
                      table.head,
                      styles.headCell,
                      header.column.columnDef.meta?.align === "center" &&
                        table.center,
                      i === 0 && styles.stickyHead
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
            {visibleRows.map((row) => (
              <tr key={row.id} className={cx(table.hover, styles.row)}>
                {row.getVisibleCells().map((cell, i) => (
                  <td
                    key={cell.id}
                    className={cx(
                      table.cell,
                      table.small,
                      styles.bodyCell,
                      cell.column.columnDef.meta?.align === "center" &&
                        table.center,
                      i === 0 && styles.sticky
                    )}
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {rows.length > INITIAL_ROWS && (
        <Button
          size="small"
          onClick={() => setShowAll((s) => !s)}
          aria-expanded={showAll}
          className={styles.toggle}
        >
          {showAll ? "Show top 10" : `Show all ${rows.length} teams`}
        </Button>
      )}
    </div>
  );
}
