import { fetchJson, poll } from "../../api/pickemApi";
import {
  ColdTeamSeason,
  SeasonAllAlonePick,
  SeasonTrends,
  TeamAtsRecord,
  TeamPickTotal,
} from "../types";

const POLL_INTERVAL_MS = 30 * 60_000;

// The Worker's /trends response still uses the data repo's original field name.
interface ApiSeasonTrends {
  season: number;
  updated_at: string;
  team_pick_totals: TeamPickTotal[];
  cold_teams_season: ColdTeamSeason[];
  team_ats_record: TeamAtsRecord[];
  all_alone_season: SeasonAllAlonePick[];
}

const toSeasonTrends = (data: ApiSeasonTrends): SeasonTrends => ({
  season: data.season,
  updated_at: data.updated_at,
  team_pick_totals: data.team_pick_totals,
  cold_teams_season: data.cold_teams_season,
  team_ats_record: data.team_ats_record,
  all_alone_picks_season: data.all_alone_season,
});

const EMPTY_TRENDS: SeasonTrends = {
  season: 0,
  updated_at: "",
  team_pick_totals: [],
  cold_teams_season: [],
  team_ats_record: [],
  all_alone_picks_season: [],
};

export const GetSeasonTrends = (
  season: number,
  callback: (trends: SeasonTrends) => void
) => {
  if (season === 0) {
    callback(EMPTY_TRENDS);
    return;
  }

  let cancelled = false;

  const stop = poll(() => {
    fetchJson<ApiSeasonTrends>(`/api/season/${season}/trends`)
      .then((data) => {
        if (!cancelled) callback(toSeasonTrends(data));
      })
      .catch((error) => {
        if (!cancelled) console.error("Failed to fetch season trends", error);
      });
  }, POLL_INTERVAL_MS);

  return () => {
    cancelled = true;
    stop();
  };
};
