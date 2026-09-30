import Box from "@mui/material/Box";
import { getTeamLogoSrc } from "../../../../utils/teamAssets";
import { getTeamData } from "../../utils/teamData";

interface Props {
  abbr: string;
  size?: number;
}

export const TeamLogo = ({ abbr, size = 28 }: Props) => {
  const { color } = getTeamData(abbr);
  const src = getTeamLogoSrc(abbr);
  if (src) {
    return (
      <Box
        component="img"
        src={src}
        alt={abbr}
        sx={{ width: size, height: size, flexShrink: 0, objectFit: "contain" }}
      />
    );
  }
  return (
    <Box
      aria-label={abbr}
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
