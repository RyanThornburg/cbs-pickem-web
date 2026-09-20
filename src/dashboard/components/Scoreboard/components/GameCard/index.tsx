// Enhanced version with more features:
import { memo, useMemo } from "react";
import {
  Card,
  CardContent,
  Stack,
  Typography,
  Chip,
  Box,
  Grid2 as Grid,
} from "@mui/material";
import { Game, GameStatus } from "../../../../types";
import TeamScore from "../TeamScore";
import { formatGameTime, formatGameDate } from "../../utils/dateFormatters";
import { cardStyles, contentStyles } from "./styles";

export interface GameCardProps {
  game: Game;
}
export const GameCard = memo(({ game }: GameCardProps) => {
  const gameTime = useMemo(
    () => formatGameTime(game.game_time),
    [game.game_time]
  );
  const gameDate = useMemo(
    () => formatGameDate(game.game_time),
    [game.game_time]
  );

  const gameTV = (tv: string | undefined) => {
    if (tv === "ESPD") {
      return "ESPN";
    }
    if (tv === "AMZN") {
      return "AMAZON";
    }
    return tv;
  };

  const getStatusColor = (status: GameStatus) => {
    switch (status) {
      case GameStatus.Inprogress:
        return "success";
      case GameStatus.Final:
        return "error";
      case GameStatus.Scheduled:
        return "primary";
      case GameStatus.Halftime:
      case GameStatus.Delayed:
        return "warning";
      default:
        return "default";
    }
  };

  const getTimeLeft = () => {
    return (
      <Typography sx={{ paddingX: "4px" }} variant="body2" align="center">
        {game.live?.time_remaining} {game.live?.quarter}Q
      </Typography>
    );
  };

  const isGameLive = game.status === GameStatus.Inprogress;
  const gameChipString = isGameLive ? "Live" : game.status;

  return (
    <Grid size={{ xs: 12, sm: 12, md: 6, lg: 5 }}>
      <Card variant="outlined" sx={cardStyles}>
        <CardContent sx={contentStyles}>
          <Stack spacing={2}>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Typography variant="subtitle2" color="text.secondary">
                {gameDate} • {gameTime} • {gameTV(game.tv_network)}
              </Typography>

              <Chip
                label={isGameLive ? getTimeLeft() : gameChipString}
                size="small"
                color={getStatusColor(game.status)}
                variant="outlined"
              />
            </Box>

            <Stack spacing={1}>
              <TeamScore game={game} isHome={false} />
              <TeamScore game={game} isHome={true} />
            </Stack>
          </Stack>
        </CardContent>
      </Card>
    </Grid>
  );
});

GameCard.displayName = "GameCard";
