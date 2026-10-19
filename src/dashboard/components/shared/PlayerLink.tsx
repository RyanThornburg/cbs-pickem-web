import { ReactNode } from "react";
import { PlainLink, PlainLinkStyle } from "./PlainLink";

export const playerPath = (id: string) => `/players/${id}`;

// A player's name (and avatar) that opens their page.
export const PlayerLink = ({
  id,
  children,
  label,
  ...style
}: PlainLinkStyle & {
  id: string;
  children: ReactNode;
  label?: string;
}) => (
  <PlainLink to={playerPath(id)} {...style} label={label}>
    {children}
  </PlainLink>
);
