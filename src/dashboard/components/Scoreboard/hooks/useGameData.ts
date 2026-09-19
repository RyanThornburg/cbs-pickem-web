import { useState, useEffect } from "react";
import { Game } from "../../../types";
import { GetGameDataByWeek } from "../../../data/GetGameDataByWeek";
import { useCurrentWeek } from "../../CurrentWeekContext";

export const useGameData = (week: number) => {
  const { season } = useCurrentWeek();
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (week <= 0 || season <= 0) {
      setLoading(false);
      return;
    }

    try {
      const unsubscribe = GetGameDataByWeek(season, week, (newGames) => {
        setGames(newGames);
        setLoading(false);
      });

      return () => {
        if (unsubscribe) {
          unsubscribe();
        }
      };
    } catch (err) {
      setError(
        err instanceof Error ? err : new Error("Unknown error occurred")
      );
      setLoading(false);
    }
  }, [week, season]);

  return { games, loading, error };
};
