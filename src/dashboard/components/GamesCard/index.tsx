import dayjs from "dayjs";
import { formatUpdated } from "../../utils/updatedTime";
import { memo, useMemo } from "react";
import { byeTeams } from "../../data/weekGames";
import { ByeTeams } from "../ByeTeams";
import { WeekRecap } from "../../types";
import { coverStreaksByTeamId } from "../Recap/recapBadges";
import "./gamesCard.css";
import styles from "./GamesCard.module.css";
import GamesListMobile from "./GamesListMobile";
import GamesTableDesktop from "./GamesTableDesktop";
import { useGamesWithOdds } from "./hooks/useGamesWithOdds";
import TabIntro from "../TabIntro";
import TabSkeleton from "../TabSkeleton";
import LoadError from "../shared/LoadError";

// MUI's warning Alert icon (ReportProblemOutlined), which ui/Icon doesn't
// carry: a triangle with an exclamation mark.
const WarningIcon = () => (
  <svg
    viewBox="0 0 24 24"
    focusable="false"
    aria-hidden
    width="1em"
    height="1em"
    fill="currentColor"
  >
    <path d="M12 5.99L19.53 19H4.47L12 5.99M12 2L1 21h22L12 2zm1 14h-2v2h2v-2zm0-6h-2v4h2v-4z" />
  </svg>
);

type Props = {
  week: number;
  // This week's recap, for the cover-streak labels next to teams.
  recap?: WeekRecap;
  // The NFL tab's view switch, on the intro row.
  viewSwitch?: React.ReactNode;
};

// Memoized: it stays mounted while other tabs are shown, and MainGrid passes
// it stable props, so a tab switch doesn't re-render it.
const GamesCard = memo(function GamesCard({ week, recap, viewSwitch }: Props) {
  const streaks = useMemo(() => coverStreaksByTeamId(recap), [recap]);
  const { games, loading, failed, oddsAvailable, oddsUpdatedAt, retry } =
    useGamesWithOdds(week);

  const intro = (meta?: React.ReactNode) => (
    <TabIntro title="Games" week={week} meta={meta} actions={viewSwitch} />
  );

  if (loading) {
    return (
      <>
        {intro()}
        <TabSkeleton shape="cards" label={`Loading week ${week} games`} />
      </>
    );
  }

  if (failed) {
    return (
      <>
        {intro()}
        <LoadError
          title={`Couldn't load week ${week}'s games.`}
          detail="Trying again every 5 minutes."
          onRetry={retry}
        />
      </>
    );
  }

  const showOddsTime =
    oddsAvailable &&
    oddsUpdatedAt &&
    dayjs(oddsUpdatedAt).isValid() &&
    games.length > 0;

  return (
    <div className="games-card">
      {intro(
        showOddsTime && (
          <>
            Odds updated{" "}
            <time dateTime={oddsUpdatedAt}>{formatUpdated(oddsUpdatedAt)}</time>
          </>
        )
      )}
      {!oddsAvailable && games.length > 0 && (
        <div role="alert" className={styles.alert}>
          <div className={styles.alertIcon}>
            <WarningIcon />
          </div>
          <div className={styles.alertMessage}>
            Week {week} odds aren't in yet. Vegas lines, O/U and books will show
            up when they are.
          </div>
        </div>
      )}
      <div className="gc-desktop-view">
        <GamesTableDesktop games={games} streaks={streaks} />
      </div>
      <div className="gc-mobile-view">
        <GamesListMobile games={games} streaks={streaks} />
      </div>
      <ByeTeams teams={byeTeams(games)} />
    </div>
  );
});

export default GamesCard;
