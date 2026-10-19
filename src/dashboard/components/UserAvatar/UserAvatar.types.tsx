import { CSSProperties } from "react";

type Breakpoint = "xs" | "sm" | "md" | "lg" | "xl";

// A plain size or a per-breakpoint one, e.g. { xs: 18, sm: 20 }.
type Size = number | string | Partial<Record<Breakpoint, number | string>>;

export interface UserAvatarProps {
  userName: string | undefined;
  userId: string;
  size?: Size;
  fontSize?: Size;
  place?: number;
  includeName?: boolean;
  // On the avatar itself, as MUI's Avatar took them.
  className?: string;
  style?: CSSProperties;
}

export interface UserStringProps {
  src: string;
  alt: string;
}
