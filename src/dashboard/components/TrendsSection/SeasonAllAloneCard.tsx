import { useMemo } from "react";
import { Box, Chip, Stack, Tooltip, Typography } from "@mui/material";
import ExploreOffIcon from "@mui/icons-material/ExploreOff";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import CloseIcon from "@mui/icons-material/Close";
import { GameCoverResult } from "../../data/weekGames";
import { SeasonAllAlonePick } from "../../types";
import UserAvatar from "../UserAvatar";
import TeamLogo from "./TeamLogo";

export type Props = {
  allAlonePicksSeason: SeasonAllAlonePick[];
  gameResults: Map<string, GameCoverResult>;
};

export default function SeasonAllAloneCard({
  allAlonePicksSeason,
  gameResults,
}: Props) {
  const sorted = useMemo(
    () =>
      [...allAlonePicksSeason].sort((a, b) => b.week_number - a.week_number),
    [allAlonePicksSeason]
  );

  if (sorted.length === 0) {
    return (
      <Typography color="text.secondary">
        No all-alone picks logged this season yet.
      </Typography>
    );
  }

  return (
    <Stack spacing={1} sx={{ maxHeight: { xs: 260, lg: 560 }, overflowY: "auto" }}>
      {sorted.map((pick) => {
        const cover = gameResults.get(`${pick.week_number}:${pick.game_id}`);
        const covered = cover?.isFinal && cover.coveringTeamId === pick.picked_team_id;

        return (
          <Stack
            key={`${pick.week_number}-${pick.game_id}-${pick.user_id}`}
            direction="row"
            alignItems="center"
            spacing={1.5}
          >
            <Chip size="small" label={`Wk ${pick.week_number}`} sx={{ width: 56 }} />
            <UserAvatar
              userName={pick.name}
              userId={String(pick.user_id)}
              includeName={false}
              size={24}
            />
            <Box sx={{ flexGrow: 1 }}>
              <Typography variant="body2">{pick.name}</Typography>
            </Box>
            <TeamLogo abbr={pick.abbr} size={18} />
            {cover?.isFinal && (
              <Tooltip title={covered ? "Covered" : "Did not cover"}>
                {covered ? (
                  <CheckCircleOutlineIcon fontSize="small" color="success" />
                ) : (
                  <CloseIcon fontSize="small" color="error" />
                )}
              </Tooltip>
            )}
            <Chip
              size="small"
              variant="outlined"
              color="secondary"
              icon={<ExploreOffIcon />}
              label={`vs ${pick.opposing_count}`}
            />
          </Stack>
        );
      })}
    </Stack>
  );
}
