import { Box } from "@mui/material";
import { getTeamLogoSrc } from "../../utils/teamAssets";

export type Props = {
  abbr: string;
  size?: number;
};

export default function TeamLogo({ abbr, size = 24 }: Props) {
  const src = getTeamLogoSrc(abbr);
  if (!src) return null;

  return (
    <Box
      component="img"
      src={src}
      alt={abbr}
      sx={{ width: size, height: size, objectFit: "contain", flexShrink: 0 }}
    />
  );
}
