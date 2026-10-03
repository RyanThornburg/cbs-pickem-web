import { useEffect, useState } from "react";
import {
  GetAllTeamProfiles,
  GetStandings,
  GetTeamProfile,
} from "../../data/GetStandings";
import { NflStandings, TeamProfile } from "../../types";

// Standings feed the Standings view, every team page (the abbreviation in
// the URL resolves to a team id through them) and the player page's team
// grid, so the last copy is kept for the next page that asks.
const standingsCache = new Map<number, NflStandings>();
const profilesCache = new Map<string, TeamProfile>();
const allProfilesCache = new Map<number, Record<number, TeamProfile>>();

// `standings` is undefined until the first load; `failed` once a load
// fails with nothing to show.
export function useStandings(season: number, enabled = true) {
  const [standings, setStandings] = useState<NflStandings | undefined>(() =>
    standingsCache.get(season)
  );
  const [failed, setFailed] = useState(false);
  // Bumped by "Try now", which restarts the poll at once.
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!enabled || season <= 0) return undefined;
    setStandings(standingsCache.get(season));
    setFailed(false);
    return GetStandings(
      season,
      (data) => {
        standingsCache.set(season, data);
        setStandings(data);
        setFailed(false);
      },
      () => setFailed(true)
    );
  }, [season, enabled, attempt]);

  return { standings, failed, retry: () => setAttempt((n) => n + 1) };
}

export function useTeamProfile(season: number, teamId: number | undefined) {
  const key = `${season}:${teamId}`;
  const [profile, setProfile] = useState<TeamProfile | undefined>(() =>
    profilesCache.get(key)
  );
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (season <= 0 || teamId === undefined) return undefined;
    setProfile(profilesCache.get(key));
    setFailed(false);
    return GetTeamProfile(
      season,
      teamId,
      (data) => {
        profilesCache.set(key, data);
        setProfile(data);
        setFailed(false);
      },
      () => setFailed(true)
    );
  }, [season, teamId, key, attempt]);

  return { profile, failed, retry: () => setAttempt((n) => n + 1) };
}

// All 32 team keys, for the standings' pool column. Empty until loaded.
export function useAllTeamProfiles(season: number, teamIds: number[]) {
  const [profiles, setProfiles] = useState<Record<number, TeamProfile>>(
    () => allProfilesCache.get(season) ?? {}
  );
  const idsKey = teamIds.join(",");

  useEffect(() => {
    if (season <= 0 || !idsKey) return undefined;
    return GetAllTeamProfiles(season, idsKey.split(",").map(Number), (data) => {
      allProfilesCache.set(season, data);
      setProfiles(data);
    });
  }, [season, idsKey]);

  return profiles;
}
