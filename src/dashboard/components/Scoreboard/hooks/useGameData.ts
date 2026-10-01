import { useState, useEffect, useRef } from "react";
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
  // Only a failure with nothing loaded yet: once the week has loaded, a
  // failed refresh keeps the last good scores and the next poll retries.
  const [failed, setFailed] = useState(false);
  const loadedRef = useRef(false);

  // A new week starts from scratch, so the old week's scores never sit
  // under the new week's number while it loads.
  useEffect(() => {
    setGames([]);
    setFailed(false);
    setLoading(week > 0 && season > 0);
    loadedRef.current = false;
  }, [week, season]);

  useEffect(() => {
    if (!active || week <= 0 || season <= 0) return;
    return GetGameDataByWeek(
      season,
      week,
      (newGames) => {
        loadedRef.current = true;
        setGames(newGames);
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
  }, [week, season, active]);

  return { games, loading, failed };
};
