import { AvatarProps, SxProps, Theme } from "@mui/material";

export interface UserAvatarProps extends Omit<AvatarProps, "children"> {
  userName: string | undefined;
  userId: string;
  size?: number | any;
  fontSize?: string | any;
  place?: number;
  includeName?: boolean;
  sx?: SxProps;
}

export interface UserStringProps {
  src: string;
  alt: string;
  sx: SxProps<Theme>;
}
