import { useEffect, useState } from "react";

import { GetIsAdmin } from "../data/GetAdminStatus";
import { GetGameDataByWeek } from "../data/GetGameDataByWeek";
import { GetRecapByWeek } from "../data/GetRecapByWeek";
import { GetUserByWeek } from "../data/GetUserByWeek";
import { withoutThinWeekStats } from "./Recap/recapUtils";
import { GameStatus, RankedUser, WeekRecap } from "../types";

const LIVE_STATUSES = [
  GameStatus.Inprogress,
  GameStatus.Halftime,
  GameStatus.Delayed,
];

// How the browsed week's leaderboard poll is going, for User Picks' loading,
// error and "Updated" states. `updatedAt` is null until the first success.
export interface LeaderboardStatus {
  updatedAt: Date | null;
  failed: boolean;
}

// Everything MainGrid polls for the browsed week: the leaderboard (shared by
// every tab), the recap (strip plus in-context badges), whether any game is
// live (the Scoreboard tab's dot) and whether every game is final (how many
// weeks are left to catch the money).
export function useWeekData(season: number, week: number) {
  const [userList, setUserList] = useState<RankedUser[]>([]);
  const [leaderboardStatus, setLeaderboardStatus] = useState<LeaderboardStatus>(
    { updatedAt: null, failed: false }
  );
  const [recap, setRecap] = useState<WeekRecap | undefined>(undefined);
  const [hasLiveGame, setHasLiveGame] = useState(false);
  // Whether the games poll has answered yet (or failed), so the NFL tab can
  // wait for it before choosing between Games and Live.
  const [liveKnown, setLiveKnown] = useState(false);
  const [weekComplete, setWeekComplete] = useState(false);

  // Switching weeks clears the old week first, so its standings never sit
  // under the new week's number while the new ones load. A failed poll
  // keeps the last good standings and only flags the failure.
  useEffect(() => {
    setUserList([]);
    setLeaderboardStatus({ updatedAt: null, failed: false });
    if (season > 0 && week > 0) {
      return GetUserByWeek(
        season,
        week,
        (users) => {
          setUserList(users);
          setLeaderboardStatus({ updatedAt: new Date(), failed: false });
        },
        () => setLeaderboardStatus((status) => ({ ...status, failed: true }))
      );
    }
  }, [season, week]);

  useEffect(() => {
    setRecap(undefined);
    if (season > 0 && week > 0) {
      return GetRecapByWeek(season, week, (data) =>
        setRecap(data && withoutThinWeekStats(data))
      );
    }
  }, [season, week]);

  useEffect(() => {
    setWeekComplete(false);
    setLiveKnown(false);
    if (season > 0 && week > 0) {
      return GetGameDataByWeek(
        season,
        week,
        (games) => {
          setHasLiveGame(
            games.some((game) => LIVE_STATUSES.includes(game.status))
          );
          setWeekComplete(
            games.length > 0 &&
              games.every((game) => game.status === GameStatus.Final)
          );
          setLiveKnown(true);
        },
        () => setLiveKnown(true)
      );
    }
  }, [season, week]);

  return {
    userList,
    leaderboardStatus,
    recap,
    hasLiveGame,
    liveKnown,
    weekComplete,
  };
}

// The selected user, persisted to localStorage under "user". Cleared if the
// stored id isn't in the browsed week's roster.
export function useSelectedUser(userList: RankedUser[]) {
  const [user, setUser] = useState<string>("");

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    setUser(
      storedUser && userList.some((u) => u.id === storedUser) ? storedUser : ""
    );
  }, [userList]);

  const onUserChange = (userId: string) => {
    localStorage.setItem("user", userId);
    setUser(userId);
  };

  return [user, onUserChange] as const;
}

export function useIsAdmin() {
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    let cancelled = false;
    GetIsAdmin().then((admin) => {
      if (!cancelled) setIsAdmin(admin);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return isAdmin;
}
