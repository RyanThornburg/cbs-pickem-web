import { useMemo } from "react";
import { Stack, Typography } from "@mui/material";
import { TeamBelieversFaders } from "../../types";
import TeamLogo from "./TeamLogo";

export type Props = {
  teamBelieversFaders: TeamBelieversFaders[];
};

const pct = (n: number): string => `${Math.round(n * 100)}%`;

// Requires real picks on both sides -- a team with e.g. 1 believer and 0
// faders has nothing to actually diverge on, and the accuracy shown for an
// empty side wouldn't mean anything.
const hasBothSides = (team: TeamBelieversFaders): boolean =>
  team.believers.pick_count > 0 && team.faders.pick_count > 0;

export default function SeasonBelieversFadersCard({ teamBelieversFaders }: Props) {
  const ranked = useMemo(
    () =>
      teamBelieversFaders
        .filter(hasBothSides)
        .sort(
          (a, b) =>
            Math.abs(b.believers.accuracy - b.faders.accuracy) -
            Math.abs(a.believers.accuracy - a.faders.accuracy)
        ),
    [teamBelieversFaders]
  );

  if (ranked.length === 0) {
    return (
      <Typography color="text.secondary">
        Not enough picks split both ways yet this season.
      </Typography>
    );
  }

  return (
    <Stack spacing={1}>
      {ranked.map((team) => (
        <Stack key={team.id} direction="row" alignItems="center" spacing={1}>
          <TeamLogo abbr={team.abbr} size={20} />
          <Typography variant="body2" sx={{ width: 40 }}>
            {team.abbr}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Believers {team.believers.pick_count} ({pct(team.believers.accuracy)}) &middot; Faders{" "}
            {team.faders.pick_count} ({pct(team.faders.accuracy)})
          </Typography>
        </Stack>
      ))}
    </Stack>
  );
}
