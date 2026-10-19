import { CSSProperties } from "react";
import styles from "./Skeleton.module.css";

// A loading placeholder (MUI's Skeleton). `animate` false once a load has
// failed, so the page stops pretending it's on its way.
export function Skeleton({
  variant = "text",
  width,
  height,
  animate = true,
  className,
  style,
}: {
  variant?: "text" | "circular" | "rounded";
  width?: number | string;
  height?: number | string;
  animate?: boolean;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <span
      aria-hidden
      className={[
        styles.skeleton,
        styles[variant],
        animate && styles.pulse,
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      style={{ width, height, ...style }}
    />
  );
}
