import { useState, useEffect } from "react";
import { Game } from "../../../types";
import { GetGameDataByWeek } from "../../../data/GetGameDataByWeek";
import { useCurrentWeek } from "../../CurrentWeekContext";
import { useTabActive } from "../../tabLinks";

export const useGameData = (week: number) => {
  const { season } = useCurrentWeek();
  // Polls only while the Scoreboard is on screen (MainGrid has its own
  // games poll for the tab's live dot).
  const active = useTabActive();
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (week <= 0 || season <= 0) {
      setLoading(false);
      return;
    }
    if (!active) return;

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
  }, [week, season, active]);

  return { games, loading, error };
};
