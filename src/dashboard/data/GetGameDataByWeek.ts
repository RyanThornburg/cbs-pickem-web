import { pollJson } from "../../api/pickemApi";
import { Game, GameStatus, Possession, UserId } from "../types";
import { ApiTeam, toTeam } from "./weekGames";

const POLL_INTERVAL_MS = 60_000;

interface ApiUserRef {
  user_id: number;
  name: string;
}

interface ApiGame {
  game_id: number;
  home_team: ApiTeam;
  away_team: ApiTeam;
  status: string;
  home_score: number;
  away_score: number;
  game_time: string;
  cbs_spread?: number | null;
  tv_network?: string | null;
  gametracker_url?: string | null;
  picks: {
    home: ApiUserRef[];
    away: ApiUserRef[];
  };
  live?: {
    quarter?: number | null;
    time_remaining?: string | null;
    possession?: string | null;
    down_distance_text?: string | null;
    is_red_zone?: boolean | null;
  } | null;
}

interface ApiWeekGamesResponse {
  week: number;
  updated_at: string;
  games: ApiGame[];
}

const toUserId = (user: ApiUserRef): UserId => ({
  id: String(user.user_id),
  name: user.name,
});

const toPossession = (possession?: string | null): Possession | undefined => {
  if (possession === "HOME") return Possession.Home;
  if (possession === "AWAY") return Possession.Away;
  return undefined;
};

const toGame = (game: ApiGame): Game => ({
  game_id: game.game_id,
  home_team: toTeam(game.home_team),
  away_team: toTeam(game.away_team),
  status: game.status as GameStatus,
  home_score: game.home_score,
  away_score: game.away_score,
  game_time: Date.parse(game.game_time),
  cbs_spread: game.cbs_spread ?? undefined,
  tv_network: game.tv_network ?? undefined,
  gametracker_url: game.gametracker_url ?? undefined,
  picks: {
    home: game.picks.home.map(toUserId),
    away: game.picks.away.map(toUserId),
  },
  live: game.live
    ? {
        quarter: game.live.quarter ?? undefined,
        time_remaining: game.live.time_remaining ?? undefined,
        possession: toPossession(game.live.possession),
        down_distance_text: game.live.down_distance_text ?? undefined,
        is_red_zone: game.live.is_red_zone ?? undefined,
      }
    : undefined,
});

export const GetGameDataByWeek = (
  season: number,
  week: number,
  callback: (games: Game[]) => void
) => {
  if (season === 0 || week === 0) {
    callback([]);
    return;
  }

  return pollJson<ApiWeekGamesResponse>(
    `/api/weeks/${season}/${week}/games`,
    POLL_INTERVAL_MS,
    (data) => callback(data.games.map(toGame)),
    (error) => console.error("Failed to fetch week games", error)
  );
};
