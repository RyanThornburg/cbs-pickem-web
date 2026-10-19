import { Icon, IconName } from "../../ui/Icon";
import styles from "./recapCategory.module.css";

// One icon per item category, all on the same neutral tile: a category
// isn't a result, so it gets no color of its own (DESIGN.md's Earned Color
// Rule). An unknown category (the data repo can add one) falls back to a
// lightbulb.
const CATEGORY_STYLES: Record<string, { icon: IconName; label: string }> = {
  pool: { icon: "Groups", label: "The pool" },
  spread: {
    icon: "ShowChart",
    label: "The spread",
  },
  crowd: {
    icon: "Diversity3",
    label: "The crowd",
  },
  chaos: { icon: "Bolt", label: "Chaos" },
  users: { icon: "Person", label: "Players" },
  teams: { icon: "Shield", label: "Teams" },
  league: { icon: "Public", label: "League" },
  splits: {
    icon: "PieChart",
    label: "Pool splits",
  },
};
const FALLBACK = {
  icon: "Lightbulb" as IconName,
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
  const { icon, label } = categoryStyle(category);
  return (
    <span
      role="img"
      aria-label={label}
      className={styles.mark}
      style={{ width: size, height: size }}
    >
      <Icon name={icon} size="inherit" style={{ fontSize: size * 0.64 }} />
    </span>
  );
}

// "This week" or "Season" (the strip leaves week items untagged on a past
// week).
export function ScopeTag({ scope }: { scope: "week" | "season" }) {
  const week = scope === "week";
  return (
    <span className={`${styles.tag} ${week ? styles.week : styles.season}`}>
      {week ? "This week" : "Season"}
    </span>
  );
}
