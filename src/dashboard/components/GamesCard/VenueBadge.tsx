import { Stadium } from "../../types";
import { getVenueBadge } from "../../utils/venue";
import { Icon } from "../../ui/Icon";

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
      <Icon name={isInternational ? "Public" : "Place"} size="inherit" />
      {badge.label}
    </span>
  );
}
