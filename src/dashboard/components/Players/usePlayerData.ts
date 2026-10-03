import { useEffect, useState } from "react";
import { pollAsync } from "../../../api/pickemApi";
import { GetUserSeason } from "../../data/GetStandings";
import { loadUsersByWeek } from "../../data/GetUserByWeek";
import { RankedUser, UserSeasonTrends } from "../../types";

const seasonCache = new Map<string, UserSeasonTrends>();

// One player's season profile (user:{id}:season:{season}). `missing` once
// the key 404s (no such player this season); `failed` once any load fails
// with nothing to show, a 404 included.
export function usePlayerSeason(userId: string | undefined, season: number) {
  const key = `${userId}:${season}`;
  const [trends, setTrends] = useState<UserSeasonTrends | undefined>(() =>
    seasonCache.get(key)
  );
  const [failed, setFailed] = useState(false);
  const [missing, setMissing] = useState(false);
  // Bumped by "Try now", which restarts the poll at once.
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!userId || season <= 0) {
      setTrends(undefined);
      return undefined;
    }
    setTrends(seasonCache.get(key));
    setFailed(false);
    setMissing(false);
    return GetUserSeason(
      userId,
      season,
      (data) => {
        seasonCache.set(key, data);
        setTrends(data);
        setFailed(false);
        setMissing(false);
      },
      (error) => {
        setFailed(true);
        setMissing(/responded with 404$/.test(error.message));
      }
    );
  }, [userId, season, key, attempt]);

  return { trends, failed, missing, retry: () => setAttempt((n) => n + 1) };
}

// Past weeks barely change, so they're kept for 10 minutes across pages;
// the current week polls every minute like User Picks.
const PAST_WEEK_TTL_MS = 10 * 60_000;
const CURRENT_WEEK_POLL_MS = 60_000;
const weekCache = new Map<string, { at: number; users: RankedUser[] }>();

const loadWeek = async (season: number, week: number, fresh: boolean) => {
  const key = `${season}:${week}`;
  const hit = weekCache.get(key);
  if (!fresh && hit && Date.now() - hit.at < PAST_WEEK_TTL_MS) return hit.users;
  const users = await loadUsersByWeek(season, week);
  weekCache.set(key, { at: Date.now(), users });
  return users;
};

// Every week's standings and picks, 1 through the current week, for the
// player page's week-by-week list. A week that fails to load is left out.
export function useSeasonWeeks(season: number, currentWeek: number) {
  const [weeks, setWeeks] = useState<Map<number, RankedUser[]>>(new Map());
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (season <= 0 || currentWeek <= 0) return undefined;
    setLoaded(false);
    setFailed(false);
    const pastWeeks = Array.from({ length: currentWeek - 1 }, (_, i) => i + 1);
    let cancelled = false;
    Promise.allSettled(pastWeeks.map((w) => loadWeek(season, w, false))).then(
      (results) => {
        if (cancelled) return;
        setWeeks((previous) => {
          const next = new Map(previous);
          results.forEach((result, i) => {
            if (result.status === "fulfilled")
              next.set(pastWeeks[i], result.value);
          });
          return next;
        });
      }
    );
    const stop = pollAsync(
      () => loadWeek(season, currentWeek, true),
      CURRENT_WEEK_POLL_MS,
      (users) => {
        setWeeks((previous) => new Map(previous).set(currentWeek, users));
        setLoaded(true);
      },
      () => {
        setLoaded(true);
        setFailed(true);
      }
    );
    return () => {
      cancelled = true;
      stop();
    };
  }, [season, currentWeek]);

  return { weeks, loaded, failed };
}
