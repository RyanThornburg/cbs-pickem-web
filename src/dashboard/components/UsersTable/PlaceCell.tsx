import Looks3Icon from "@mui/icons-material/Looks3";
import LooksOneIcon from "@mui/icons-material/LooksOne";
import LooksTwoIcon from "@mui/icons-material/LooksTwo";
import Looks4 from "@mui/icons-material/Looks4";
import Looks5 from "@mui/icons-material/Looks5";
import Typography from "@mui/material/Typography";

// Numbered icons for the top 5 (the overall paid places); ranks past 5th are
// a plain number.
const iconLookup = {
  1: <LooksOneIcon color="success" fontSize="small" />,
  2: <LooksTwoIcon color="primary" fontSize="small" />,
  3: <Looks3Icon color="secondary" fontSize="small" />,
  4: <Looks4 color="warning" fontSize="small" />,
  5: <Looks5 color="error" fontSize="small" />,
} as const;

export function PlaceCell({ place }: { place: number | null | undefined }) {
  if (place == null) return null;
  if (place in iconLookup) {
    return iconLookup[place as keyof typeof iconLookup];
  }
  return <Typography variant="body2">{place}</Typography>;
}
