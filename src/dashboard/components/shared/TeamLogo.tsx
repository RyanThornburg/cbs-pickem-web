import { getTeamLogoSrc } from "../../utils/teamAssets";
import { getTeamData } from "../Scoreboard/utils/teamData";
import styles from "./TeamLogo.module.css";

interface Props {
  abbr: string;
  size?: number;
  // Set when the abbreviation is printed right beside the logo, so a screen
  // reader doesn't say it twice.
  decorative?: boolean;
}

// The one team mark used on every tab: the logo, or a team-color disc with
// the abbreviation if a logo is ever missing.
export const TeamLogo = ({ abbr, size = 28, decorative = false }: Props) => {
  const { color } = getTeamData(abbr);
  const src = getTeamLogoSrc(abbr);
  if (src) {
    return (
      <img
        src={src}
        alt={decorative ? "" : abbr}
        className={styles.logo}
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <div
      aria-label={decorative ? undefined : abbr}
      aria-hidden={decorative || undefined}
      className={styles.disc}
      style={{
        width: size,
        height: size,
        backgroundColor: `#${color}`,
        fontSize: size * 0.34,
      }}
    >
      {abbr}
    </div>
  );
};
