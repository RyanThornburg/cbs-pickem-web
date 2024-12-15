import { AvatarProps, SxProps } from "@mui/material";

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
  sx: SxProps;
  children: string;
}
