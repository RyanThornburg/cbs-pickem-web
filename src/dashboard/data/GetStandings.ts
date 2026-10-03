import { fetchJson, pollJson } from "../../api/pickemApi";
import { NflStandings, TeamProfile, UserSeasonTrends } from "../types";

// Standings rewrite when a game goes final, then every 15 minutes for the
// hour after; team keys when one of the team's games changes (picks
// revealed, graded, final, line set). Neither moves with a live score.
const STANDINGS_POLL_MS = 5 * 60_000;
const TEAM_POLL_MS = 5 * 60_000;
// The pool column needs all 32 team keys (7-9 KB each), so that poll is
// slower; a single team's page keeps the 5-minute cadence.
const ALL_TEAMS_POLL_MS = 15 * 60_000;
const USER_SEASON_POLL_MS = 30 * 60_000;

export const GetStandings = (
  season: number,
  callback: (standings: NflStandings) => void,
  onError?: (error: Error) => void
) =>
  pollJson<NflStandings>(
    `/api/season/${season}/standings`,
    STANDINGS_POLL_MS,
    callback,
    (error) => {
      console.error("Failed to fetch standings", error);
      onError?.(error);
    }
  );

export const GetTeamProfile = (
  season: number,
  teamId: number,
  callback: (profile: TeamProfile) => void,
  onError?: (error: Error) => void
) =>
  pollJson<TeamProfile>(
    `/api/teams/${season}/${teamId}`,
    TEAM_POLL_MS,
    callback,
    (error) => {
      console.error("Failed to fetch team profile", error);
      onError?.(error);
    }
  );

// Every team's key, keyed by team id. A team whose key is missing is left
// out rather than failing the rest.
export const GetAllTeamProfiles = (
  season: number,
  teamIds: number[],
  callback: (profiles: Record<number, TeamProfile>) => void
) => {
  let cancelled = false;
  const load = async () => {
    const results = await Promise.allSettled(
      teamIds.map((id) => fetchJson<TeamProfile>(`/api/teams/${season}/${id}`))
    );
    const profiles: Record<number, TeamProfile> = {};
    results.forEach((result, index) => {
      if (result.status === "fulfilled")
        profiles[teamIds[index]] = result.value;
    });
    if (!cancelled) callback(profiles);
  };
  load();
  const id = setInterval(load, ALL_TEAMS_POLL_MS);
  return () => {
    cancelled = true;
    clearInterval(id);
  };
};

export const GetUserSeason = (
  userId: string,
  season: number,
  callback: (trends: UserSeasonTrends) => void,
  onError?: (error: Error) => void
) =>
  pollJson<UserSeasonTrends>(
    `/api/users/${userId}/season/${season}`,
    USER_SEASON_POLL_MS,
    callback,
    (error) => {
      console.error("Failed to fetch player season", error);
      onError?.(error);
    }
  );
