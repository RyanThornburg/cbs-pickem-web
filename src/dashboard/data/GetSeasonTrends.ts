import { fetchJson, poll } from "../../api/pickemApi";
import {
  ColdTeamSeason,
  GroupTrapTeam,
  SeasonAllAlonePick,
  SeasonTrends,
  TeamAtsRecord,
  TeamBelieversFaders,
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
  trap_team: GroupTrapTeam[];
  team_believers_faders: TeamBelieversFaders[];
  all_alone_season: SeasonAllAlonePick[];
}

const toSeasonTrends = (data: ApiSeasonTrends): SeasonTrends => ({
  season: data.season,
  updated_at: data.updated_at,
  team_pick_totals: data.team_pick_totals,
  cold_teams_season: data.cold_teams_season,
  team_ats_record: data.team_ats_record,
  // Renamed from public_enemy 2026-09-23; defensive fallback since the
  // season:*:trends writer hadn't picked up the rename yet as of that same
  // day (confirmed live: user:*:season:* had trap_team, season:*:trends
  // still had the old public_enemy key) -- drop this once confirmed caught up.
  trap_team: data.trap_team ?? [],
  team_believers_faders: data.team_believers_faders,
  all_alone_picks_season: data.all_alone_season,
});

const EMPTY_TRENDS: SeasonTrends = {
  season: 0,
  updated_at: "",
  team_pick_totals: [],
  cold_teams_season: [],
  team_ats_record: [],
  trap_team: [],
  team_believers_faders: [],
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
