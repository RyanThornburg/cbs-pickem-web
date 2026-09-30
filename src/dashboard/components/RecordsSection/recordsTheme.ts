import { FinishTier } from "./recordsUtils";

// Same gold as DefendingChampionBadge's trophy.
export const GOLD = "#d4a017";

// Highlight for the selected user's rows. Opaque-looking over the paper
// background (layered, not a translucent bgcolor) so pinned sticky cells
// don't show the scrolled content through them.
export const YOU_TINT = "hsla(210, 98%, 48%, 0.08)";
export const youRowSx = {
  backgroundColor: "background.paper",
  backgroundImage: `linear-gradient(${YOU_TINT}, ${YOU_TINT})`,
} as const;

// Finishes grid: gold for a title, then brand blues fading with rank.
export const FINISH_TIER_COLORS: Record<
  FinishTier,
  { bg: string; fg: string }
> = {
  1: { bg: "hsl(43, 92%, 55%)", fg: "hsl(35, 80%, 15%)" },
  2: { bg: "hsl(210, 98%, 38%)", fg: "#fff" },
  3: { bg: "hsl(210, 90%, 58%)", fg: "#fff" },
  4: { bg: "hsl(210, 85%, 78%)", fg: "hsl(210, 80%, 20%)" },
  5: { bg: "hsl(210, 60%, 91%)", fg: "hsl(210, 40%, 35%)" },
};

export const FINISH_TIER_LABELS: Record<FinishTier, string> = {
  1: "Champion",
  2: "2nd–3rd",
  3: "4th–5th",
  4: "6th–10th",
  5: "11th+",
};

// Diagonal hatch for 2015/2016 columns, which are missing players.
export const INCOMPLETE_HATCH =
  "repeating-linear-gradient(135deg, transparent 0 5px, hsl(220, 30%, 94%) 5px 7px)";
