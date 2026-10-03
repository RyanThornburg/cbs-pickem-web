import { SxProps, Theme } from "@mui/material/styles";
import { ReactNode } from "react";
import { teamPath } from "../Nfl/nflView";
import { PlainLink } from "./PlainLink";

// A team mark (logo, abbreviation, nickname) that opens the team's page.
export const TeamLink = ({
  abbr,
  children,
  sx,
}: {
  abbr: string;
  children: ReactNode;
  sx?: SxProps<Theme>;
}) => (
  <PlainLink to={teamPath(abbr)} sx={sx}>
    {children}
  </PlainLink>
);
