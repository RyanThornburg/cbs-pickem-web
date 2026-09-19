import { fetchJson, poll } from "../../api/pickemApi";
import {
  AllAlonePick,
  ColdTeam,
  LineMover,
  OneSidedGame,
  TeamPickCount,
  WeekTrends,
} from "../types";

const POLL_INTERVAL_MS = 5 * 60_000;

// The Worker's /trends response still uses the data repo's original field name.
interface ApiWeekTrends {
  week: number;
  updated_at: string;
  pick_popularity: TeamPickCount[];
  cold_teams: ColdTeam[];
  one_sided_games: OneSidedGame[];
  all_alone: AllAlonePick[];
  spread_movers: LineMover[];
}

const toWeekTrends = (data: ApiWeekTrends): WeekTrends => ({
  week: data.week,
  updated_at: data.updated_at,
  pick_popularity: data.pick_popularity,
  cold_teams: data.cold_teams,
  one_sided_games: data.one_sided_games,
  all_alone_picks: data.all_alone,
  spread_movers: data.spread_movers,
});

const EMPTY_TRENDS: WeekTrends = {
  week: 0,
  updated_at: "",
  pick_popularity: [],
  cold_teams: [],
  one_sided_games: [],
  all_alone_picks: [],
  spread_movers: [],
};

export const GetTrendsByWeek = (
  season: number,
  week: number,
  callback: (trends: WeekTrends) => void
) => {
  if (season === 0 || week === 0) {
    callback(EMPTY_TRENDS);
    return;
  }

  let cancelled = false;

  const stop = poll(() => {
    fetchJson<ApiWeekTrends>(`/api/weeks/${season}/${week}/trends`)
      .then((data) => {
        if (!cancelled) callback(toWeekTrends(data));
      })
      .catch((error) => {
        if (!cancelled) console.error("Failed to fetch week trends", error);
      });
  }, POLL_INTERVAL_MS);

  return () => {
    cancelled = true;
    stop();
  };
};
