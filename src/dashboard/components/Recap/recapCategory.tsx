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

// One icon + color per item category. An unknown category (the data repo
// can add one) falls back to a neutral lightbulb.
const CATEGORY_STYLES: Record<string, { Icon: SvgIconComponent; color: string; label: string }> = {
  pool: { Icon: GroupsIcon, color: "hsl(210, 90%, 45%)", label: "The pool" },
  spread: { Icon: ShowChartIcon, color: "hsl(265, 55%, 50%)", label: "The spread" },
  crowd: { Icon: Diversity3Icon, color: "hsl(185, 65%, 34%)", label: "The crowd" },
  chaos: { Icon: BoltIcon, color: "hsl(12, 80%, 50%)", label: "Chaos" },
  users: { Icon: PersonIcon, color: "hsl(145, 55%, 35%)", label: "Players" },
  teams: { Icon: ShieldIcon, color: "hsl(35, 85%, 40%)", label: "Teams" },
  league: { Icon: PublicIcon, color: "hsl(200, 30%, 40%)", label: "League" },
  splits: { Icon: PieChartIcon, color: "hsl(220, 25%, 45%)", label: "Pool splits" },
};
const FALLBACK = { Icon: LightbulbIcon, color: "hsl(220, 20%, 55%)", label: "Recap" };

export const categoryStyle = (category: string) => CATEGORY_STYLES[category] ?? FALLBACK;

export function CategoryMark({ category, size = 22 }: { category: string; size?: number }) {
  const { Icon, color, label } = categoryStyle(category);
  return (
    <Box
      component="span"
      role="img"
      aria-label={label}
      sx={{
        width: size,
        height: size,
        borderRadius: 1.5,
        bgcolor: color,
        color: "#fff",
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
        fontSize: "0.65rem",
        fontWeight: 700,
        letterSpacing: "0.06em",
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
