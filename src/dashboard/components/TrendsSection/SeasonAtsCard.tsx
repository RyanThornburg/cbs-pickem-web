import { useMemo } from "react";
import { Chip, Stack, Typography } from "@mui/material";
import { TeamAtsRecord } from "../../types";
import TeamLogo from "./TeamLogo";

export type Props = {
  teamAtsRecord: TeamAtsRecord[];
};

const chipColor = (pct: number): "success" | "error" | "default" => {
  if (pct >= 0.55) return "success";
  if (pct <= 0.45) return "error";
  return "default";
};

export default function SeasonAtsCard({ teamAtsRecord }: Props) {
  const ranked = useMemo(
    () =>
      teamAtsRecord
        .filter((t) => t.covers + t.pushes + t.losses > 0)
        .sort((a, b) => b.cover_pct - a.cover_pct),
    [teamAtsRecord]
  );

  if (ranked.length === 0) {
    return (
      <Typography color="text.secondary">
        No ATS results yet this season.
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
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ flexGrow: 1 }}
          >
            {team.covers}-{team.losses}
            {team.pushes > 0 ? `-${team.pushes}` : ""} ATS
          </Typography>
          <Chip
            size="small"
            variant="outlined"
            color={chipColor(team.cover_pct)}
            label={`${Math.round(team.cover_pct * 100)}%`}
          />
        </Stack>
      ))}
    </Stack>
  );
}
