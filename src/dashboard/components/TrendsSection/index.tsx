import { SyntheticEvent, useEffect, useState } from "react";
import { Box, Card, CardContent, Tab, Tabs, Typography } from "@mui/material";
import Grid from "@mui/material/Grid2";
import { GetTrendsByWeek } from "../../data/GetTrendsByWeek";
import { GetSeasonTrends } from "../../data/GetSeasonTrends";
import {
  fetchWeekGames,
  getGameCoverResult,
  GameCoverResult,
} from "../../data/weekGames";
import { SeasonTrends, WeekTrends } from "../../types";
import ConsensusCard from "./ConsensusCard";
import AllAloneCard from "./AllAloneCard";
import LineMoversCard from "./LineMoversCard";
import SeasonAllAloneCard from "./SeasonAllAloneCard";
import SeasonTeamTable from "./SeasonTeamTable";

export type Props = {
  season: number;
  week: number;
};

const EMPTY_WEEK_TRENDS: WeekTrends = {
  week: 0,
  updated_at: "",
  pick_popularity: [],
  cold_teams: [],
  one_sided_games: [],
  all_alone_picks: [],
  spread_movers: [],
};

const EMPTY_SEASON_TRENDS: SeasonTrends = {
  season: 0,
  updated_at: "",
  team_pick_totals: [],
  cold_teams_season: [],
  team_ats_record: [],
  trap_team: [],
  team_believers_faders: [],
  all_alone_picks_season: [],
};

type Section = {
  title?: string;
  content: React.ReactNode;
  // Grid sizing; defaults to three equal columns from md up.
  size?: { xs?: number; md?: number; lg?: number };
};

const DEFAULT_SECTION_SIZE = { xs: 12, md: 4 };

const GAME_RESULTS_POLL_INTERVAL_MS = 5 * 60_000;

export default function TrendsSection({ season, week }: Props) {
  const [tab, setTab] = useState<"week" | "season">("week");
  const [weekTrends, setWeekTrends] = useState<WeekTrends>(EMPTY_WEEK_TRENDS);
  const [seasonTrends, setSeasonTrends] =
    useState<SeasonTrends>(EMPTY_SEASON_TRENDS);
  const [gameResults, setGameResults] = useState<Map<number, GameCoverResult>>(
    new Map()
  );
  // Keyed by "{week_number}:{game_id}" since the season log spans multiple weeks
  // and game_id resets each week.
  const [seasonGameResults, setSeasonGameResults] = useState<
    Map<string, GameCoverResult>
  >(new Map());

  useEffect(() => {
    const unsubscribe = GetTrendsByWeek(season, week, setWeekTrends);
    return () => unsubscribe?.();
  }, [season, week]);

  useEffect(() => {
    const unsubscribe = GetSeasonTrends(season, setSeasonTrends);
    return () => unsubscribe?.();
  }, [season]);

  // Grades trend cards against final scores -- see getGameCoverResult for why
  // this uses the ATS cover, not the straight-up winner, as "who won the pick".
  useEffect(() => {
    if (season === 0 || week === 0) return;
    let cancelled = false;

    const tick = () => {
      fetchWeekGames(season, week)
        .then(({ games }) => {
          if (cancelled) return;
          setGameResults(
            new Map(games.map((game) => [game.game_id, getGameCoverResult(game)]))
          );
        })
        .catch((error) => console.error("Failed to fetch week games", error));
    };

    tick();
    const intervalId = setInterval(tick, GAME_RESULTS_POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(intervalId);
    };
  }, [season, week]);

  // Grades the season all-alone log against each pick's own week's final score --
  // spans multiple weeks, so results are keyed by "{week_number}:{game_id}".
  useEffect(() => {
    if (season === 0) return;
    const weeks = Array.from(
      new Set(seasonTrends.all_alone_picks_season.map((p) => p.week_number))
    );
    if (weeks.length === 0) return;
    let cancelled = false;

    Promise.all(
      weeks.map((wk) =>
        fetchWeekGames(season, wk).then((res) => ({ week: wk, games: res.games }))
      )
    )
      .then((results) => {
        if (cancelled) return;
        const map = new Map<string, GameCoverResult>();
        results.forEach(({ week: wk, games }) => {
          games.forEach((game) => {
            map.set(`${wk}:${game.game_id}`, getGameCoverResult(game));
          });
        });
        setSeasonGameResults(map);
      })
      .catch((error) =>
        console.error("Failed to fetch season all-alone game results", error)
      );

    return () => {
      cancelled = true;
    };
  }, [season, seasonTrends.all_alone_picks_season]);

  const handleTabChange = (_event: SyntheticEvent, value: "week" | "season") => {
    setTab(value);
  };

  const weekSections: Section[] = [
    {
      title: "Consensus",
      content: <ConsensusCard trends={weekTrends} gameResults={gameResults} />,
    },
    {
      title: "All Alone",
      content: (
        <AllAloneCard
          allAlonePicks={weekTrends.all_alone_picks}
          gameResults={gameResults}
        />
      ),
    },
    {
      title: "Line Movers",
      content: (
        <LineMoversCard
          lineMovers={weekTrends.spread_movers}
          gameResults={gameResults}
        />
      ),
    },
  ];

  const seasonSections: Section[] = [
    {
      
      // Full width until lg, then shares the row with the All Alone Log so
      // the log isn't pushed below a 32-row table.
      size: { xs: 12, lg: 8 },
      content: (
        <SeasonTeamTable
          teamPickTotals={seasonTrends.team_pick_totals}
          coldTeamsSeason={seasonTrends.cold_teams_season}
          teamAtsRecord={seasonTrends.team_ats_record}
          teamBelieversFaders={seasonTrends.team_believers_faders}
        />
      ),
    },
    {
      title: "All Alone Log",
      size: { xs: 12, lg: 4 },
      content: (
        <SeasonAllAloneCard
          allAlonePicksSeason={seasonTrends.all_alone_picks_season}
          gameResults={seasonGameResults}
        />
      ),
    },
  ];

  const sections = tab === "week" ? weekSections : seasonSections;

  return (
    <Card variant="outlined" sx={{ height: "100%", flexGrow: 1 }}>
      <CardContent>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 1,
          }}
        >
          <Typography sx={{ color: "text.secondary" }}>Trends</Typography>
          <Tabs
            value={tab}
            onChange={handleTabChange}
            sx={{ minHeight: 32 }}
          >
            <Tab
              value="week"
              label={`Week ${week}`}
              sx={{ minHeight: 32, py: 0 }}
            />
            <Tab value="season" label="Season" sx={{ minHeight: 32, py: 0 }} />
          </Tabs>
        </Box>
        <Grid container spacing={2} sx={{ mt: 0.5 }}>
          {sections.map((section) => (
            <Grid key={section.title} size={section.size ?? DEFAULT_SECTION_SIZE}>
              {section.title ? (<Typography
                variant="subtitle2"
                sx={{ mb: 1, color: "text.secondary" }}
              >
                {section.title}
              </Typography>) : ""}
              {section.content}
            </Grid>
          ))}
        </Grid>
      </CardContent>
    </Card>
  );
}
