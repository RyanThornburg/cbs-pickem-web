import PlaceIcon from "@mui/icons-material/Place";
import PublicIcon from "@mui/icons-material/Public";
import { Stadium } from "../../types";
import { getVenueBadge } from "../../utils/venue";

type Props = {
  stadium?: Stadium;
  neutralSite?: boolean;
};

export default function VenueBadge({ stadium, neutralSite }: Props) {
  const badge = getVenueBadge(stadium, neutralSite);
  if (!badge) return null;

  const isInternational = badge.kind === "international";
  return (
    <span
      className="gc-venuebadge"
      title={`${isInternational ? "International" : "Neutral-site"} game${stadium?.name ? ` at ${stadium.name}` : ""}`}
    >
      {isInternational ? <PublicIcon fontSize="inherit" /> : <PlaceIcon fontSize="inherit" />}
      {badge.label}
    </span>
  );
}
