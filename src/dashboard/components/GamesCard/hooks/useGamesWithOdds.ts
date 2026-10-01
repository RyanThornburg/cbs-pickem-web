import { useEffect, useState } from "react";
import { GameWithOdds, GetGamesTabData } from "../../../data/GetGamesTabData";
import { useCurrentWeek } from "../../CurrentWeekContext";

export const useGamesWithOdds = (week: number) => {
  const { season } = useCurrentWeek();
  const [games, setGames] = useState<GameWithOdds[]>([]);
  const [loading, setLoading] = useState(true);
  const [oddsAvailable, setOddsAvailable] = useState(true);
  const [oddsUpdatedAt, setOddsUpdatedAt] = useState<string | null>(null);
  // Only a failure with nothing loaded yet: once a week has loaded, a failed
  // refresh keeps showing the last good data and the next poll retries.
  const [failed, setFailed] = useState(false);

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

    let loaded = false;
    const unsubscribe = GetGamesTabData(
      season,
      week,
      (newGames, hasOdds, updatedAt) => {
        loaded = true;
        setGames(newGames);
        setOddsAvailable(hasOdds);
        setOddsUpdatedAt(updatedAt);
        setFailed(false);
        setLoading(false);
      },
      () => {
        if (!loaded) {
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
  }, [week, season]);

  return { games, loading, failed, oddsAvailable, oddsUpdatedAt };
};
