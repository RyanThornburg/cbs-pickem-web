import { useMemo } from "react";
import { Box, Chip, Stack, Tooltip, Typography } from "@mui/material";
import WhatshotIcon from "@mui/icons-material/Whatshot";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import { GameCoverResult } from "../../data/weekGames";
import { OneSidedGame, WeekTrends } from "../../types";
import { getTeamData } from "../../utils/teamAssets";
import TeamLogo from "./TeamLogo";

export type Props = {
  trends: WeekTrends;
  gameResults: Map<number, GameCoverResult>;
};

type Side = {
  id: number;
  abbr: string;
  name: string;
  pick_count: number;
  pct: number;
};

type GameConsensus = {
  game_id: number;
  leader: Side;
  trailer: Side;
  oneSided?: OneSidedGame;
};

const buildGameConsensus = (trends: WeekTrends): GameConsensus[] => {
  const byGame = new Map<number, Side[]>();

  trends.pick_popularity.forEach((p) => {
    const sides = byGame.get(p.game_id) ?? [];
    sides.push({
      id: p.id,
      abbr: p.abbr,
      name: p.name,
      pick_count: p.pick_count,
      pct: p.pct_of_game_pickers,
    });
    byGame.set(p.game_id, sides);
  });

  trends.cold_teams.forEach((c) => {
    const sides = byGame.get(c.game_id) ?? [];
    if (!sides.some((s) => s.id === c.id)) {
      sides.push({ id: c.id, abbr: c.abbr, name: c.name, pick_count: 0, pct: 0 });
    }
    byGame.set(c.game_id, sides);
  });

  const oneSidedByGame = new Map(
    trends.one_sided_games.map((g) => [g.game_id, g])
  );

  return Array.from(byGame.entries())
    .filter(([, sides]) => sides.length === 2)
    .map(([game_id, sides]) => {
      const [leader, trailer] = [...sides].sort(
        (a, b) => b.pick_count - a.pick_count
      );
      return { game_id, leader, trailer, oneSided: oneSidedByGame.get(game_id) };
    })
    .sort((a, b) => {
      if (b.leader.pick_count !== a.leader.pick_count) {
        return b.leader.pick_count - a.leader.pick_count;
      }
      return (
        b.leader.pick_count + b.trailer.pick_count -
        (a.leader.pick_count + a.trailer.pick_count)
      );
    });
};

export default function ConsensusCard({ trends, gameResults }: Props) {
  const games = useMemo(() => buildGameConsensus(trends), [trends]);

  if (games.length === 0) {
    return (
      <Typography color="text.secondary">
        No picks revealed for this week yet.
      </Typography>
    );
  }

  return (
    <Stack spacing={1.5}>
      {games.map(({ game_id, leader, trailer, oneSided }) => {
        const cover = gameResults.get(game_id);
        const trailerCovered = cover?.isFinal && cover.coveringTeamId === trailer.id;
        const leaderCovered = cover?.isFinal && cover.coveringTeamId === leader.id;
        const leaderCurrentlyCovering = cover?.coveringTeamId === leader.id;

        return (
        <Box key={game_id}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <TeamLogo abbr={trailer.abbr} size={22} />
            <Box sx={{ width: 38, lineHeight: 1.1, opacity: cover?.isFinal && !trailerCovered ? 0.5 : 1 }}>
              <Stack direction="row" alignItems="center" spacing={0.25}>
                <Typography variant="caption" component="div">
                  {trailer.abbr}
                </Typography>
                {trailerCovered && (
                  <CheckCircleOutlineIcon sx={{ fontSize: 12 }} color="success" />
                )}
              </Stack>
              <Typography variant="caption" component="div" color="text.secondary">
                {trailer.pick_count}
              </Typography>
            </Box>
            <Box
              sx={{
                flexGrow: 1,
                display: "flex",
                height: 10,
                borderRadius: 5,
                overflow: "hidden",
                bgcolor: "action.hover",
              }}
            >
              {trailer.pick_count > 0 && (
                <Tooltip title={`${trailer.name}: ${trailer.pick_count} picks`}>
                  <Box
                    sx={{
                      flexGrow: Math.max(trailer.pct, 0.02),
                      bgcolor: `#${getTeamData(trailer.abbr).color}`,
                      opacity: 0.55,
                    }}
                  />
                </Tooltip>
              )}
              <Tooltip title={`${leader.name}: ${leader.pick_count} picks`}>
                <Box
                  sx={{
                    flexGrow: Math.max(leader.pct, 0.02),
                    bgcolor: `#${getTeamData(leader.abbr).color}`,
                  }}
                />
              </Tooltip>
            </Box>
            <Box sx={{ width: 38, lineHeight: 1.1, textAlign: "right", opacity: cover?.isFinal && !leaderCovered ? 0.5 : 1 }}>
              <Stack direction="row" alignItems="center" justifyContent="flex-end" spacing={0.25}>
                {leaderCovered && (
                  <CheckCircleOutlineIcon sx={{ fontSize: 12 }} color="success" />
                )}
                <Typography variant="caption" component="div">
                  {leader.abbr}
                </Typography>
              </Stack>
              <Typography variant="caption" component="div" color="text.secondary">
                {leader.pick_count}
              </Typography>
            </Box>
            <TeamLogo abbr={leader.abbr} size={22} />
            <Box sx={{ width: 64, display: "flex", justifyContent: "flex-end" }}>
              {oneSided ? (
                <Tooltip
                  title={`${Math.round(oneSided.consensus_pct * 100)}% consensus`}
                >
                  <Chip
                    size="small"
                    color={leaderCurrentlyCovering ? "success" : "error"}
                    variant="outlined"
                    icon={<WhatshotIcon />}
                    label={`${Math.round(leader.pct * 100)}%`}
                  />
                </Tooltip>
              ) : (
                <Typography variant="caption" color="text.secondary">
                  {Math.round(leader.pct * 100)}%
                </Typography>
              )}
            </Box>
          </Stack>
        </Box>
        );
      })}
    </Stack>
  );
}
