import { useEffect, useState } from "react";
import { GetWeekBooks } from "../../../data/GetGamesTabData";
import { modeTotal } from "../../GamesCard/gamesCardUtils";
import { useCurrentWeek } from "../../CurrentWeekContext";
import { useTabActive } from "../../tabLinks";

// Each game's O/U, the same consensus figure the Games tab shows. Empty
// until the week's odds key exists.
export const useWeekTotals = (week: number) => {
  const { season } = useCurrentWeek();
  const [totals, setTotals] = useState<Map<number, number>>(new Map());
  const active = useTabActive();

  useEffect(() => {
    setTotals(new Map());
  }, [week, season]);

  useEffect(() => {
    if (!active || week <= 0 || season <= 0) return;
    return GetWeekBooks(season, week, (booksByGameId) => {
      const next = new Map<number, number>();
      booksByGameId.forEach((books, gameId) => {
        const total = modeTotal(books);
        if (total != null) next.set(gameId, total);
      });
      setTotals(next);
    });
  }, [week, season, active]);

  return totals;
};
