import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TableSortLabel from "@mui/material/TableSortLabel";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import Typography from "@mui/material/Typography";
import useMediaQuery from "@mui/material/useMediaQuery";
import { useTheme } from "@mui/material/styles";
import dayjs from "dayjs";
import { formatUpdated } from "../../utils/updatedTime";
import { ReactNode, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { PickRecord, StandingsTeam } from "../../types";
import TabIntro from "../TabIntro";
import { pool } from "../../shared-theme/themePrimitives";
import TabSkeleton from "../TabSkeleton";
import LoadError from "../shared/LoadError";
import { TeamLink } from "../shared/TeamLink";
import { TeamLogo } from "../shared/TeamLogo";
import { usePlayerSeason } from "../Players/usePlayerData";
import { teamPath } from "./nflView";
import {
  StandingsSortKey,
  firstName,
  flattenStandings,
  formatAts,
  formatDiff,
  formatPickRecord,
  formatWinLoss,
  poolRecordsById,
  sortValue,
} from "./standingsUtils";
import { useAllTeamProfiles, useStandings } from "./useNflData";

type Layout = "divisions" | "league";
type Conference = "AFC" | "NFC";

// The pool's own columns (everyone's record on the team, the selected
// player's) get a faint brand tint: they're what a general standings page
// can't show.
const POOL_TINT = pool[50];

interface Column {
  key: StandingsSortKey | "streak" | "team";
  label: ReactNode;
  // Narrow columns; the team takes the rest.
  width: { xs: number; sm: number };
  phone: boolean;
  pool?: boolean;
  title?: string;
}

const Muted = () => (
  <Box component="span" sx={{ color: "text.disabled" }}>
    –
  </Box>
);

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
  const theme = useTheme();
  const isPhone = useMediaQuery(theme.breakpoints.down("sm"));
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

  const allColumns: Column[] = [
    { key: "team", label: "Team", width: { xs: 0, sm: 0 }, phone: true },
    { key: "record", label: "W-L", width: { xs: 44, sm: 56 }, phone: true },
    { key: "diff", label: "Diff", width: { xs: 0, sm: 52 }, phone: false },
    { key: "streak", label: "Strk", width: { xs: 0, sm: 48 }, phone: false },
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
            label: (
              <Box
                component="span"
                sx={{
                  display: "inline-block",
                  maxWidth: "7ch",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  verticalAlign: "bottom",
                }}
              >
                {playerLabel}
              </Box>
            ),
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

  const cell = (column: Column, row: StandingsTeam): ReactNode => {
    switch (column.key) {
      case "team":
        return (
          <TeamLink abbr={row.team.abbr} sx={{ gap: 1, maxWidth: "100%" }}>
            <TeamLogo abbr={row.team.abbr} size={22} decorative />
            <Box component="span" sx={{ fontWeight: 600 }}>
              {row.team.abbr}
            </Box>
            {!isPhone && (
              <Box
                component="span"
                sx={{
                  color: "text.secondary",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {row.team.name}
              </Box>
            )}
          </TeamLink>
        );
      case "record":
        return formatWinLoss(row);
      case "diff":
        return formatDiff(row.point_diff);
      case "streak":
        return row.streak ?? <Muted />;
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
    { sortable = false, ranked = false } = {}
  ) => (
    <TableContainer>
      <Table
        size="small"
        aria-label={label}
        sx={{
          tableLayout: "fixed",
          "& td, & th": {
            px: { xs: 0.5, sm: 1 },
            fontVariantNumeric: "tabular-nums",
            whiteSpace: "nowrap",
          },
        }}
      >
        <colgroup>
          {columns.map((column) => (
            <Box
              component="col"
              key={column.key}
              sx={{
                width:
                  column.key === "team"
                    ? "auto"
                    : { xs: column.width.xs, sm: column.width.sm },
              }}
            />
          ))}
        </colgroup>
        <TableHead>
          <TableRow>
            {columns.map((column) => {
              const canSort =
                sortable && column.key !== "team" && column.key !== "streak";
              return (
                <TableCell
                  key={column.key}
                  align={column.key === "team" ? "left" : "right"}
                  title={column.title}
                  aria-sort={
                    canSort && sortKey === column.key ? "descending" : undefined
                  }
                  sx={{
                    fontSize: "0.75rem",
                    fontWeight: column.pool ? 700 : 500,
                    color: column.pool ? pool[700] : "text.secondary",
                    bgcolor: column.pool ? POOL_TINT : undefined,
                  }}
                >
                  {canSort ? (
                    <TableSortLabel
                      active={sortKey === column.key}
                      direction="desc"
                      hideSortIcon={isPhone}
                      onClick={() => setSortKey(column.key as StandingsSortKey)}
                    >
                      {column.label}
                    </TableSortLabel>
                  ) : (
                    column.label
                  )}
                </TableCell>
              );
            })}
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row, index) => (
            <TableRow
              key={row.team.id}
              hover
              // The team link is the keyboard way in; the whole row is a
              // bigger target for a mouse or a thumb.
              onClick={() => {
                navigate(teamPath(row.team.abbr));
                window.scrollTo({ top: 0 });
              }}
              sx={{ cursor: "pointer" }}
            >
              {columns.map((column) => (
                <TableCell
                  key={column.key}
                  align={column.key === "team" ? "left" : "right"}
                  sx={{
                    fontSize: { xs: "0.8125rem", sm: "0.875rem" },
                    bgcolor: column.pool ? POOL_TINT : undefined,
                    overflow: "hidden",
                  }}
                >
                  {ranked && column.key === "team" && (
                    <Box
                      component="span"
                      sx={{
                        display: "inline-block",
                        width: 22,
                        mr: 0.5,
                        color: "text.secondary",
                        fontSize: "0.75rem",
                        textAlign: "right",
                        verticalAlign: "middle",
                      }}
                    >
                      {index + 1}
                    </Box>
                  )}
                  {cell(column, row)}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );

  const legend = (
    <Typography
      variant="caption"
      component="p"
      sx={{
        color: "text.secondary",
        display: "flex",
        flexWrap: "wrap",
        columnGap: 2,
        rowGap: 0.25,
        mb: 1.5,
        fontSize: "0.75rem",
      }}
    >
      <span>
        <Box component="b" sx={{ color: "text.primary" }}>
          ATS
        </Box>{" "}
        record against the CBS line
      </span>
      <span>
        <Box component="b" sx={{ color: pool[700] }}>
          Pool
        </Box>{" "}
        everyone's record picking them
      </span>
      {userId && userName && (
        <span>
          <Box component="b" sx={{ color: pool[700] }}>
            {playerLabel}
          </Box>{" "}
          {userName} picking them
        </span>
      )}
    </Typography>
  );

  const controls = (
    <Box
      sx={{
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 1,
        mb: 1.5,
      }}
    >
      <ToggleButtonGroup
        size="small"
        exclusive
        value={layout}
        onChange={(_, next: Layout | null) => next && setLayout(next)}
        aria-label="Standings layout"
      >
        <ToggleButton value="divisions">Divisions</ToggleButton>
        <ToggleButton value="league">All 32</ToggleButton>
      </ToggleButtonGroup>
      {isPhone && layout === "divisions" && (
        <ToggleButtonGroup
          size="small"
          exclusive
          value={conference}
          onChange={(_, next: Conference | null) => next && setConference(next)}
          aria-label="Conference"
        >
          <ToggleButton value="AFC">AFC</ToggleButton>
          <ToggleButton value="NFC">NFC</ToggleButton>
        </ToggleButtonGroup>
      )}
    </Box>
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
  } else {
    body = (
      <Grid container columnSpacing={4} rowSpacing={3}>
        {standings.conferences
          .filter((c) => !isPhone || c.abbr === conference)
          .map((c) => (
            <Grid key={c.abbr} size={{ xs: 12, md: 6 }}>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
                {c.divisions.map((division) => (
                  <Box key={division.name}>
                    <Typography
                      component="h3"
                      sx={{
                        fontSize: "0.875rem",
                        fontWeight: 600,
                        ml: 1,
                        mb: 0.5,
                      }}
                    >
                      {division.name}
                    </Typography>
                    {table(division.teams, division.name)}
                  </Box>
                ))}
              </Box>
            </Grid>
          ))}
      </Grid>
    );
  }

  return (
    <Box sx={{ textAlign: "left" }}>
      {header}
      {controls}
      {legend}
      {body}
    </Box>
  );
}
