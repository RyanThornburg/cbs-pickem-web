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
  // When the shown scores were fetched, and whether the latest refresh
  // after that failed (the scores on screen are then older than a poll).
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);
  const [refreshFailed, setRefreshFailed] = useState(false);
  const loadedRef = useRef(false);
  // Bumped by "Try now", which restarts the poll at once.
  const [attempt, setAttempt] = useState(0);

  // A new week starts from scratch, so the old week's scores never sit
  // under the new week's number while it loads.
  useEffect(() => {
    setGames([]);
    setFailed(false);
    setUpdatedAt(null);
    setRefreshFailed(false);
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
        setUpdatedAt(new Date());
        setRefreshFailed(false);
      },
      () => {
        if (!loadedRef.current) {
          setFailed(true);
          setLoading(false);
        } else {
          setRefreshFailed(true);
        }
      }
    );
  }, [week, season, active, attempt]);

  const retry = () => {
    setFailed(false);
    setLoading(!loadedRef.current);
    setAttempt((n) => n + 1);
  };

  return { games, loading, failed, updatedAt, refreshFailed, retry };
};
