import { getTeamData } from "../utils/teamAssets";
import { TeamLink } from "./shared/TeamLink";
import { TeamLogo } from "./shared/TeamLogo";
import styles from "./ByeTeams.module.css";

// "On bye" box at the bottom of Games and Scoreboard. Renders nothing in a
// week where every team plays.
export const ByeTeams = ({ teams }: { teams: string[] }) => {
  if (!teams.length) return null;
  return (
    <div className={styles.box}>
      <span className={styles.heading}>
        On bye · {teams.length} {teams.length === 1 ? "team" : "teams"}
      </span>
      <div className={styles.teams}>
        {teams.map((abbr) => (
          <TeamLink key={abbr} abbr={abbr} className={styles.team}>
            <TeamLogo abbr={abbr} size={22} decorative />
            <span className={styles.abbr}>{abbr}</span>
            <span className={styles.name}>{getTeamData(abbr).name}</span>
          </TeamLink>
        ))}
      </div>
    </div>
  );
};
