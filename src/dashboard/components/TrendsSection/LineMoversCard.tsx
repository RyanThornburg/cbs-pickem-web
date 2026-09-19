import { Stack, Tooltip, Typography } from "@mui/material";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import { GameCoverResult } from "../../data/weekGames";
import { LineMover } from "../../types";
import TeamLogo from "./TeamLogo";

export type Props = {
  lineMovers: LineMover[];
  gameResults: Map<number, GameCoverResult>;
};

const formatSpread = (spread: number): string =>
  spread > 0 ? `+${spread}` : `${spread}`;

export default function LineMoversCard({ lineMovers, gameResults }: Props) {
  if (lineMovers.length === 0) {
    return (
      <Typography color="text.secondary">
        No line movement to report this week.
      </Typography>
    );
  }

  return (
    <Stack spacing={1}>
      {lineMovers.map((mover) => {
        const Arrow = mover.movement < 0 ? ArrowDownwardIcon : ArrowUpwardIcon;
        const arrowColor = mover.movement < 0 ? "error.main" : "success.main";
        const cover = gameResults.get(mover.game_id);
        const homeCovered = cover?.isFinal && cover.coveringTeamId === mover.home_team.id;
        const awayCovered = cover?.isFinal && cover.coveringTeamId === mover.away_team.id;

        return (
          <Stack
            key={mover.game_id}
            direction="row"
            alignItems="center"
            spacing={1}
          >
            <TeamLogo abbr={mover.away_team.abbr} size={20} />
            <Typography
              variant="body2"
              sx={{ opacity: cover?.isFinal && !awayCovered ? 0.5 : 1 }}
            >
              {mover.away_team.abbr}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              @
            </Typography>
            <Typography
              variant="body2"
              sx={{ opacity: cover?.isFinal && !homeCovered ? 0.5 : 1 }}
            >
              {mover.home_team.abbr}
            </Typography>
            {cover?.isFinal && (
              <Tooltip
                title={`${homeCovered ? mover.home_team.abbr : mover.away_team.abbr} covered`}
              >
                <CheckCircleOutlineIcon sx={{ fontSize: 16 }} color="success" />
              </Tooltip>
            )}
            <TeamLogo abbr={mover.home_team.abbr} size={20} />
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ flexGrow: 1, textAlign: "right" }}
            >
              {formatSpread(mover.open)} → {formatSpread(mover.close)}
              {` (${mover.home_team.abbr})`}
            </Typography>
            <Tooltip title={`${mover.book_count} books tracked`}>
              <Stack direction="row" alignItems="center" spacing={0.25}>
                <Arrow sx={{ fontSize: 16, color: arrowColor }} />
                <Typography variant="body2" sx={{ color: arrowColor }}>
                  {Math.abs(mover.movement).toFixed(1)}
                </Typography>
              </Stack>
            </Tooltip>
          </Stack>
        );
      })}
    </Stack>
  );
}
