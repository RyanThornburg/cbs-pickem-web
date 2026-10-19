import { createElement, CSSProperties } from "react";
import { ICONS, IconName } from "./iconData";

export type { IconName };

// MUI SvgIcon's sizes: 24px by default, 20px small, 35px large, or the
// surrounding font size.
const SIZES = {
  small: "1.25rem",
  medium: "1.5rem",
  large: "2.1875rem",
  inherit: "inherit",
} as const;

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
  size?: keyof typeof SIZES;
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
      className={className}
      style={{
        width: "1em",
        height: "1em",
        display: "inline-block",
        flexShrink: 0,
        fill: "currentColor",
        userSelect: "none",
        fontSize: SIZES[size],
        ...style,
      }}
    >
      {label && <title>{label}</title>}
      {ICONS[name].map(([tag, attrs], i) =>
        createElement(tag, { key: i, ...attrs })
      )}
    </svg>
  );
}
