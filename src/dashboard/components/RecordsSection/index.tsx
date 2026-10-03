import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
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
import ChampionsWall from "./ChampionsWall";
import FinishesGrid from "./FinishesGrid";
import RecordTiles from "./RecordTiles";
import SeasonTable from "./SeasonTable";
import YourRecord, { NoRecordYet } from "./YourRecord";
import {
  allTimePlaces,
  buildCareerRows,
  buildRecordTiles,
  closedSeasons,
} from "./recordsUtils";

type TableTab = "finishes" | "all-time" | "season";
const TABLE_TABS: { value: TableTab; label: string }[] = [
  { value: "finishes", label: "Finishes by year" },
  { value: "all-time", label: "All-time" },
  { value: "season", label: "By season" },
];
const isTableTab = (v: string | null): v is TableTab =>
  TABLE_TABS.some((t) => t.value === v);

// The tab links only carry ?week=, so the last table is also remembered
// here (as Trends does with "trendsView").
const VIEW_STORAGE_KEY = "recordsView";
const storedView = (): TableTab | undefined => {
  try {
    const v = localStorage.getItem(VIEW_STORAGE_KEY);
    return isTableTab(v) ? v : undefined;
  } catch {
    return undefined;
  }
};

type Props = {
  season: number;
  // Selected user from the header dropdown -- highlighted everywhere.
  userId: string;
  // Opens the header's player picker.
  onChoosePlayer: () => void;
};

const SectionTitle = ({ children }: { children: React.ReactNode }) => (
  <Typography component="h3" variant="h6">
    {children}
  </Typography>
);

export default function RecordsSection({
  season,
  userId,
  onChoosePlayer,
}: Props) {
  const [data, setData] = useState<HistoricalRecords | undefined>(undefined);
  // The table and season live in the URL (?view=season&year=2019), so they
  // survive leaving the tab and can be linked. Finishes is the default.
  const [searchParams, setSearchParams] = useSearchParams();
  const viewParam = searchParams.get("view");
  const tab: TableTab = isTableTab(viewParam)
    ? viewParam
    : (storedView() ?? "finishes");
  const yearParam = Number(searchParams.get("year")) || undefined;
  const setParams = (next: { view?: TableTab; year?: number }) =>
    setSearchParams(
      (params) => {
        const view = next.view ?? tab;
        try {
          localStorage.setItem(VIEW_STORAGE_KEY, view);
        } catch {
          // Blocked storage: the URL still carries the choice.
        }
        if (view === "finishes") params.delete("view");
        else params.set("view", view);
        if (view === "season" && (next.year ?? yearParam))
          params.set("year", String(next.year ?? yearParam));
        else params.delete("year");
        return params;
      },
      { replace: true }
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
  const places = useMemo(() => allTimePlaces(careerRows), [careerRows]);

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
  const year =
    yearParam && years.includes(yearParam)
      ? yearParam
      : years[years.length - 1];
  const you = careerRows.find((row) => String(row.id) === userId);
  const yourPlace = you && places.get(you.id);

  // Option B order (user's call, 2026-10-02): your line, every champion, the
  // seasons (Finishes first), then the record tiles.
  return (
    // No card around the page: it sits flush like the other tabs.
    <Stack spacing={4}>
      {you && yourPlace ? (
        <YourRecord row={you} place={yourPlace} />
      ) : (
        <NoRecordYet
          selected={Boolean(userId)}
          season={season}
          onChoose={onChoosePlayer}
        />
      )}

      <ChampionsWall data={data} currentSeason={season} userId={userId} />

      <Stack spacing={1.5}>
        <SectionTitle>Every season</SectionTitle>
        <Tabs
          value={tab}
          onChange={(_, value: TableTab) => setParams({ view: value })}
          aria-label="Record tables"
          variant="scrollable"
          scrollButtons="auto"
          allowScrollButtonsMobile
          sx={{ borderBottom: 1, borderColor: "divider" }}
        >
          {TABLE_TABS.map((t) => (
            <Tab
              key={t.value}
              value={t.value}
              label={t.label}
              id={`records-tab-${t.value}`}
              aria-controls="records-tabpanel"
            />
          ))}
        </Tabs>

        <Box
          role="tabpanel"
          id="records-tabpanel"
          aria-labelledby={`records-tab-${tab}`}
        >
          {tab === "finishes" && (
            <FinishesGrid data={data} rows={careerRows} userId={userId} />
          )}
          {tab === "all-time" && (
            <AllTimeTable table={allTimeTable} userId={userId} />
          )}
          {tab === "season" && (
            <SeasonTable
              data={data}
              year={year}
              onYearChange={(y) => setParams({ view: "season", year: y })}
              userId={userId}
            />
          )}
        </Box>
      </Stack>

      <Stack spacing={1.5}>
        <SectionTitle>Pool records</SectionTitle>
        <RecordTiles tiles={tiles} userId={userId} />
      </Stack>
    </Stack>
  );
}
