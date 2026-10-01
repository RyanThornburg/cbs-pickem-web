import { useMemo, useState } from "react";
import { Box, Button, Stack, Typography } from "@mui/material";
import { GameCoverResult } from "../../data/weekGames";
import { SeasonAllAlonePick } from "../../types";
import UserAvatar from "../UserAvatar";
import { CoverResultIcon, selectedRowSx } from "./AllAloneCard";
import TeamLogo from "./TeamLogo";

export type Props = {
  allAlonePicksSeason: SeasonAllAlonePick[];
  gameResults: Map<string, GameCoverResult>;
  selectedUserId?: string;
};

// Newest first; the latest few, with the rest one tap away (no scroll box
// inside the page).
const INITIAL_ROWS = 5;

export default function SeasonAllAloneCard({
  allAlonePicksSeason,
  gameResults,
  selectedUserId,
}: Props) {
  const [showAll, setShowAll] = useState(false);
  const sorted = useMemo(
    () =>
      [...allAlonePicksSeason].sort((a, b) => b.week_number - a.week_number),
    [allAlonePicksSeason]
  );

  if (sorted.length === 0) {
    return (
      <Typography variant="body2" sx={{ color: "text.secondary" }}>
        Nobody has been the only one on a team yet this season.
      </Typography>
    );
  }

  const rows = showAll ? sorted : sorted.slice(0, INITIAL_ROWS);

  return (
    <Box>
      <Stack spacing={0.5}>
        {rows.map((pick) => {
          const cover = gameResults.get(`${pick.week_number}:${pick.game_id}`);
          const covered =
            cover?.isFinal && cover.coveringTeamId === pick.picked_team_id;
          const you = String(pick.user_id) === selectedUserId;

          return (
            <Stack
              key={`${pick.week_number}-${pick.game_id}-${pick.user_id}`}
              direction="row"
              spacing={1.25}
              sx={{
                alignItems: "center",
                minHeight: 36,
                px: 0.75,
                borderRadius: 1,
                ...(you ? selectedRowSx : {}),
              }}
            >
              <Typography
                variant="caption"
                sx={{
                  width: 40,
                  flexShrink: 0,
                  color: "text.secondary",
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                Wk {pick.week_number}
              </Typography>
              <UserAvatar
                userName={pick.name}
                userId={String(pick.user_id)}
                includeName={false}
                size={24}
              />
              <Typography variant="body2" noWrap sx={{ flex: 1, minWidth: 0 }}>
                {pick.name}
                {you && " (you)"}
              </Typography>
              <Stack
                direction="row"
                spacing={0.5}
                sx={{ alignItems: "center", flexShrink: 0 }}
              >
                <TeamLogo abbr={pick.abbr} size={18} />
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {pick.abbr}
                </Typography>
              </Stack>
              <Typography
                variant="caption"
                sx={{
                  color: "text.secondary",
                  flexShrink: 0,
                  whiteSpace: "nowrap",
                }}
              >
                1 vs {pick.opposing_count}
              </Typography>
              <Box sx={{ width: 20, display: "flex", flexShrink: 0 }}>
                {cover?.isFinal && <CoverResultIcon covered={!!covered} />}
              </Box>
            </Stack>
          );
        })}
      </Stack>
      {sorted.length > INITIAL_ROWS && (
        <Button
          size="small"
          onClick={() => setShowAll((s) => !s)}
          aria-expanded={showAll}
          sx={{ mt: 0.5, minHeight: 44 }}
        >
          {showAll ? "Show fewer" : `Show all ${sorted.length}`}
        </Button>
      )}
    </Box>
  );
}
