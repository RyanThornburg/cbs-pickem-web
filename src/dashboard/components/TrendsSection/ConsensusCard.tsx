import { useMemo } from "react";
import { Box, Stack, Tooltip, Typography } from "@mui/material";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutlined";
import { GameCoverResult } from "../../data/weekGames";
import { OneSidedGame, WeekTrends } from "../../types";
import { TeamLogo } from "../shared/TeamLogo";

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
      sides.push({
        id: c.id,
        abbr: c.abbr,
        name: c.name,
        pick_count: 0,
        pct: 0,
      });
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
      return {
        game_id,
        leader,
        trailer,
        oneSided: oneSidedByGame.get(game_id),
      };
    })
    .sort((a, b) => {
      if (b.leader.pick_count !== a.leader.pick_count) {
        return b.leader.pick_count - a.leader.pick_count;
      }
      return (
        b.leader.pick_count +
        b.trailer.pick_count -
        (a.leader.pick_count + a.trailer.pick_count)
      );
    });
};

// One row per game: the less-picked side on the left, the more-picked side
// on the right, a neutral bar between them (darker for the bigger side;
// red, green and team colors would read as a result), and the bigger
// side's share of the pool on the far right (bold when the data calls it a
// one-sided game). Once a game is final the side that covered gets a ✓ and
// the other fades.
export default function ConsensusCard({ trends, gameResults }: Props) {
  const games = useMemo(() => buildGameConsensus(trends), [trends]);

  if (games.length === 0) return null;

  return (
    <Stack spacing={1.5}>
      {games.map(({ game_id, leader, trailer, oneSided }) => {
        const cover = gameResults.get(game_id);
        const trailerCovered =
          cover?.isFinal && cover.coveringTeamId === trailer.id;
        const leaderCovered =
          cover?.isFinal && cover.coveringTeamId === leader.id;
        const leaderCurrentlyCovering = cover?.coveringTeamId === leader.id;
        // Bold tracks the live cover (and stays on once final); the checkmark
        // and fade only apply once the result is locked in.
        const trailerCurrentlyCovering = cover?.coveringTeamId === trailer.id;

        return (
          <Box key={game_id}>
            <Stack
              direction="row"
              spacing={1}
              sx={{
                alignItems: "center",
              }}
            >
              <TeamLogo abbr={trailer.abbr} size={22} />
              <Box
                sx={{
                  width: 38,
                  lineHeight: 1.1,
                  opacity: cover?.isFinal && !trailerCovered ? 0.5 : 1,
                }}
              >
                <Stack
                  direction="row"
                  spacing={0.25}
                  sx={{
                    alignItems: "center",
                  }}
                >
                  <Typography
                    variant="caption"
                    component="div"
                    sx={{
                      fontWeight: trailerCurrentlyCovering ? 700 : undefined,
                    }}
                  >
                    {trailer.abbr}
                  </Typography>
                  {trailerCovered && (
                    <CheckCircleOutlineIcon
                      sx={{ fontSize: 12 }}
                      color="success"
                      titleAccess="covered"
                    />
                  )}
                </Stack>
                <Typography
                  variant="caption"
                  component="div"
                  color={
                    trailerCurrentlyCovering ? "text.primary" : "text.secondary"
                  }
                  sx={{
                    fontWeight: trailerCurrentlyCovering ? 700 : undefined,
                  }}
                >
                  {trailer.pick_count}
                </Typography>
              </Box>
              <Box
                role="img"
                aria-label={`${trailer.name} ${trailer.pick_count} picks, ${leader.name} ${leader.pick_count} picks`}
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
                  <Tooltip
                    title={`${trailer.name}: ${trailer.pick_count} picks`}
                  >
                    <Box
                      sx={{
                        flexGrow: Math.max(trailer.pct, 0.02),
                        bgcolor: "text.disabled",
                      }}
                    />
                  </Tooltip>
                )}
                <Tooltip title={`${leader.name}: ${leader.pick_count} picks`}>
                  <Box
                    sx={{
                      flexGrow: Math.max(leader.pct, 0.02),
                      bgcolor: "text.secondary",
                    }}
                  />
                </Tooltip>
              </Box>
              <Box
                sx={{
                  width: 38,
                  lineHeight: 1.1,
                  textAlign: "right",
                  opacity: cover?.isFinal && !leaderCovered ? 0.5 : 1,
                }}
              >
                <Stack
                  direction="row"
                  spacing={0.25}
                  sx={{
                    alignItems: "center",
                    justifyContent: "flex-end",
                  }}
                >
                  {leaderCovered && (
                    <CheckCircleOutlineIcon
                      sx={{ fontSize: 12 }}
                      color="success"
                      titleAccess="covered"
                    />
                  )}
                  <Typography
                    variant="caption"
                    component="div"
                    sx={{
                      fontWeight: leaderCurrentlyCovering ? 700 : undefined,
                    }}
                  >
                    {leader.abbr}
                  </Typography>
                </Stack>
                <Typography
                  variant="caption"
                  component="div"
                  color={
                    leaderCurrentlyCovering ? "text.primary" : "text.secondary"
                  }
                  sx={{
                    fontWeight: leaderCurrentlyCovering ? 700 : undefined,
                  }}
                >
                  {leader.pick_count}
                </Typography>
              </Box>
              <TeamLogo abbr={leader.abbr} size={22} />
              {/* No color here: a lopsided split isn't a win or a loss. */}
              <Typography
                variant="caption"
                sx={{
                  width: 40,
                  textAlign: "right",
                  fontVariantNumeric: "tabular-nums",
                  color: oneSided ? "text.primary" : "text.secondary",
                  fontWeight: oneSided ? 700 : undefined,
                }}
              >
                {Math.round(leader.pct * 100)}%
              </Typography>
            </Stack>
          </Box>
        );
      })}
    </Stack>
  );
}
