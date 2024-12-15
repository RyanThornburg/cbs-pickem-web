import { useMemo } from "react";
import { Game } from "../../../types";
import { formatGameDate } from "../utils/dateFormatters";

export const useGameGroups = (games: Game[]) => {
  const { gameGroups, gameDates } = useMemo(() => {
    const groups: Record<string, Game[]> = {};

    // Group games by date
    games.forEach((game) => {
      const date = formatGameDate(game.starts_at);
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(game);
    });

    // Get unique dates and sort them
    const dates = Object.keys(groups).sort(
      (a, b) => new Date(a).getTime() - new Date(b).getTime()
    );

    return { gameGroups: groups, gameDates: dates };
  }, [games]);

  return { gameGroups, gameDates };
};
