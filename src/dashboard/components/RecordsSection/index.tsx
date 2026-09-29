import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Card,
  CardContent,
  CircularProgress,
  Stack,
  Tab,
  Tabs,
  Typography,
} from "@mui/material";
import { GetHistorical } from "../../data/GetHistorical";
import { HistoricalRecords } from "../../types";
import AllTimeTable, { useAllTimeTable } from "./AllTimeTable";
import ChampionsRow from "./ChampionsRow";
import FinishesGrid from "./FinishesGrid";
import RecordTiles from "./RecordTiles";
import SeasonTable from "./SeasonTable";
import { buildCareerRows, buildRecordTiles, closedSeasons, HALVES_FROM_SEASON } from "./recordsUtils";

type TableTab = "all-time" | "season" | "finishes";

type Props = {
  season: number;
  // Selected user from the header dropdown -- highlighted everywhere.
  userId: string;
};

const SectionTitle = ({ children }: { children: React.ReactNode }) => (
  <Typography component="h2" variant="h6" sx={{ fontWeight: 700 }}>
    {children}
  </Typography>
);

export default function RecordsSection({ season, userId }: Props) {
  const [data, setData] = useState<HistoricalRecords | undefined>(undefined);
  const [tab, setTab] = useState<TableTab>("all-time");
  const [selectedYear, setSelectedYear] = useState<number | undefined>(undefined);

  useEffect(() => GetHistorical(setData), []);

  const careerRows = useMemo(() => (data ? buildCareerRows(data) : []), [data]);
  const tiles = useMemo(
    () => (data ? buildRecordTiles(data, careerRows, season) : []),
    [data, careerRows, season]
  );
  const allTimeTable = useAllTimeTable(careerRows);

  if (!data) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
        <CircularProgress size={28} />
      </Box>
    );
  }

  const years = closedSeasons(data);
  const year = selectedYear ?? years[years.length - 1];
  const incompleteYears = years.filter((y) => data.years[String(y)]?.incomplete);

  return (
    // App.css centers text app-wide; this page reads as tables and tiles.
    <Card variant="outlined" sx={{ textAlign: "left" }}>
      <CardContent>
        <Stack spacing={4}>
          <Stack spacing={1.5}>
            <SectionTitle>Champions</SectionTitle>
            <ChampionsRow data={data} currentSeason={season} userId={userId} />
          </Stack>

          <Stack spacing={1.5}>
            <SectionTitle>Records</SectionTitle>
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
                <Typography variant="caption" color="text.secondary">
                  Avg finish and avg score count every season a player has on record. Click a
                  column to sort.
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
            color="text.secondary"
            sx={{ bgcolor: "background.default", borderRadius: 1, px: 1.5, py: 1 }}
          >* Records before {HALVES_FROM_SEASON} are incomplete. First and second-half results start in {HALVES_FROM_SEASON}.
            {incompleteYears.length > 0 &&
              ` ${incompleteYears.join(" and ")} ${incompleteYears.length === 1 ? "is" : "are"} missing some players, including the champion.`}{" "}
          </Typography>
        </Stack>
      </CardContent>
    </Card>
  );
}
