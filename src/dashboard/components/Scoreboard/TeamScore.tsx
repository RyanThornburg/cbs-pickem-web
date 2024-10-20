import styled from "@emotion/styled";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import CloseIcon from "@mui/icons-material/Close";
import SportsFootballOutlinedIcon from "@mui/icons-material/SportsFootballOutlined";
import {
  Avatar,
  AvatarGroup,
  Box,
  Chip,
  Icon as MuiIcon,
  Stack,
} from "@mui/material";
import Grid from "@mui/material/Grid2";
import { Game, GameStatus, Possession, Team, UserId } from "../../../types";
import TeamData from "../../data/team_data.json";
import { gameTime, IsGameToday, stringAvatar } from "../../helper";

export type TeamDataJson = typeof TeamData;

export type Props = {
  game: Game;
  isHome: boolean;
};
const Icon = styled(MuiIcon)({
  "& > svg": {
    transform: "rotate(45deg)",
  },
});

interface GridStat {
  team: Team;
  score: number;
  timeOrDown: string;
  picks?: UserId[];
  cover: boolean;
  ball?: any;
  spread: number | undefined | string;
  teamColor: string;
  teamIcon: string;
  winning: boolean;
  status: GameStatus;
  isToday: boolean;
}

const quarterLookUp: { [int: number]: string } = {
  0: "",
  1: "1st",
  2: "2nd",
  3: "3rd",
  4: "4th",
  5: "OT",
} as const;

const timeOrStatus = (game: Game): string => {
  if (game.status === GameStatus.Final) {
    return "Final";
  }

  if (game.status === GameStatus.Scheduled) {
    return gameTime(game.starts_at);
  }

  return `${game.time_remaining} ${quarterLookUp[game?.game_period ?? 0]}`;
};

const homeScore = (game: Game): number => {
  return game?.home_team_score ?? 0;
};

const awayScore = (game: Game): number => {
  return game?.away_team_score ?? 0;
};

const homeSpread = (game: Game): number => {
  return game?.home_team_spread ?? 0;
};

const ballIcon = () => {
  return (
    <Icon>
      <SportsFootballOutlinedIcon sx={{ fontSize: "1rem" }} />
    </Icon>
  );
};
function getBallIcon(game: Game, isHome: boolean) {
  if (game.status !== GameStatus.Inprogress) {
    return undefined;
  }
  if (isHome && game?.possession === Possession.Home) {
    return ballIcon();
  }
}

const homeTeamStats = (game: Game): GridStat => {
  const score = homeScore(game);
  const spread = homeSpread(game);
  const teamName = game.home_team.short_name;
  const teamData = TeamData[teamName as keyof typeof TeamData];
  const { icon, color } = teamData;

  return {
    team: game.home_team,
    ball: getBallIcon(game, true),
    cover: score + spread > awayScore(game),
    picks: game?.home_team_picks ?? [],
    score: score,
    timeOrDown: "",
    spread: spread < 0 ? spread : "",
    teamIcon: icon,
    teamColor: color,
    winning: score > awayScore(game),
    status: game.status,
    isToday: IsGameToday(game.starts_at),
  };
};

const awayTeamStats = (game: Game): GridStat => {
  const score = awayScore(game);
  const spread = homeSpread(game);
  const teamName = game.away_team.short_name;
  const teamData = TeamData[teamName as keyof typeof TeamData];
  const teamHome = TeamData[game.home_team.short_name as keyof typeof TeamData];

  let { icon, color } = teamData;

  //not sure if this would happen
  if (color === teamHome.color) {
    color = teamData.alternateColor;
  }

  return {
    team: game.away_team,
    ball:
      game.status === GameStatus.Inprogress
        ? game?.possession === Possession.Away ?? false
        : false,
    cover: score > homeScore(game) + spread,
    picks: game?.away_team_picks ?? [],
    score: score,
    timeOrDown: timeOrStatus(game),
    spread: spread > 0 ? spread * -1 : "",
    teamIcon: icon,
    teamColor: color,
    winning: score > homeScore(game),
    status: game.status,
    isToday: IsGameToday(game.starts_at),
  };
};
const teamNameAndSpread = (team: GridStat): string => {
  if (team.spread) {
    return `${team.team.short_name} (${team.spread})`;
  }
  return team.team.short_name;
};

const zeroPickChip = ({ cover, status, isToday }: GridStat) => {
  if (status === GameStatus.Scheduled && !isToday) {
    return "";
  }
  return (
    <Chip
      color={cover ? "warning" : "success"}
      variant="outlined"
      label="Zero Picks"
      sx={{ fontSize: "10rem" }}
    />
  );
};

const pickStatusIcon = (cover: boolean) => {
  if (cover) {
    return <CheckCircleOutlineIcon color={"success"} />;
  }

  return <CloseIcon color={"error"} />;
};

const pickStatus = ({ cover, picks }: GridStat) => {
  return (
    <Stack
      direction="row"
      spacing={0}
      sx={{
        justifyContent: "flex-start",
        alignItems: "center",
      }}
    >
      {pickStatusIcon(cover)}
      <Box sx={{ fontSize: "16px", color: "success" }}>
        {picks?.length ?? 0}
      </Box>
    </Stack>
  );
};

export default function TeamScore({ game, isHome }: Props) {
  const team: GridStat = isHome ? homeTeamStats(game) : awayTeamStats(game);
  return (
    <Grid container size={{ xs: 12 }}>
      <Grid size={{ xs: 7, lg: 3 }}>
        <Stack
          direction="row"
          sx={{
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Stack
            direction="row"
            sx={{
              pr: "8px",
              pl: "4px",
              borderLeft: `solid #${team.teamColor} 4px`,
              justifyContent: "space-between",
              alignItems: "left",
            }}
          >
            {
              <img
                width="24"
                height="24"
                alt={team.team.short_name}
                src={require(`../../icons/${team.teamIcon}`)}
              />
            }
            <Box sx={{ pl: "12px" }}>{teamNameAndSpread(team)}</Box>
          </Stack>

          <Box id="ball">{getBallIcon(game, isHome)}</Box>
        </Stack>
      </Grid>
      <Grid size={{ xs: 1 }}>{team.score}</Grid>
      <Grid size={{ xs: 4, lg: 3 }}>{team.timeOrDown}</Grid>
      <Grid size={{ xs: 0, lg: 5 }} display={{ xs: "none", lg: "block" }}>
        <Grid container sx={{ minWidth: "125px", textAlign: "end" }}>
          {team.picks && team.picks.length > 0 && (
            <AvatarGroup
              sx={{
                "& .MuiAvatar-root": { width: 24, height: 24, fontSize: 10 },
              }}
              max={4}
            >
              {team.picks &&
                team.picks.map((user: UserId) => {
                  return (
                    <Avatar
                      alt={user.name}
                      {...stringAvatar(user.name, {
                        width: 24,
                        height: 24,
                        fontSize: 10,
                      })}
                    />
                  );
                })}
            </AvatarGroup>
          )}
          {team.picks && team?.picks.length > 0 && pickStatus(team)}
          {team.picks && team?.picks.length === 0 && zeroPickChip(team)}
        </Grid>
      </Grid>
    </Grid>
  );
}
