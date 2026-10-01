import { SyntheticEvent, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Skeleton,
  Stack,
  Tab,
  Tabs,
  Typography,
} from "@mui/material";
import Grid from "@mui/material/Grid";
import { GetTrendsByWeek } from "../../data/GetTrendsByWeek";
import { GetSeasonTrends } from "../../data/GetSeasonTrends";
import {
  fetchWeekGames,
  getGameCoverResult,
  GameCoverResult,
} from "../../data/weekGames";
import { RankedUser, SeasonTrends, WeekRecap, WeekTrends } from "../../types";
import WeekRecapSection from "../Recap/WeekRecapSection";
import SeasonRecapCharts from "../Recap/SeasonRecapCharts";
import { itemsForScope } from "../Recap/weekCards";
import ConsensusCard from "./ConsensusCard";
import AllAloneCard from "./AllAloneCard";
import SeasonAllAloneCard from "./SeasonAllAloneCard";
import SeasonTeamTable from "./SeasonTeamTable";
import YouThisWeekCard from "./YouThisWeekCard";

export type Props = {
  season: number;
  week: number;
  // The selected week's recap: this week's cards on Week, the season-to-date
  // cards and the week-over-week charts on Season (its `series` covers every
  // week through this one).
  recap?: WeekRecap;
  userList: RankedUser[];
  // The selected player ("" when nobody is picked).
  userId: string;
};

type View = "week" | "season";

// Week or Season lives in the URL (?view=season) so it can be linked, and
// in localStorage so coming back to Trends from another tab keeps it. With
// neither, or while the week has nothing to show yet, Trends opens on Season
// (see `view` below).
const VIEW_STORAGE_KEY = "trendsView";
const readStoredView = (): View => {
  try {
    return localStorage.getItem(VIEW_STORAGE_KEY) === "season"
      ? "season"
      : "week";
  } catch {
    return "week";
  }
};

const GAME_RESULTS_POLL_INTERVAL_MS = 5 * 60_000;

// One heading style for every section on the tab.
function SectionHeading({
  children,
  note,
}: {
  children: React.ReactNode;
  note?: React.ReactNode;
}) {
  return (
    <Box sx={{ mb: 1.5 }}>
      <Typography variant="h6" component="h2">
        {children}
      </Typography>
      {note && (
        <Typography
          variant="body2"
          sx={{ color: "text.secondary", maxWidth: "65ch" }}
        >
          {note}
        </Typography>
      )}
    </Box>
  );
}

const LoadingRows = ({ label }: { label: string }) => (
  <Stack spacing={1} aria-label={label} aria-busy="true">
    {[0, 1, 2, 3].map((i) => (
      <Skeleton key={i} variant="rounded" height={28} />
    ))}
  </Stack>
);

const LoadFailed = ({ what }: { what: string }) => (
  <Alert severity="error">
    Couldn't load {what}. This page tries again every 5 minutes, or reload to
    try now.
  </Alert>
);

