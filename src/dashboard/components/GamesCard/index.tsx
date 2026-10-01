import { Alert, CircularProgress } from "@mui/material";
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
  const { games, loading, oddsAvailable } = useGamesWithOdds(week);

  if (loading) {
    return <CircularProgress />;
  }

  return (
    <div className="games-card">
      {!oddsAvailable && games.length > 0 && (
        <Alert severity="warning" sx={{ mb: 1.5 }}>
          Odds unavailable for week {week} right now. Games, CBS lines and
          weather still show; the Vegas line, O/U and books will fill in once
          the odds update.
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
