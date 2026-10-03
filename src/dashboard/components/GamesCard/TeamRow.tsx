import { GameWithOdds } from "../../data/GetGamesTabData";
import { getTeamData } from "../../utils/teamAssets";
import { TeamLink } from "../shared/TeamLink";
import { TeamLogo } from "../shared/TeamLogo";
import { formatRecord } from "./gamesCardUtils";

// One team in a Games matchup, desktop table and phone card alike: the same
// logo + abbreviation + nickname mark the Scoreboard and Trends use.
export default function TeamRow({
  team,
  score,
  covered,
}: {
  team: GameWithOdds["home_team"];
  score?: number;
  covered?: boolean;
}) {
  const data = getTeamData(team.abbr);
  return (
    <div className="gc-mrow">
      <TeamLink abbr={team.abbr} sx={{ gap: "inherit", flex: "0 1 auto" }}>
        <TeamLogo abbr={team.abbr} size={20} decorative />
        <span className="gc-abbr">{team.abbr}</span>
        <span className="gc-mname">{data.name}</span>
      </TeamLink>
      <span className="gc-rec">{formatRecord(team.record)}</span>
      {score != null && (
        <span className={`gc-final-score${covered ? " covered" : ""}`}>
          <span className="gc-score-num">{score}</span>
          {/* Always rendered, just hidden when not covering -- reserves the
              same width either way so the number itself stays aligned across
              rows instead of shifting left when a checkmark is present. */}
          <span className="gc-score-check" aria-hidden={!covered}>
            {covered ? "✓" : ""}
          </span>
        </span>
      )}
    </div>
  );
}
