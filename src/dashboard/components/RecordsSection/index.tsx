import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Stack,
  Tab,
  Tabs,
  Typography,
} from "@mui/material";
import { GetHistorical } from "../../data/GetHistorical";
import TabSkeleton from "../TabSkeleton";
import { HistoricalRecords } from "../../types";
import AllTimeTable, { useAllTimeTable } from "./AllTimeTable";
import ChampionsRow from "./ChampionsRow";
import FinishesGrid from "./FinishesGrid";
import RecordTiles from "./RecordTiles";
import SeasonTable from "./SeasonTable";
import {
  buildCareerRows,
  buildRecordTiles,
  closedSeasons,
  HALVES_FROM_SEASON,
} from "./recordsUtils";

type TableTab = "all-time" | "season" | "finishes";

type Props = {
  season: number;
  // Selected user from the header dropdown -- highlighted everywhere.
  userId: string;
};

const SectionTitle = ({ children }: { children: React.ReactNode }) => (
  <Typography component="h3" variant="h6" sx={{ fontWeight: 700 }}>
    {children}
  </Typography>
);

export default function RecordsSection({ season, userId }: Props) {
  const [data, setData] = useState<HistoricalRecords | undefined>(undefined);
  const [tab, setTab] = useState<TableTab>("all-time");
  const [selectedYear, setSelectedYear] = useState<number | undefined>(
    undefined
  );

  // The poll only repeats every 30 minutes, so a failed first load offers
  // its own retry; bumping `attempt` restarts the poll.
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    setFailed(false);
    return GetHistorical(
      (records) => {
        setData(records);
        setFailed(false);
      },
      () => setFailed(true)
    );
  }, [attempt]);

  const careerRows = useMemo(() => (data ? buildCareerRows(data) : []), [data]);
  const tiles = useMemo(
    () => (data ? buildRecordTiles(data, careerRows, season) : []),
    [data, careerRows, season]
  );
  const allTimeTable = useAllTimeTable(careerRows);

  if (!data && failed) {
    return (
      <Alert
        severity="error"
        sx={{ textAlign: "left" }}
        action={
          <Button
            color="inherit"
            size="small"
            onClick={() => setAttempt((n) => n + 1)}
          >
            Try again
          </Button>
        }
      >
        Couldn't load the records.
      </Alert>
    );
  }
  if (!data) {
    return <TabSkeleton shape="tiles" label="Loading the records" />;
  }

  const years = closedSeasons(data);
  const year = selectedYear ?? years[years.length - 1];
  const incompleteYears = years.filter(
    (y) => data.years[String(y)]?.incomplete
  );

  return (
    // No card around the page: it sits flush like the other tabs.
    <Box>
      <Stack spacing={4}>
        <Stack spacing={1.5}>
          <SectionTitle>Champions</SectionTitle>
          <ChampionsRow data={data} currentSeason={season} userId={userId} />
        </Stack>

        <Stack spacing={1.5}>
          <SectionTitle>All-time records</SectionTitle>
          <RecordTiles tiles={tiles} userId={userId} />
        </Stack>

        <Stack spacing={1.5}>
          <Tabs
            value={tab}
            onChange={(_, value: TableTab) => setTab(value)}
            variant="scrollable"
            scrollButtons="auto"
            allowScrollButtonsMobile
            sx={{ borderBottom: 1, borderColor: "divider" }}
          >
            <Tab value="all-time" label="All-time" />
            <Tab value="season" label="By season" />
            <Tab value="finishes" label="Finishes by year" />
          </Tabs>

          {tab === "all-time" && (
            <>
              <AllTimeTable table={allTimeTable} userId={userId} />
              <Typography
                variant="caption"
                sx={{
                  color: "text.secondary",
                }}
              >
                Avg finish and avg score count every season a player has on
                record. Click a column to sort.
              </Typography>
            </>
          )}
          {tab === "season" && (
            <SeasonTable
              data={data}
              year={year}
              onYearChange={setSelectedYear}
              userId={userId}
            />
          )}
          {tab === "finishes" && (
            <FinishesGrid
              data={data}
              rows={allTimeTable.getRowModel().rows.map((row) => row.original)}
              userId={userId}
            />
          )}
        </Stack>

        <Typography
          variant="caption"
          sx={{
            color: "text.secondary",
            bgcolor: "background.default",
            borderRadius: 1,
            px: 1.5,
            py: 1,
          }}
        >
          * Records before {HALVES_FROM_SEASON} are incomplete. First and
          second-half results start in {HALVES_FROM_SEASON}.
          {incompleteYears.length > 0 &&
            ` ${incompleteYears.join(" and ")} ${incompleteYears.length === 1 ? "is" : "are"} missing some players, including the champion.`}{" "}
        </Typography>
      </Stack>
    </Box>
  );
}
