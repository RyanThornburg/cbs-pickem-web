import { SxProps, Theme } from "@mui/material/styles";
import { ReactNode } from "react";
import { PlainLink } from "./PlainLink";

export const playerPath = (id: string) => `/players/${id}`;

// A player's name (and avatar) that opens their page.
export const PlayerLink = ({
  id,
  children,
  sx,
  label,
}: {
  id: string;
  children: ReactNode;
  sx?: SxProps<Theme>;
  label?: string;
}) => (
  <PlainLink to={playerPath(id)} sx={sx} label={label}>
    {children}
  </PlainLink>
);
