import { useEffect, useRef, useState } from "react";
import { GameWithOdds, GetGamesTabData } from "../../../data/GetGamesTabData";
import { useCurrentWeek } from "../../CurrentWeekContext";
import { useTabActive } from "../../tabLinks";

export const useGamesWithOdds = (week: number) => {
  const { season } = useCurrentWeek();
  const active = useTabActive();
  const [games, setGames] = useState<GameWithOdds[]>([]);
  const [loading, setLoading] = useState(true);
  const [oddsAvailable, setOddsAvailable] = useState(true);
  const [oddsUpdatedAt, setOddsUpdatedAt] = useState<string | null>(null);
  // Only a failure with nothing loaded yet: once a week has loaded, a failed
  // refresh keeps showing the last good data and the next poll retries.
  const [failed, setFailed] = useState(false);
  const loadedRef = useRef(false);
  // Bumped by "Try now", which restarts the poll at once.
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    // A new week starts from scratch, so the previous week's games never sit
    // under the new week's number while it loads (or if it fails).
    setGames([]);
    setOddsUpdatedAt(null);
    setFailed(false);

    if (week <= 0 || season <= 0) {
      setLoading(false);
      return;
    }
    setLoading(true);
    loadedRef.current = false;
  }, [week, season]);

  // Polls only while Games is on screen; showing it again refreshes at once.
  useEffect(() => {
    if (!active || week <= 0 || season <= 0) return;
    const unsubscribe = GetGamesTabData(
      season,
      week,
      (newGames, hasOdds, updatedAt) => {
        loadedRef.current = true;
        setGames(newGames);
        setOddsAvailable(hasOdds);
        setOddsUpdatedAt(updatedAt);
        setFailed(false);
        setLoading(false);
      },
      () => {
        if (!loadedRef.current) {
          setFailed(true);
          setLoading(false);
        }
      }
    );

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [week, season, active, attempt]);

  const retry = () => {
    setFailed(false);
    setLoading(true);
    setAttempt((n) => n + 1);
  };

  return { games, loading, failed, oddsAvailable, oddsUpdatedAt, retry };
};
