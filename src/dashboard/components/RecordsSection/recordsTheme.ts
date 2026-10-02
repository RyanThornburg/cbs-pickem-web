import { MEDAL } from "../Leaders/medals";
import { FinishTier } from "./recordsUtils";

// Same gold as DefendingChampionBadge's trophy.
export const GOLD = "#d4a017";

// The selected user's rows: Selected Lime, as on User Picks and the leader
// cards, plus the 3px office-blue edge on the first cell. Opaque, so pinned
// sticky cells don't show the scrolled content through them.
export const YOU_FILL = "#f0f4c3";
export const youRowSx = { backgroundColor: YOU_FILL } as const;

// MUI's row hover fills the row, but the pinned name cell paints its own
// background over it; a background image shades every cell, pinned or not.
export const rowHoverSx = {
  "&:hover > *": {
    backgroundImage:
      "linear-gradient(rgba(0, 0, 0, 0.04), rgba(0, 0, 0, 0.04))",
  },
} as const;

// Finishes grid: the leader cards' gold/silver/bronze for 1st-3rd, then a
// quiet slate tile for 4th-5th, bold numbers for 6th-10th and muted ones
// below that. Blue stays out: it means "open" and "you" elsewhere.
export const FINISH_TIER_STYLE: Record<
  FinishTier,
  { bg?: string; fg: string; ring?: string; weight: number }
> = {
  1: { bg: GOLD, fg: "#3d2c05", weight: 700 },
  2: { bg: MEDAL[2].bg, fg: MEDAL[2].fg, weight: 700 },
  3: { bg: MEDAL[3].bg, fg: MEDAL[3].fg, weight: 700 },
  4: {
    bg: "hsl(220, 30%, 94%)",
    fg: "rgba(0, 0, 0, 0.87)",
    ring: "hsl(220, 20%, 82%)",
    weight: 600,
  },
  5: { fg: "rgba(0, 0, 0, 0.87)", weight: 700 },
  6: { fg: "rgba(0, 0, 0, 0.6)", weight: 400 },
};

export const FINISH_TIER_LABELS: Record<FinishTier, string> = {
  1: "Champion",
  2: "2nd",
  3: "3rd",
  4: "4th–5th",
  5: "6th–10th",
  6: "11th and below",
};

// Diagonal hatch for 2015/2016 columns, which are missing players. Drawn as
// a background image, so a row's fill (the "you" lime) still shows through.
export const INCOMPLETE_HATCH =
  "repeating-linear-gradient(135deg, transparent 0 5px, hsl(220, 30%, 90%) 5px 7px)";