export default function TrendsSection({
  season,
  week,
  recap,
  userList,
  userId,
}: Props) {
  const [searchParams, setSearchParams] = useSearchParams();
  const urlView = searchParams.get("view");

  // undefined = still loading (never shown as "no data").
  const [weekTrends, setWeekTrends] = useState<WeekTrends>();
  const [weekFailed, setWeekFailed] = useState(false);
  const [seasonTrends, setSeasonTrends] = useState<SeasonTrends>();
  const [seasonFailed, setSeasonFailed] = useState(false);
  const [gameResults, setGameResults] = useState<Map<number, GameCoverResult>>(
    new Map()
  );
  // Keyed by "{week_number}:{game_id}" since the season log spans multiple weeks
  // and game_id resets each week.
  const [seasonGameResults, setSeasonGameResults] = useState<
    Map<string, GameCoverResult>
  >(new Map());

  // Switching weeks clears the old week first, so its trends never sit
  // under the new week's label while the new ones load.
  useEffect(() => {
    setWeekTrends(undefined);
    setWeekFailed(false);
    setGameResults(new Map());
    const unsubscribe = GetTrendsByWeek(
      season,
      week,
      (trends) => {
        setWeekTrends(trends);
        setWeekFailed(false);
      },
      () => setWeekFailed(true)
    );
    return () => unsubscribe?.();
  }, [season, week]);

  useEffect(() => {
    setSeasonTrends(undefined);
    setSeasonFailed(false);
    const unsubscribe = GetSeasonTrends(
      season,
      (trends) => {
        setSeasonTrends(trends);
        setSeasonFailed(false);
      },
      () => setSeasonFailed(true)
    );
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
            new Map(
              games.map((game) => [game.game_id, getGameCoverResult(game)])
            )
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
  const seasonAlone = seasonTrends?.all_alone_picks_season;
  useEffect(() => {
    if (season === 0 || !seasonAlone) return;
    const weeks = Array.from(new Set(seasonAlone.map((p) => p.week_number)));
    if (weeks.length === 0) return;
    let cancelled = false;

    Promise.all(
      weeks.map((wk) =>
        fetchWeekGames(season, wk).then((res) => ({
          week: wk,
          games: res.games,
        }))
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
  }, [season, seasonAlone]);

  const handleViewChange = (_event: SyntheticEvent, value: View) => {
    try {
      localStorage.setItem(VIEW_STORAGE_KEY, value);
    } catch {
      // Blocked storage: the URL still carries the choice.
    }
    setSearchParams(
      (params) => {
        params.set("view", value);
        return params;
      },
      { replace: true }
    );
  };

  const user = useMemo(
    () => (userId ? userList.find((u) => u.id === userId) : undefined),
    [userList, userId]
  );
  // The recap only counts once it's for the week being shown.
  const weekRecap = recap?.week === week ? recap : undefined;
  const weekItems = useMemo(
    () => (weekRecap ? itemsForScope(weekRecap.items, "week") : []),
    [weekRecap]
  );
  const seasonItems = useMemo(
    () => (weekRecap ? itemsForScope(weekRecap.items, "season") : []),
    [weekRecap]
  );

  const hasConsensus = (weekTrends?.pick_popularity.length ?? 0) > 0;
  // Nothing for this week yet (before kickoff, picks hidden and no recap
  // items): open on Season instead of an empty Week. Only decided once the
  // week's trends have loaded, so the view doesn't flip while loading. An
  // explicit choice in the URL (clicking Week sets it) always wins.
  const weekEmpty = !!weekTrends && !hasConsensus && weekItems.length === 0;
  const view: View =
    urlView === "season" || urlView === "week"
      ? urlView
      : weekEmpty
        ? "season"
        : readStoredView();
  const alonePicks = weekTrends?.all_alone_picks ?? [];
  const status =
    weekRecap && !weekRecap.week_complete
      ? `${weekRecap.games_final} of ${weekRecap.games_total} games final`
      : undefined;

  const youCard = user ? (
    <YouThisWeekCard
      user={user}
      alone={alonePicks.filter((p) => String(p.user_id) === user.id)}
      gameResults={gameResults}
    />
  ) : undefined;

  const seasonLink = (
    <Button
      size="small"
      onClick={(e) => handleViewChange(e, "season")}
      sx={{ minHeight: 44, px: 1, ml: -1 }}
    >
      See the season so far
    </Button>
  );

  const weekView = (
    <Stack spacing={4}>
      <WeekRecapSection
        title="Recap"
        status={status}
        items={weekItems}
        lead={youCard}
        selectedUserId={userId}
        empty={
          <Box>
            <Typography variant="body2" sx={{ color: "text.secondary" }}>
              {hasConsensus
                ? "The recap fills in as games finish."
                : "Nothing to show yet. The pool's picks show up here once games kick off, and the recap fills in as they finish."}
            </Typography>
            {seasonLink}
          </Box>
        }
      />

      {weekFailed && !weekTrends ? (
        <LoadFailed what={`week ${week}'s pick trends`} />
      ) : !weekTrends ? (
        <LoadingRows label={`Loading week ${week} pick trends`} />
      ) : (
        hasConsensus && (
          <Grid container spacing={{ xs: 4, md: 3 }}>
            <Grid component="section" size={{ xs: 12, md: 7 }}>
              <SectionHeading note="Most lopsided game first. The more-picked side is on the right.">
                How the pool split
              </SectionHeading>
              <ConsensusCard trends={weekTrends} gameResults={gameResults} />
            </Grid>
            <Grid component="section" size={{ xs: 12, md: 5 }}>
              <SectionHeading note="Picks nobody else in the pool made.">
                Only one on a team
              </SectionHeading>
              {alonePicks.length > 0 ? (
                <AllAloneCard
                  allAlonePicks={alonePicks}
                  gameResults={gameResults}
                  selectedUserId={userId}
                />
              ) : (
                <Typography variant="body2" sx={{ color: "text.secondary" }}>
                  Nobody went it alone this week.
                </Typography>
              )}
            </Grid>
          </Grid>
        )
      )}
    </Stack>
  );

  const seasonView = (
    <Stack spacing={4}>
      {seasonItems.length > 0 && (
        <WeekRecapSection
          title="Season so far"
          status={weekRecap ? `Through week ${weekRecap.week}` : undefined}
          items={seasonItems}
          selectedUserId={userId}
        />
      )}

      {((weekRecap?.series.pool_accuracy.length ?? 0) > 0 ||
        (weekRecap?.series.chaos.length ?? 0) > 0) && (
        <Box component="section">
          <SectionHeading>Week by week</SectionHeading>
          <SeasonRecapCharts recap={weekRecap} selectedUserId={userId} />
        </Box>
      )}

      {seasonFailed && !seasonTrends ? (
        <LoadFailed what="this season's pick trends" />
      ) : !seasonTrends ? (
        <LoadingRows label="Loading season pick trends" />
      ) : (
        <Grid container spacing={{ xs: 4, md: 3 }}>
          <Grid component="section" size={{ xs: 12, lg: 7 }}>
            <SectionHeading note="Picks right: how often a pick on that team covered. Team covered: the team's own cover record, all games.">
              Teams the pool picks
            </SectionHeading>
            <SeasonTeamTable
              teamPickTotals={seasonTrends.team_pick_totals}
              coldTeamsSeason={seasonTrends.cold_teams_season}
              teamAtsRecord={seasonTrends.team_ats_record}
              teamBelieversFaders={seasonTrends.team_believers_faders}
            />
          </Grid>
          <Grid component="section" size={{ xs: 12, lg: 5 }}>
            <SectionHeading note="Every pick nobody else made, newest first. 1 vs 14 means 14 took the other side.">
              Only one on a team
            </SectionHeading>
            <SeasonAllAloneCard
              allAlonePicksSeason={seasonTrends.all_alone_picks_season}
              gameResults={seasonGameResults}
              selectedUserId={userId}
            />
          </Grid>
        </Grid>
      )}
    </Stack>
  );

  return (
    <Box sx={{ textAlign: "left" }}>
      <Tabs
        value={view}
        onChange={handleViewChange}
        aria-label="Trends for this week or the season"
        sx={{ mb: 2, borderBottom: 1, borderColor: "divider" }}
      >
        <Tab value="week" label={`Week ${week}`} sx={{ minHeight: 44 }} />
        <Tab value="season" label="Season" sx={{ minHeight: 44 }} />
      </Tabs>
      {view === "week" ? weekView : seasonView}
    </Box>
  );
}
