import { useMemo } from "react";
import { Box, Chip, Stack, Typography } from "@mui/material";
import { ColdTeamSeason, TeamPickTotal } from "../../types";
import { getTeamData } from "../../utils/teamAssets";
import TeamLogo from "./TeamLogo";

const TOP_N = 10;

export type Props = {
  teamPickTotals: TeamPickTotal[];
  coldTeamsSeason: ColdTeamSeason[];
};

export default function SeasonPickTotalsCard({
  teamPickTotals,
  coldTeamsSeason,
}: Props) {
  const topTeams = useMemo(
    () => teamPickTotals.slice(0, TOP_N),
    [teamPickTotals]
  );
  const maxPct = topTeams[0]?.pct_of_all_picks ?? 1;

  if (topTeams.length === 0) {
    return (
      <Typography color="text.secondary">
        No season pick data yet.
      </Typography>
    );
  }

  return (
    <Stack spacing={1.5}>
      <Stack spacing={1}>
        {topTeams.map((team) => (
          <Stack key={team.id} direction="row" alignItems="center" spacing={1}>
            <TeamLogo abbr={team.abbr} size={20} />
            <Typography variant="caption" sx={{ width: 34 }}>
              {team.abbr}
            </Typography>
            <Box
              sx={{
                flexGrow: 1,
                height: 8,
                borderRadius: 4,
                bgcolor: "action.hover",
                overflow: "hidden",
              }}
            >
              <Box
                sx={{
                  width: `${(team.pct_of_all_picks / maxPct) * 100}%`,
                  height: "100%",
                  bgcolor: `#${getTeamData(team.abbr).color}`,
                }}
              />
            </Box>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ width: 60, textAlign: "right" }}
            >
              {team.total_picks} ({Math.round(team.pct_of_all_picks * 100)}%)
            </Typography>
          </Stack>
        ))}
      </Stack>
      {coldTeamsSeason.length > 0 && (
        <Box>
          <Typography variant="caption" color="text.secondary">
            Never picked all season:
          </Typography>
          <Stack direction="row" spacing={0.5} sx={{ mt: 0.5, flexWrap: "wrap" }}>
            {coldTeamsSeason.map((team) => (
              <Chip key={team.id} size="small" variant="outlined" label={team.abbr} />
            ))}
          </Stack>
        </Box>
      )}
    </Stack>
  );
}
