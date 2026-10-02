import { Box, Stack, Typography } from "@mui/material";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutlined";
import CloseIcon from "@mui/icons-material/Close";
import { GameCoverResult } from "../../data/weekGames";
import { AllAlonePick } from "../../types";
import UserAvatar from "../UserAvatar";
import { TeamLogo } from "../shared/TeamLogo";

export type Props = {
  allAlonePicks: AllAlonePick[];
  gameResults: Map<number, GameCoverResult>;
  selectedUserId?: string;
};

// The selected player's row, as on User Picks (DESIGN.md selected-lime).
export const selectedRowSx = { bgcolor: "#f0f4c3" } as const;

// Final-game result for a pick: a drawn icon plus its word for screen
// readers, so it doesn't rest on color alone.
export function CoverResultIcon({ covered }: { covered: boolean }) {
  return covered ? (
    <CheckCircleOutlineIcon
      fontSize="small"
      color="success"
      titleAccess="Covered"
    />
  ) : (
    <CloseIcon fontSize="small" color="error" titleAccess="Didn't cover" />
  );
}

export default function AllAloneCard({
  allAlonePicks,
  gameResults,
  selectedUserId,
}: Props) {
  if (allAlonePicks.length === 0) return null;

  return (
    <Stack spacing={1}>
      {allAlonePicks.map((pick) => {
        const cover = gameResults.get(pick.game_id);
        const covered =
          cover?.isFinal && cover.coveringTeamId === pick.picked_team_id;
        const you = String(pick.user_id) === selectedUserId;

        return (
          <Stack
            key={`${pick.game_id}-${pick.user_id}`}
            direction="row"
            spacing={1.5}
            sx={{
              alignItems: "center",
              p: 1,
              borderRadius: 1,
              border: "1px solid",
              borderColor: "divider",
              ...(you ? selectedRowSx : {}),
            }}
          >
            <UserAvatar
              userName={pick.name}
              userId={String(pick.user_id)}
              includeName={false}
              size={28}
            />
            <Box sx={{ flexGrow: 1, minWidth: 0 }}>
              <Typography variant="body2" noWrap sx={{ fontWeight: 600 }}>
                {pick.name}
                {you && " (you)"}
              </Typography>
              <Stack
                direction="row"
                spacing={0.5}
                sx={{ alignItems: "center" }}
              >
                <TeamLogo abbr={pick.abbr} size={18} />
                <Typography variant="caption" sx={{ color: "text.secondary" }}>
                  Only one on {pick.abbr} · {pick.opposing_count} took the other
                  side
                </Typography>
              </Stack>
            </Box>
            {cover?.isFinal && <CoverResultIcon covered={!!covered} />}
          </Stack>
        );
      })}
    </Stack>
  );
}
