import BoltIcon from "@mui/icons-material/Bolt";
import Diversity3Icon from "@mui/icons-material/Diversity3";
import GroupsIcon from "@mui/icons-material/Groups";
import LightbulbIcon from "@mui/icons-material/Lightbulb";
import PersonIcon from "@mui/icons-material/Person";
import PieChartIcon from "@mui/icons-material/PieChart";
import PublicIcon from "@mui/icons-material/Public";
import ShieldIcon from "@mui/icons-material/Shield";
import ShowChartIcon from "@mui/icons-material/ShowChart";
import Box from "@mui/material/Box";
import { SvgIconComponent } from "@mui/icons-material";

// One icon per item category, all on the same neutral tile: a category
// isn't a result, so it gets no color of its own (DESIGN.md's Earned Color
// Rule). An unknown category (the data repo can add one) falls back to a
// lightbulb.
const CATEGORY_STYLES: Record<
  string,
  { Icon: SvgIconComponent; label: string }
> = {
  pool: { Icon: GroupsIcon, label: "The pool" },
  spread: {
    Icon: ShowChartIcon,
    label: "The spread",
  },
  crowd: {
    Icon: Diversity3Icon,
    label: "The crowd",
  },
  chaos: { Icon: BoltIcon, label: "Chaos" },
  users: { Icon: PersonIcon, label: "Players" },
  teams: { Icon: ShieldIcon, label: "Teams" },
  league: { Icon: PublicIcon, label: "League" },
  splits: {
    Icon: PieChartIcon,
    label: "Pool splits",
  },
};
const FALLBACK = {
  Icon: LightbulbIcon,
  label: "Recap",
};

export const categoryStyle = (category: string) =>
  CATEGORY_STYLES[category] ?? FALLBACK;

export function CategoryMark({
  category,
  size = 22,
}: {
  category: string;
  size?: number;
}) {
  const { Icon, label } = categoryStyle(category);
  return (
    <Box
      component="span"
      role="img"
      aria-label={label}
      sx={{
        width: size,
        height: size,
        borderRadius: 1.5,
        // DESIGN.md slate-100 / slate-700.
        bgcolor: "hsl(220, 30%, 94%)",
        color: "hsl(220, 20%, 25%)",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      <Icon sx={{ fontSize: size * 0.64 }} />
    </Box>
  );
}

export function ScopeTag({ scope }: { scope: "week" | "season" }) {
  const week = scope === "week";
  return (
    <Box
      component="span"
      sx={{
        fontSize: "0.75rem",
        fontWeight: 700,
        letterSpacing: "0.04em",
        textTransform: "uppercase",
        borderRadius: 0.5,
        px: 0.75,
        py: "1px",
        whiteSpace: "nowrap",
        bgcolor: week ? "hsl(210, 100%, 95%)" : "hsl(220, 30%, 94%)",
        color: week ? "primary.main" : "text.secondary",
      }}
    >
      {week ? "This week" : "Season"}
    </Box>
  );
}
