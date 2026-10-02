import Box from "@mui/material/Box";
import { getTeamLogoSrc } from "../../utils/teamAssets";
import { getTeamData } from "../Scoreboard/utils/teamData";

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
      <Box
        component="img"
        src={src}
        alt={decorative ? "" : abbr}
        sx={{ width: size, height: size, flexShrink: 0, objectFit: "contain" }}
      />
    );
  }
  return (
    <Box
      aria-label={decorative ? undefined : abbr}
      aria-hidden={decorative || undefined}
      sx={{
        width: size,
        height: size,
        borderRadius: "50%",
        flexShrink: 0,
        bgcolor: `#${color}`,
        color: "#fff",
        display: "grid",
        placeItems: "center",
        fontSize: size * 0.34,
        fontWeight: 700,
      }}
    >
      {abbr}
    </Box>
  );
};
