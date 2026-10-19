import { CSSProperties, MouseEventHandler, ReactNode } from "react";
import styles from "./Chip.module.css";

export type ChipTone = "neutral" | "success" | "error" | "warning";

// A small tag (MUI's small Chip in the theme's colors). With `onClick` it's
// a button, as MUI's clickable chip was. `className` and `style` adjust it
// from the caller (Records' selected year, the roster's paid green).
export function Chip({
  label,
  tone = "neutral",
  variant = "filled",
  icon,
  onClick,
  pressed,
  className,
  labelClassName,
  style,
}: {
  label: ReactNode;
  tone?: ChipTone;
  variant?: "filled" | "outlined";
  icon?: ReactNode;
  onClick?: MouseEventHandler<HTMLButtonElement>;
  // aria-pressed, for a chip that toggles.
  pressed?: boolean;
  className?: string;
  labelClassName?: string;
  style?: CSSProperties;
}) {
  const classes = [
    styles.chip,
    styles[tone],
    variant === "outlined" && styles.outlined,
    onClick && styles.clickable,
    className,
  ]
    .filter(Boolean)
    .join(" ");
  const content = (
    <>
      {icon && <span className={styles.icon}>{icon}</span>}
      <span
        className={[styles.label, labelClassName].filter(Boolean).join(" ")}
      >
        {label}
      </span>
    </>
  );
  return onClick ? (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={pressed}
      className={classes}
      style={style}
    >
      {content}
    </button>
  ) : (
    <span className={classes} style={style}>
      {content}
    </span>
  );
}
