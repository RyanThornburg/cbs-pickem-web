import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import CloseIcon from "@mui/icons-material/Close";
import {
  AvatarGroup,
  Box,
  Chip,
  Icon as MuiIcon,
  Popover,
  Stack,
} from "@mui/material";
import Grid from "@mui/material/Grid2";
import { useState } from "react";
import { Game, GameStatus, Possession, Team, UserId } from "../../../../types";
import TeamData from "../../utils/team_data.json";
import styled from "@emotion/styled";
import SportsFootballOutlinedIcon from "@mui/icons-material/SportsFootballOutlined";
import { isGameToday, formatGameTime } from "../../utils/dateFormatters";
import UserAvatar from "../../../UserAvatar";

export const BallIcon = () => {
  const Icon = styled(MuiIcon)({
    "& > svg": {
      transform: "rotate(45deg)",
    },
  });

  return (
    <Icon>
      <SportsFootballOutlinedIcon sx={{ fontSize: "1rem" }} />
    </Icon>
  );
};

export type TeamDataJson = typeof TeamData;

export type Props = {
  game: Game;
  isHome: boolean;
};

interface GridStat {
  team: Team;
  score: number;
  timeOrDown: string;
  picks?: UserId[];
  cover: boolean;
  ball?: any;
  spread: number | undefined | string;
  teamColor: string;
  teamIcon: string | undefined;
  winning: boolean;
  status: GameStatus;
  isToday: boolean;
}

// Team abbreviations are normalized to team_data.json's keys upstream (see
// src/dashboard/data/weekGames.ts's toTeam) -- this is just the last-resort fallback
// for a team that's still missing from team_data.json entirely.
const FALLBACK_TEAM_DATA = {
  icon: undefined as string | undefined,
  color: "666666",
  alternateColor: "999999",
};

const getTeamData = (abbr: string) => {
  const teamData = TeamData[abbr as keyof typeof TeamData];
  if (!teamData) {
    console.warn(`No team_data.json entry for team abbreviation "${abbr}"`);
    return FALLBACK_TEAM_DATA;
  }
  return teamData;
};

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
    return formatGameTime(game.game_time);
  }

  return `${game.live?.time_remaining ?? ""} ${
    quarterLookUp[game.live?.quarter ?? 0]
  }`;
};

const homeScore = (game: Game): number => {
  return game?.home_score ?? 0;
};

const awayScore = (game: Game): number => {
  return game?.away_score ?? 0;
};

const homeSpread = (game: Game): number => {
  return game?.cbs_spread ?? 0;
};

function getBallIcon(game: Game, isHome: boolean) {
  if (game.status !== GameStatus.Inprogress) {
    return undefined;
  }

  return isHome && game.live?.possession === Possession.Home ? (
    <BallIcon />
  ) : !isHome && game.live?.possession === Possession.Away ? (
    <BallIcon />
  ) : undefined;
}

const homeTeamStats = (game: Game): GridStat => {
  const score = homeScore(game);
  const spread = homeSpread(game);
  const { icon, color } = getTeamData(game.home_team.abbr);

  return {
    team: game.home_team,
    ball: getBallIcon(game, true),
    cover: score + spread > awayScore(game),
    picks: game?.picks.home ?? [],
    score: score,
    timeOrDown: "",
    spread: spread < 0 ? spread : "",
    teamIcon: icon,
    teamColor: color,
    winning: score > awayScore(game),
    status: game.status,
    isToday: isGameToday(game.game_time),
  };
};

const awayTeamStats = (game: Game): GridStat => {
  const score = awayScore(game);
  const spread = homeSpread(game);
  const teamData = getTeamData(game.away_team.abbr);
  const teamHome = getTeamData(game.home_team.abbr);

  let { icon, color } = teamData;

  //not sure if this would happen
  if (color === teamHome.color) {
    color = teamData.alternateColor;
  }

  return {
    team: game.away_team,
    ball:
      game.status === GameStatus.Inprogress
        ? game.live?.possession === Possession.Away
        : false,
    cover: score > homeScore(game) + spread,
    picks: game?.picks.away ?? [],
    score: score,
    timeOrDown: timeOrStatus(game),
    spread: spread > 0 ? spread * -1 : "",
    teamIcon: icon,
    teamColor: color,
    winning: score > homeScore(game),
    status: game.status,
    isToday: isGameToday(game.game_time),
  };
};
const teamNameAndSpread = (team: GridStat): string => {
  if (team.spread) {
    return `${team.team.abbr} (${team.spread})`;
  }
  return team.team.abbr;
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

  const id = open ? "userGroups" : undefined;

  return (
    <Grid container size={{ xs: 12 }}>
      <Grid size={{ xs: 6, sm: 5 }}>
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
            {team.teamIcon && (
              <img
                width="24"
                height="24"
                alt={team.team.abbr}
                src={require(`../../../../icons/${team.teamIcon}`)}
              />
            )}
            <Box sx={{ pl: "12px" }}>{teamNameAndSpread(team)}</Box>
          </Stack>

          <Box sx={{ paddingRight: "8px" }}>{getBallIcon(game, isHome)}</Box>
        </Stack>
      </Grid>
      <Grid size={{ xs: 2 }}>
        <Grid container justifyContent={"flex-start"}>
          {team.score}
        </Grid>
      </Grid>

      <Grid size={{ xs: 3, sm: 4 }}>
        <Grid
          onClick={
            team.picks && team.picks.length > 0 ? handleClick : undefined
          }
          container
          sx={{ minWidth: "125px", textAlign: "end", paddingLeft: "14px" }}
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
                    <UserAvatar
                      size={24}
                      userName={user.name}
                      userId={user.id}
                      includeName={false}
                      key={`teamScore-Avatar-${team.team.id}-${user.id}`}
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
              p: "8px",
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
                      key={`teamScore-popoverStack-${team.team.id}-${user.id}`}
                      sx={{
                        alignItems: "center",
                        justifyContent: "flex-start",
                      }}
                      direction="row"
                      spacing={2}
                    >
                      <UserAvatar
                        userName={user.name}
                        fontSize={"0.75rem"}
                        size={20}
                        userId={user.id}
                      />
                    </Stack>
                  );
                })}
          </Stack>
        </Popover>
      </Grid>
    </Grid>
  );
}
