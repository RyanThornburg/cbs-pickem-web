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
  Popover,
  Stack,
} from "@mui/material";
import Grid from "@mui/material/Grid2";
import { useState } from "react";
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

  return isHome && game?.possession === Possession.Home
    ? ballIcon()
    : !isHome && game?.possession === Possession.Away
    ? ballIcon()
    : undefined;
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

const zeroPickChip = ({ team, cover, status, isToday }: GridStat) => {
  if (status === GameStatus.Scheduled && !isToday) {
    return "";
  }

  return (
    <Chip
      id="chipper"
      color={cover ? "warning" : "success"}
      variant="outlined"
      label="Zero Picks"
      sx={{ fontSize: "10rem", alignContent: "center" }}
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
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const open = Boolean(anchorEl);

  const id = open ? "simple-popover" : undefined;

  return (
    <Grid container size={{ xs: 12 }}>
      <Grid size={{ xs: 6, sm: 5, lg: 3 }}>
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

          <Box>{getBallIcon(game, isHome)}</Box>
        </Stack>
      </Grid>
      <Grid size={{ xs: 1 }}>{team.score}</Grid>
      <Grid size={{ xs: "grow", lg: 3 }}>{team.timeOrDown}</Grid>
      <Grid size={{ xs: "grow", lg: 5 }} display={{ xs: "block", lg: "block" }}>
        <Grid
          onClick={
            team.picks && team.picks.length > 0 ? handleClick : undefined
          }
          container
          sx={{ minWidth: "125px", textAlign: "end" }}
        >
          {team.picks && team?.picks.length > 0 && pickStatus(team)}
          {team.picks && team.picks.length > 0 && (
            <AvatarGroup
              sx={{
                pl: "2px",
                "& .MuiAvatar-root": { width: 24, height: 24, fontSize: 10 },
              }}
              max={3}
            >
              {team.picks &&
                team.picks.map((user: UserId) => {
                  return (
                    <Avatar
                      key={`teamScore-Avatar-${team.team.cbs_team_id}-${user.id}`}
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

          {team.picks && team?.picks.length === 0 && zeroPickChip(team)}
        </Grid>
        <Popover
          id={id}
          open={open}
          anchorEl={anchorEl}
          onClose={handleClose}
          anchorOrigin={{
            vertical: "center",
            horizontal: "right",
          }}
          transformOrigin={{
            vertical: "bottom",
            horizontal: "right",
          }}
        >
          <Stack
            sx={{
              ml: "2px",
              p: "1px",
              alignItems: "flex-start",
              justifyContent: "flex-start",
            }}
            direction="column"
            spacing={0.5}
          >
            {team.picks &&
              team?.picks.length > 0 &&
              team.picks
                .sort((a, b) =>
                  a.name < b.name ? -1 : a.name > b.name ? 1 : 0
                )
                .map((user: UserId) => {
                  return (
                    <Stack
                      key={`teamScore-popoverStack-${team.team.cbs_team_id}-${user.id}`}
                      sx={{
                        alignItems: "center",
                        justifyContent: "flex-start",
                      }}
                      direction="row"
                      spacing={2}
                    >
                      <Avatar
                        {...stringAvatar(user.name, {
                          width: 20,
                          height: 20,
                          fontSize: 10,
                        })}
                      />
                      <Box sx={{ fontSize: "1rem" }}>{user.name}</Box>
                    </Stack>
                  );
                })}
          </Stack>
        </Popover>
      </Grid>
    </Grid>
  );
}
