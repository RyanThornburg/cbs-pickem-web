import { CircularProgress } from "@mui/material";
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
  const { games, loading } = useGamesWithOdds(week);

  if (loading) {
    return <CircularProgress />;
  }

  return (
    <div className="games-card">
      <div className="gc-legend">
        <span className="gc-legend-item">
          <span className="gc-swatch danger" />
          Official weather alert
        </span>
        <span className="gc-legend-item">
          <span className="gc-swatch move" />
          Line movement — open → spread delta
        </span>
        <span className="gc-legend-item">
          <span className="gc-valuearrow good" style={{ fontSize: "0.78rem" }}>
            ▲
          </span>
          /
          <span className="gc-valuearrow bad" style={{ fontSize: "0.78rem" }}>
            ▼
          </span>
          Value arrow on CBS Line — green up = home is the value side, amber
          down = value moved to the away team
        </span>
      </div>

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
