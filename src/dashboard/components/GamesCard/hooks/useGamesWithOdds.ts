import { useEffect, useState } from "react";
import { GameWithOdds, GetGamesTabData } from "../../../data/GetGamesTabData";
import { useCurrentWeek } from "../../CurrentWeekContext";

export const useGamesWithOdds = (week: number) => {
  const { season } = useCurrentWeek();
  const [games, setGames] = useState<GameWithOdds[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (week <= 0 || season <= 0) {
      setLoading(false);
      return;
    }

    const unsubscribe = GetGamesTabData(season, week, (newGames) => {
      setGames(newGames);
      setLoading(false);
    });

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [week, season]);

  return { games, loading };
};
