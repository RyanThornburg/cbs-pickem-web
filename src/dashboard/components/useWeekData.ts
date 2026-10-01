import { useEffect, useState } from "react";

import { GetIsAdmin } from "../data/GetAdminStatus";
import { GetGameDataByWeek } from "../data/GetGameDataByWeek";
import { GetRecapByWeek } from "../data/GetRecapByWeek";
import { GetUserByWeek } from "../data/GetUserByWeek";
import { GetUserSeasonTrends } from "../data/GetUserSeasonTrends";
import { GameStatus, RankedUser, UserSeasonTrends, WeekRecap } from "../types";

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
// every tab), the recap (strip plus in-context badges) and whether any game
// is live (the Scoreboard tab's dot).
export function useWeekData(season: number, week: number) {
  const [userList, setUserList] = useState<RankedUser[]>([]);
  const [leaderboardStatus, setLeaderboardStatus] = useState<LeaderboardStatus>(
    { updatedAt: null, failed: false }
  );
  const [recap, setRecap] = useState<WeekRecap | undefined>(undefined);
  const [hasLiveGame, setHasLiveGame] = useState(false);

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
      return GetRecapByWeek(season, week, setRecap);
    }
  }, [season, week]);

  useEffect(() => {
    if (season > 0 && week > 0) {
      return GetGameDataByWeek(season, week, (games) => {
        setHasLiveGame(
          games.some((game) => LIVE_STATUSES.includes(game.status))
        );
      });
    }
  }, [season, week]);

  return { userList, leaderboardStatus, recap, hasLiveGame };
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

// Season streak badge + weekly hot/cold icon on the selected-user header --
// just the one user, not the whole roster like UsersTable's fetch.
export function useSelectedUserTrends(season: number, user: string) {
  const [trends, setTrends] = useState<UserSeasonTrends | undefined>(undefined);

  useEffect(() => {
    if (season > 0 && user) {
      return GetUserSeasonTrends([user], season, (all) => setTrends(all[user]));
    }
    setTrends(undefined);
  }, [season, user]);

  return trends;
}

// Only decides whether the Admin tab is shown -- the Worker enforces access
// on every /api/admin/* request regardless of what the UI renders.
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
