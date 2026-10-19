import { memo, useMemo, useState } from "react";
import { useGameData } from "./hooks/useGameData";
import { useWeekTotals } from "./hooks/useWeekTotals";
import { byeTeams } from "../../data/weekGames";
import { ByeTeams } from "../ByeTeams";
import {
  groupGames,
  isLiveStatus,
  pickDeadline,
  picksRevealed,
} from "./utils/scoreboardUtils";
import { UpdatedNote } from "./components/UpdatedNote";
import { GameCard } from "./components/GameCard";
import { GameRow } from "./components/GameRow";
import { YourPicksStrip } from "./components/YourPicksStrip";
import { Game, WeekRecap } from "../../types";
import { gameTagsById } from "../Recap/recapBadges";
import TabIntro from "../TabIntro";
import TabSkeleton from "../TabSkeleton";
import LoadError from "../shared/LoadError";
import { SegmentedControl } from "../../ui/SegmentedControl";
import { Icon } from "../../ui/Icon";
import styles from "./Scoreboard.module.css";

type Layout = "full" | "compact";
const LAYOUT_KEY = "scoreboardLayout";

const readLayout = (): Layout => {
  try {
    return localStorage.getItem(LAYOUT_KEY) === "compact" ? "compact" : "full";
  } catch {
    return "full";
  }
};

interface Props {
  week: number;
  // Selected user -- drives "Your pick" badges and highlights
  userId?: string;
  totalUsers?: number;
  // This week's recap, for the "Upset of the week" / "Won, didn't cover" tags.
  recap?: WeekRecap;
  // The NFL tab's view switch, first on the intro row.
  viewSwitch?: React.ReactNode;
}

const GroupHeader = ({ children }: { children: string }) => (
  <h3 className={styles.groupHeader}>{children}</h3>
);

const Scoreboard = memo((props: Props) => {
  const { week, userId, totalUsers, recap, viewSwitch } = props;
  const gameTags = useMemo(() => gameTagsById(recap), [recap]);
  const { games, loading, failed, updatedAt, refreshFailed, retry } =
    useGameData(week);
  const deadline = useMemo(() => pickDeadline(games), [games]);
  const totals = useWeekTotals(week);
  const byes = useMemo(() => byeTeams(games), [games]);
  const [layout, setLayout] = useState<Layout>(readLayout);

  const changeLayout = (next: Layout) => {
    setLayout(next);
    try {
      localStorage.setItem(LAYOUT_KEY, next);
    } catch {
      // storage blocked -- layout just won't persist
    }
  };

  const intro = (actions?: React.ReactNode) => (
    <TabIntro
      title="Live"
      week={week}
      actions={
        viewSwitch || actions ? (
          <>
            {viewSwitch}
            {actions}
          </>
        ) : undefined
      }
      meta={
        <UpdatedNote
          updatedAt={updatedAt}
          refreshFailed={refreshFailed}
          onRetry={retry}
          live={games.some((game) => isLiveStatus(game.status))}
        />
      }
    />
  );
  if (loading) {
    return (
      <>
        {intro()}
        <TabSkeleton shape="cards" label={`Loading week ${week} scores`} />
      </>
    );
  }
  if (failed) {
    return (
      <>
        {intro()}
        <LoadError
          title={`Couldn't load week ${week}'s scores.`}
          detail="Trying again every minute."
          onRetry={retry}
        />
      </>
    );
  }
  if (!games.length) {
    return (
      <>
        {intro()}
        <div className={styles.empty}>No games scheduled for week {week}.</div>
      </>
    );
  }

  const groups = groupGames(games);
  // Re-checked on every games poll (once a minute), which is plenty for a
  // kickoff or the Sunday deadline.
  const now = Date.now();

  // Icons only on phones, so the switch fits on the NFL switch's row
  // instead of taking a row of its own; the labels name them.
  const controls = (
    <SegmentedControl
      value={layout}
      onChange={changeLayout}
      label="Live layout"
      segments={[
        {
          value: "full",
          label: "Full cards",
          children: (
            <>
              <Icon
                name="ViewModule"
                size="small"
                className={styles.layoutIcon}
              />
              <span className={styles.layoutLabel}>Full</span>
            </>
          ),
        },
        {
          value: "compact",
          label: "Compact list",
          children: (
            <>
              <Icon
                name="ViewList"
                size="small"
                className={styles.layoutIcon}
              />
              <span className={styles.layoutLabel}>Compact</span>
            </>
          ),
        },
      ]}
    />
  );

  const row = (game: Game) => (
    <GameRow
      key={game.game_id}
      game={game}
      userId={userId}
      tags={gameTags.get(game.game_id)}
      picksRevealed={picksRevealed(game, deadline, now)}
      total={totals.get(game.game_id)}
    />
  );

  // The layout controls sit on the tab's intro row, like every tab's own
  // controls.
  return (
    <>
      {intro(controls)}
      <div
        id={`gameWeek-${week}`}
        className={`${styles.games} ${layout === "full" ? styles.gamesFull : styles.gamesCompact}`}
      >
        <YourPicksStrip games={games} userId={userId} />
        {layout === "full" ? (
          groups.map(({ group, games }) => (
            <div key={group} className={styles.group}>
              <div className={styles.groupHead}>
                <GroupHeader>{group}</GroupHeader>
              </div>
              {/* Upcoming games are rows even in Full: before kickoff a card
                  has nothing a row doesn't (its linescore is all dashes), and
                  15 empty cards buried the one result between game days. */}
              {group === "Upcoming" ? (
                <div className={styles.list}>{games.map(row)}</div>
              ) : (
                <div className={styles.cards}>
                  {games.map((game) => (
                    <div key={game.game_id} className={styles.cardCell}>
                      <GameCard
                        game={game}
                        userId={userId}
                        totalUsers={totalUsers}
                        tags={gameTags.get(game.game_id)}
                        picksRevealed={picksRevealed(game, deadline, now)}
                        total={totals.get(game.game_id)}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))
        ) : (
          <div className={styles.list}>
            {groups.map(({ group, games }) => (
              <div key={group}>
                <div className={styles.listHead}>
                  <GroupHeader>{group}</GroupHeader>
                </div>
                {games.map(row)}
              </div>
            ))}
          </div>
        )}
        <ByeTeams teams={byes} />
      </div>
    </>
  );
});

Scoreboard.displayName = "Scoreboard";

export default Scoreboard;
