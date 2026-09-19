import { Box, Chip, Stack, Tooltip, Typography } from "@mui/material";
import ExploreOffIcon from "@mui/icons-material/ExploreOff";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import CloseIcon from "@mui/icons-material/Close";
import { GameCoverResult } from "../../data/weekGames";
import { AllAlonePick } from "../../types";
import UserAvatar from "../UserAvatar";
import TeamLogo from "./TeamLogo";

export type Props = {
  allAlonePicks: AllAlonePick[];
  gameResults: Map<number, GameCoverResult>;
};

export default function AllAloneCard({ allAlonePicks, gameResults }: Props) {
  if (allAlonePicks.length === 0) {
    return (
      <Typography color="text.secondary">
        Nobody's going against the crowd this week.
      </Typography>
    );
  }

  return (
    <Stack spacing={1}>
      {allAlonePicks.map((pick) => {
        const cover = gameResults.get(pick.game_id);
        const covered = cover?.isFinal && cover.coveringTeamId === pick.picked_team_id;

        return (
          <Stack
            key={`${pick.game_id}-${pick.user_id}`}
            direction="row"
            alignItems="center"
            spacing={1.5}
            sx={{
              p: 1,
              borderRadius: 1,
              border: "1px solid",
              borderColor: "divider",
            }}
          >
            <UserAvatar
              userName={pick.name}
              userId={String(pick.user_id)}
              includeName={false}
              size={28}
            />
            <Box sx={{ flexGrow: 1 }}>
              <Typography variant="body2">{pick.name}</Typography>
              <Stack direction="row" alignItems="center" spacing={0.5}>
                <TeamLogo abbr={pick.abbr} size={18} />
                <Typography variant="caption" color="text.secondary">
                  alone on {pick.abbr}
                </Typography>
              </Stack>
            </Box>
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
