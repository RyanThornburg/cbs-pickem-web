import { Alert, CircularProgress } from "@mui/material";
import dayjs from "dayjs";
import { useMemo } from "react";
import { byeTeams } from "../../data/weekGames";
import { ByeTeams } from "../ByeTeams";
import { WeekRecap } from "../../types";
import { coverStreaksByTeamId } from "../Recap/recapBadges";
import "./gamesCard.css";
import GamesListMobile from "./GamesListMobile";
import GamesTableDesktop from "./GamesTableDesktop";
import { useGamesWithOdds } from "./hooks/useGamesWithOdds";

type Props = {
  week: number;
  // This week's recap, for the cover-streak labels next to teams.
  recap?: WeekRecap;
};

export default function GamesCard({ week, recap }: Props) {
  const streaks = useMemo(() => coverStreaksByTeamId(recap), [recap]);
  const { games, loading, failed, oddsAvailable, oddsUpdatedAt } =
    useGamesWithOdds(week);

  if (loading) {
    return <CircularProgress aria-label={`Loading week ${week} games`} />;
  }

  if (failed) {
    return (
      <Alert severity="error">
        Couldn't load week {week}'s games. This page tries again every 5
        minutes, or reload to try now.
      </Alert>
    );
  }

  return (
    <div className="games-card">
      {oddsAvailable &&
        oddsUpdatedAt &&
        dayjs(oddsUpdatedAt).isValid() &&
        games.length > 0 && (
          <p className="gc-oddstime">
            Odds updated{" "}
            <time dateTime={oddsUpdatedAt}>
              {dayjs(oddsUpdatedAt).format("ddd, MMM D, h:mm A")}
            </time>
          </p>
        )}
      {!oddsAvailable && games.length > 0 && (
        <Alert severity="warning" sx={{ mb: 1.5 }}>
          Week {week} odds aren't in yet. Vegas lines, O/U and books will show
          up when they are.
        </Alert>
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
}
