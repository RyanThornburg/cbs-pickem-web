import { createElement, CSSProperties } from "react";
import { ICONS, IconName } from "./iconData";
import styles from "./Icon.module.css";

export type { IconName };

// MUI SvgIcon's sizes: 24px by default, 20px small, 35px large, or the
// surrounding font size (Icon.module.css).
type Size = "small" | "medium" | "large" | "inherit";

// A Material icon without MUI (shapes in iconData.ts, from
// scripts/gen-icons.mjs). Decorative unless given a `label`, like MUI's
// SvgIcon with and without titleAccess.
export function Icon({
  name,
  size = "medium",
  label,
  className,
  style,
}: {
  name: IconName;
  size?: Size;
  label?: string;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      focusable="false"
      aria-hidden={label ? undefined : true}
      role={label ? "img" : undefined}
      className={[styles.icon, styles[size], className]
        .filter(Boolean)
        .join(" ")}
      style={style}
    >
      {label && <title>{label}</title>}
      {ICONS[name].map(([tag, attrs], i) =>
        createElement(tag, { key: i, ...attrs })
      )}
    </svg>
  );
}
