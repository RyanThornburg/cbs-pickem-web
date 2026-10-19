import { ReactNode } from "react";
import { teamPath } from "../Nfl/nflView";
import { PlainLink, PlainLinkStyle } from "./PlainLink";

// A team mark (logo, abbreviation, nickname) that opens the team's page.
export const TeamLink = ({
  abbr,
  children,
  ...style
}: PlainLinkStyle & {
  abbr: string;
  children: ReactNode;
}) => (
  <PlainLink to={teamPath(abbr)} {...style}>
    {children}
  </PlainLink>
);
