import { AvatarProps, Breakpoint, SxProps, Theme } from "@mui/material";

// A plain sx value or a per-breakpoint one, e.g. { xs: 18, sm: 20 }.
type SxSize = number | string | Partial<Record<Breakpoint, number | string>>;

export interface UserAvatarProps extends Omit<AvatarProps, "children"> {
  userName: string | undefined;
  userId: string;
  size?: SxSize;
  fontSize?: SxSize;
  place?: number;
  includeName?: boolean;
  sx?: SxProps;
}

export interface UserStringProps {
  src: string;
  alt: string;
  sx: SxProps<Theme>;
}
