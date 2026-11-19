import dayjs from "dayjs";
import { formatUpdated } from "../../utils/updatedTime";
import { CSSProperties, Fragment, ReactNode, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { PickRecord, StandingsTeam } from "../../types";
import TabIntro from "../TabIntro";
import TabSkeleton from "../TabSkeleton";
import LoadError from "../shared/LoadError";
import { TeamLink } from "../shared/TeamLink";
import { TeamLogo } from "../shared/TeamLogo";
import { usePlayerSeason } from "../Players/usePlayerData";
import { teamPath } from "./nflView";
import {
  DIVISION_WINNER_CUTOFF,
  PLAYOFF_CUTOFF,
  StandingsSortKey,
  conferenceTeams,
  firstName,
  flattenStandings,
  formatAts,
  formatDiff,
  formatGB,
  formatPickRecord,
  formatWinLoss,
  hasSeeds,
  poolRecordsById,
  shortDivision,
  sortValue,
} from "./standingsUtils";
import { useAllTeamProfiles, useStandings } from "./useNflData";
import { Button } from "../../ui/Button";
import { Icon } from "../../ui/Icon";
import { Popover } from "../../ui/Popover";
import { SegmentedControl } from "../../ui/SegmentedControl";
import { SortLabel } from "../../ui/SortLabel";
import tableStyles from "../../ui/table.module.css";
import { DOWN_SM, useMediaQuery } from "../../ui/useMediaQuery";
import styles from "./StandingsView.module.css";

type Layout = "divisions" | "conference" | "league";
type Conference = "AFC" | "NFC";

interface Column {
  key: StandingsSortKey | "streak" | "team" | "gb";
  label: ReactNode;
  // Narrow columns; the team takes the rest.
  width: { xs: number; sm: number };
  phone: boolean;
  pool?: boolean;
  title?: string;
}

const Muted = () => <span className={styles.muted}>–</span>;

const cx = (...names: (string | false | undefined)[]) =>
  names.filter(Boolean).join(" ");

export default function StandingsView({
  season,
  userId,
  userName,
  intro,
}: {
  season: number;
  userId?: string;
  userName?: string;
  // The NFL view switch, for the intro row.
  intro: ReactNode;
}) {
  const isPhone = useMediaQuery(DOWN_SM);
  const navigate = useNavigate();
  const { standings, failed, retry } = useStandings(season);
  // The standings key carries each team's pool record; an older key
  // without it falls back to the 32 team keys.
  const teamIdsMissingPool = useMemo(
    () =>
      standings
        ? flattenStandings(standings)
            .filter(({ row }) => !row.pool)
            .map(({ row }) => row.team.id)
        : [],
    [standings]
  );
  const profiles = useAllTeamProfiles(season, teamIdsMissingPool);
  const poolById = useMemo(
    () => poolRecordsById(standings, profiles),
    [standings, profiles]
  );
  const { trends } = usePlayerSeason(userId || undefined, season);
  const [layout, setLayout] = useState<Layout>("divisions");
  const [conference, setConference] = useState<Conference>("AFC");
  const [sortKey, setSortKey] = useState<StandingsSortKey>("record");

  const playerRecords = trends?.current_season.records?.teams;
  const playerRecord = (teamId: number): PickRecord | undefined =>
    playerRecords?.find((entry) => entry.team.id === teamId)?.picked;
  const poolRecord = (teamId: number): PickRecord | undefined =>
    poolById.get(teamId);
  const poolLoaded = poolById.size > 0;
  const playerLabel = userName ? firstName(userName) : "";

  const isConf = layout === "conference";
  const allColumns: Column[] = [
    { key: "team", label: "Team", width: { xs: 0, sm: 0 }, phone: true },
    { key: "record", label: "W-L", width: { xs: 44, sm: 56 }, phone: true },
    ...(isConf
      ? [
          {
            key: "gb" as const,
            label: "GB",
            width: { xs: 32, sm: 42 },
            phone: true,
            title: "Games behind the #1 seed",
          },
        ]
      : [
          {
            key: "diff" as const,
            label: "Diff",
            width: { xs: 0, sm: 52 },
            phone: false,
          },
          {
            key: "streak" as const,
            label: "Strk",
            width: { xs: 0, sm: 48 },
            phone: false,
          },
        ]),
    {
      key: "ats",
      label: "ATS",
      width: { xs: 44, sm: 52 },
      phone: true,
      title: "Record against the CBS line",
    },
    {
      key: "pool",
      label: "Pool",
      width: { xs: 54, sm: 64 },
      phone: true,
      pool: true,
      title: "Everyone's record picking them",
    },
    ...(userId && userName
      ? [
          {
            key: "player" as const,
            label: <span className={styles.playerLabel}>{playerLabel}</span>,
            width: { xs: 52, sm: 68 },
            phone: true,
            pool: true,
            title: `${userName} picking them`,
          },
        ]
      : []),
  ];
  const columns = allColumns.filter((column) => column.phone || !isPhone);

  const header = (
    <TabIntro
      title="Standings"
      meta={
        standings &&
        dayjs(standings.updated_at).isValid() &&
        `${standings.season} season · Updated ${formatUpdated(standings.updated_at)}`
      }
      actions={intro}
    />
  );

  if (!standings) {
    return (
      <>
        {header}
        {failed ? (
          <LoadError
            title="Couldn't load the standings."
            detail="Trying again every 5 minutes."
            onRetry={retry}
          />
        ) : (
          <TabSkeleton shape="rows" label="Loading the standings" />
        )}
      </>
    );
  }

  const seedsAvailable = hasSeeds(standings);

  const cell = (column: Column, row: StandingsTeam): ReactNode => {
    switch (column.key) {
      case "team":
        return (
          <TeamLink abbr={row.team.abbr} className={styles.teamLink}>
            <TeamLogo abbr={row.team.abbr} size={22} decorative />
            <span className={styles.teamAbbr}>{row.team.abbr}</span>
            {!isPhone && (
              <span className={styles.teamName}>{row.team.name}</span>
            )}
          </TeamLink>
        );
      case "record":
        return formatWinLoss(row);
      case "diff":
        return formatDiff(row.point_diff);
      case "streak":
        return row.streak ?? <Muted />;
      case "gb":
        return formatGB(row.games_behind);
      case "ats":
        return formatAts(row.ats);
      case "pool":
        return poolLoaded ? (
          (formatPickRecord(poolRecord(row.team.id)) ?? <Muted />)
        ) : (
          <Muted />
        );
      case "player":
        return formatPickRecord(playerRecord(row.team.id)) ?? <Muted />;
    }
  };

  const table = (
    rows: StandingsTeam[],
    label: string,
    {
      sortable = false,
      ranked = false,
      confDivisions,
    }: {
      sortable?: boolean;
      ranked?: boolean;
      confDivisions?: Map<number, string>;
    } = {}
  ) => {
    const isConfTable = !!confDivisions;
    return (
      <div className={tableStyles.container}>
        <table
          aria-label={label}
          className={cx(tableStyles.table, styles.table)}
        >
          <colgroup>
            {columns.map((column) => (
              <col
                key={column.key}
                className={column.key === "team" ? undefined : styles.col}
                style={
                  column.key === "team"
                    ? undefined
                    : ({
                        "--col-xs": `${column.width.xs}px`,
                        "--col-sm": `${column.width.sm}px`,
                      } as CSSProperties)
                }
              />
            ))}
          </colgroup>
          <thead>
            <tr>
              {columns.map((column) => {
                const canSort =
                  sortable &&
                  column.key !== "team" &&
                  column.key !== "streak";
                return (
                  <th
                    key={column.key}
                    scope="col"
                    title={column.title}
                    aria-sort={
                      canSort && sortKey === column.key
                        ? "descending"
                        : undefined
                    }
                    className={cx(
                      tableStyles.cell,
                      tableStyles.small,
                      tableStyles.head,
                      column.key !== "team" && tableStyles.right,
                      styles.cell,
                      styles.headCell,
                      column.pool && styles.poolHead
                    )}
                  >
                    {canSort ? (
                      <SortLabel
                        active={sortKey === column.key}
                        direction="desc"
                        hideInactiveIcon={isPhone}
                        onClick={() =>
                          setSortKey(column.key as StandingsSortKey)
                        }
                      >
                        {column.label}
                      </SortLabel>
                    ) : (
                      column.label
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => {
              const prevSeed =
                index > 0 ? (rows[index - 1].seed ?? 99) : 0;
              const curSeed = row.seed ?? 99;
              const showCutoff =
                isConfTable &&
                prevSeed <= PLAYOFF_CUTOFF &&
                curSeed > PLAYOFF_CUTOFF;
              const isOut = isConfTable && curSeed > PLAYOFF_CUTOFF;
              const isDivWinner =
                isConfTable &&
                row.seed != null &&
                row.seed <= DIVISION_WINNER_CUTOFF;

              return (
                <Fragment key={row.team.id}>
                  {showCutoff && (
                    <tr
                      className={styles.cutoffRow}
                      aria-hidden="true"
                    >
                      <td
                        colSpan={columns.length}
                        className={styles.cutoffCell}
                      />
                    </tr>
                  )}
                  <tr
                    className={cx(
                      tableStyles.hover,
                      styles.row,
                      isOut && styles.outside
                    )}
                    onClick={() => {
                      navigate(teamPath(row.team.abbr));
                      window.scrollTo({ top: 0 });
                    }}
                  >
                    {columns.map((column) => (
                      <td
                        key={column.key}
                        className={cx(
                          tableStyles.cell,
                          tableStyles.small,
                          column.key !== "team" && tableStyles.right,
                          styles.cell,
                          styles.bodyCell,
                          column.pool && styles.poolCell
                        )}
                      >
                        {(ranked || isConfTable) &&
                          column.key === "team" && (
                            <span className={styles.rank}>
                              {isConfTable
                                ? (row.seed ?? "–")
                                : index + 1}
                            </span>
                          )}
                        {cell(column, row)}
                        {isDivWinner &&
                          column.key === "team" &&
                          confDivisions && (
                            <span className={styles.divLabel}>
                              {confDivisions.get(row.team.id)}
                            </span>
                          )}
                      </td>
                    ))}
                  </tr>
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  // Under the controls from sm up; behind the Key button on phones, where
  // its three lines pushed the first division down.
  const legend = (
    <p
      className={[styles.legend, isPhone && styles.legendPhone]
        .filter(Boolean)
        .join(" ")}
    >
      {isConf && (
        <span>
          <b className={styles.legendTerm}>GB</b> games behind the #1 seed
        </span>
      )}
      <span>
        <b className={styles.legendTerm}>ATS</b> record against the CBS line
      </span>
      <span>
        <b className={styles.legendPool}>Pool</b> everyone's record picking them
      </span>
      {userId && userName && (
        <span>
          <b className={styles.legendPool}>{playerLabel}</b> {userName} picking
          them
        </span>
      )}
    </p>
  );

  const controls = (
    <div className={styles.controls}>
      {isPhone ? (
        // Phones: one control. AFC and NFC show that conference's
        // divisions; Conf shows both conferences by seed; All 32 is the
        // league table.
        <SegmentedControl<Conference | "conference" | "league">
          value={
            layout === "league"
              ? "league"
              : layout === "conference"
                ? "conference"
                : conference
          }
          onChange={(next) => {
            if (next === "league") {
              setLayout("league");
            } else if (next === "conference") {
              setLayout("conference");
            } else {
              setLayout("divisions");
              setConference(next);
            }
          }}
          label="Standings"
          segments={[
            { value: "AFC", children: "AFC" },
            { value: "NFC", children: "NFC" },
            ...(seedsAvailable
              ? [
                  {
                    value: "conference" as const,
                    children: "Conf",
                  },
                ]
              : []),
            { value: "league", children: "All 32" },
          ]}
        />
      ) : (
        <SegmentedControl<Layout>
          value={layout}
          onChange={setLayout}
          label="Standings layout"
          segments={[
            { value: "divisions", children: "Divisions" },
            ...(seedsAvailable
              ? [
                  {
                    value: "conference" as const,
                    children: "Conference",
                  },
                ]
              : []),
            { value: "league", children: "All 32" },
          ]}
        />
      )}
      {isPhone && (
        <Popover
          label="What the columns mean"
          align="end"
          trigger={
            <Button
              size="small"
              startIcon={<Icon name="HelpOutlineOutlined" />}
              style={{ color: "var(--text-muted)" }}
            >
              Key
            </Button>
          }
        >
          {legend}
        </Popover>
      )}
    </div>
  );

  let body: ReactNode;
  if (layout === "league") {
    const sorted = flattenStandings(standings)
      .map(({ row }) => row)
      .sort(
        (a, b) =>
          sortValue(
            b,
            sortKey,
            poolRecord(b.team.id),
            playerRecord(b.team.id)
          ) -
          sortValue(a, sortKey, poolRecord(a.team.id), playerRecord(a.team.id))
      );
    body = table(sorted, "All 32 teams", { sortable: true, ranked: true });
  } else if (layout === "conference" && seedsAvailable) {
    body = (
      <div className={styles.conferences}>
        {(["AFC", "NFC"] as const).map((abbr) => {
          const teams = conferenceTeams(standings, abbr);
          const divMap = new Map(
            teams.map((t) => [t.row.team.id, shortDivision(t.division)])
          );
          return (
            <div key={abbr}>
              <h3 className={styles.divisionTitle}>{abbr}</h3>
              {table(
                teams.map((t) => t.row),
                `${abbr} conference standings`,
                { confDivisions: divMap }
              )}
            </div>
          );
        })}
      </div>
    );
  } else {
    body = (
      <div className={styles.conferences}>
        {standings.conferences
          .filter((c) => !isPhone || c.abbr === conference)
          .map((c) => (
            <div key={c.abbr} className={styles.divisions}>
              {c.divisions.map((division) => (
                <div key={division.name}>
                  <h3 className={styles.divisionTitle}>{division.name}</h3>
                  {table(division.teams, division.name)}
                </div>
              ))}
            </div>
          ))}
      </div>
    );
  }

  return (
    <div className={styles.page}>
      {header}
      {controls}
      {!isPhone && legend}
      {body}
    </div>
  );
}
