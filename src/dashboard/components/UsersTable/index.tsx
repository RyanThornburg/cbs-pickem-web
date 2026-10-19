import { memo, useEffect, useState } from "react";
import UserDataGrid from "./UserDataGrid";
import UserDataMobile from "./UserDataMobile";
import { UserGridProps } from "./types";
import { UserSeasonTrends } from "../../types";
import { GetUserSeasonTrends } from "../../data/GetUserSeasonTrends";
import { RefreshFailedLine, StandingsPlaceholder } from "./StandingsStatus";
import { PinnedPlayerRow } from "./PinnedPlayerRow";
import styles from "./index.module.css";

// Memoized: it stays mounted while other tabs are shown, and MainGrid passes
// it stable props, so a tab switch doesn't re-render the whole table.
const UsersTable = memo(function UsersTable(props: UserGridProps) {
  const {
    userList,
    season,
    userId,
    week,
    leaderboardStatus,
    onRetryLeaderboard,
    moneyStandings,
  } = props;
  const [trends, setTrends] = useState<Record<string, UserSeasonTrends>>({});

  // Sorted, joined into one string so the effect only re-runs when the set
  // of user ids actually changes (not on every userList poll tick, which
  // returns a new array reference each time even when membership is the
  // same) -- season trends don't change week to week the way picks do.
  const userIdsKey = [...userList.map((user) => user.id)].sort().join(",");

  useEffect(() => {
    if (!userIdsKey) return undefined;
    const userIds = userIdsKey.split(",");
    const unsubscribe = GetUserSeasonTrends(userIds, season, setTrends);
    return unsubscribe;
  }, [userIdsKey, season]);

  const gridProps = { ...props, trends };

  if (userList.length === 0) {
    return (
      <StandingsPlaceholder
        week={week}
        leaderboardStatus={leaderboardStatus}
        onRetry={onRetryLeaderboard}
      />
    );
  }

  return (
    <>
      <RefreshFailedLine
        leaderboardStatus={leaderboardStatus}
        onRetry={onRetryLeaderboard}
      />
      <div id="gridUser" className={styles.desktop}>
        <UserDataGrid {...gridProps} />
      </div>
      <div className={styles.phone}>
        <UserDataMobile {...gridProps} />
      </div>
      <PinnedPlayerRow
        user={userList.find((user) => user.id === userId)}
        standings={moneyStandings}
      />
    </>
  );
});

export default UsersTable;
