import { Stadium } from "../types";

export type VenueBadgeKind = "international" | "neutral";

export interface VenueBadgeInfo {
  kind: VenueBadgeKind;
  label: string;
}

// Country wins on its own, flag or not -- KV entries written before the data
// repo added `neutral_site` don't carry it at all (e.g. 2026 weeks 1-2), and
// an international game is off-site by definition. The flag is what catches
// a domestic relocation (weather/wildfire), which is otherwise
// indistinguishable from any other USA stadium. Missing flag = unknown, so
// no badge rather than a guess.
export const getVenueBadge = (
  stadium?: Stadium,
  neutralSite?: boolean
): VenueBadgeInfo | null => {
  if (stadium?.country && stadium.country !== "USA") {
    return {
      kind: "international",
      label: stadium.city ? `${stadium.city}, ${stadium.country}` : stadium.country,
    };
  }
  if (neutralSite === true) {
    const place = [stadium?.city, stadium?.state].filter(Boolean).join(", ");
    return { kind: "neutral", label: place ? `Neutral site · ${place}` : "Neutral site" };
  }
  return null;
};
