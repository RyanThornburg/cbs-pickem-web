import { useMemo } from "react";
import { Game, GameStatus } from "../../../types";
import { formatGameDate } from "../utils/dateFormatters";

// Live games first, then not-yet-started, then final -- within each tier,
// earliest game_time first.
const STATUS_TIER: Record<GameStatus, number> = {
  [GameStatus.Inprogress]: 0,
  [GameStatus.Halftime]: 0,
  [GameStatus.Delayed]: 0,
  [GameStatus.Scheduled]: 1,
  [GameStatus.Final]: 2,
};

const compareGames = (a: Game, b: Game): number => {
  const tierDiff = STATUS_TIER[a.status] - STATUS_TIER[b.status];
  if (tierDiff !== 0) return tierDiff;
  return a.game_time - b.game_time;
};

export const useGameGroups = (games: Game[]) => {
  const { gameGroups, gameDates } = useMemo(() => {
    const groups: Record<string, Game[]> = {};

    // Group games by date
    games.forEach((game) => {
      const date = formatGameDate(game.game_time);
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(game);
    });

    // Sort each day's games: live on top, then scheduled, then final --
    // ordered by game_time within each tier.
    Object.values(groups).forEach((dayGames) => dayGames.sort(compareGames));

    // Get unique dates and sort them
    const dates = Object.keys(groups).sort(
      (a, b) => new Date(a).getTime() - new Date(b).getTime()
    );

    return { gameGroups: groups, gameDates: dates };
  }, [games]);

  return { gameGroups, gameDates };
};
