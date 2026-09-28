import { fetchJson } from "../../api/pickemApi";
import {
  Forecast,
  Game,
  GameLeaders,
  GameStatus,
  Linescore,
  Possession,
  ScoringPlay,
  Stadium,
  Team,
  TeamRecord,
  UserId,
} from "../types";
import { normalizeTeamAbbr } from "../utils/teamAssets";

export interface ApiTeam {
  id: number;
  abbr: string;
  name?: string;
  record?: TeamRecord;
}

interface ApiUserRef {
  user_id: number;
  name: string;
}

interface ApiGameLive {
  quarter?: number | null;
  time_remaining?: string | null;
  possession?: string | null;
  down?: number | null;
  distance?: number | null;
  down_distance_text?: string | null;
  is_red_zone?: boolean | null;
  home_timeouts?: number | null;
  away_timeouts?: number | null;
  yard_line?: number | null;
  possession_text?: string | null;
  last_play?: { text: string | null; type: string | null } | null;
  drive_text?: string | null;
  drive_start?: { yard_line: number | null; text: string | null } | null;
  win_probability?: { home: number | null; away: number | null } | null;
  weather?: Forecast | null;
}

// The full shape of one entry in `/api/weeks/:season/:week/games` -- every
// caller (Scoreboard's live poll, the Games tab, the leaderboard's game
// lookups) hits this same endpoint, so it's one interface with the fields
// each caller happens to need marked optional, rather than a per-caller copy.
export interface ApiGame {
  game_id: number;
  status: string;
  game_time: string;
  home_team: ApiTeam;
  away_team: ApiTeam;
  home_score?: number;
  away_score?: number;
  cbs_spread?: number | null;
  tv_network?: string | null;
  gametracker_url?: string | null;
  stadium?: Stadium;
  neutral_site?: boolean | null;
  forecast?: Forecast | null;
  picks?: {
    home: ApiUserRef[];
    away: ApiUserRef[];
  };
  live?: ApiGameLive | null;
  status_desc?: string | null;
  linescore?: Linescore | null;
  leaders?: GameLeaders | null;
  scoring_plays?: ScoringPlay[];
}

export interface ApiWeekGamesResponse {
  week: number;
  updated_at: string;
  games: ApiGame[];
}

export const toTeam = (team: ApiTeam): Team => ({
  id: team.id,
  abbr: normalizeTeamAbbr(team.abbr),
  name: team.name,
  record: team.record,
});

const toUserId = (user: ApiUserRef): UserId => ({
  id: String(user.user_id),
  name: user.name,
});

const toPossession = (possession?: string | null): Possession | undefined => {
  if (possession === "HOME") return Possession.Home;
  if (possession === "AWAY") return Possession.Away;
  return undefined;
};

// Maps the full API shape to the Game type used by the Scoreboard tab (the
// only consumer that needs picks/live/linescore/leaders) -- Games tab and leaderboard consumers
// read the fields they need directly off ApiGame instead.
export const toGame = (game: ApiGame): Game => ({
  game_id: game.game_id,
  home_team: toTeam(game.home_team),
  away_team: toTeam(game.away_team),
  status: game.status as GameStatus,
  home_score: game.home_score ?? 0,
  away_score: game.away_score ?? 0,
  game_time: Date.parse(game.game_time),
  cbs_spread: game.cbs_spread ?? undefined,
  tv_network: game.tv_network ?? undefined,
  gametracker_url: game.gametracker_url ?? undefined,
  stadium: game.stadium,
  neutral_site: game.neutral_site ?? undefined,
  forecast: game.forecast,
  picks: {
    home: game.picks?.home.map(toUserId) ?? [],
    away: game.picks?.away.map(toUserId) ?? [],
  },
  live: game.live
    ? {
        quarter: game.live.quarter ?? undefined,
        time_remaining: game.live.time_remaining ?? undefined,
        possession: toPossession(game.live.possession),
        down: game.live.down ?? undefined,
        distance: game.live.distance ?? undefined,
        down_distance_text: game.live.down_distance_text ?? undefined,
        is_red_zone: game.live.is_red_zone ?? undefined,
        home_timeouts: game.live.home_timeouts ?? undefined,
        away_timeouts: game.live.away_timeouts ?? undefined,
        yard_line: game.live.yard_line ?? undefined,
        possession_text: game.live.possession_text ?? undefined,
        last_play: game.live.last_play ?? undefined,
        drive_text: game.live.drive_text ?? undefined,
        drive_start: game.live.drive_start ?? undefined,
        win_probability: game.live.win_probability ?? undefined,
        weather: game.live.weather,
      }
    : undefined,
  status_desc: game.status_desc ?? undefined,
  linescore: game.linescore,
  leaders: game.leaders,
  scoring_plays: game.scoring_plays,
});

export const weekGamesUrl = (season: number, week: number): string =>
  `/api/weeks/${season}/${week}/games`;

export const fetchWeekGames = (
  season: number,
  week: number
): Promise<ApiWeekGamesResponse> =>
  fetchJson<ApiWeekGamesResponse>(weekGamesUrl(season, week));

export const buildGamesById = (
  games: ApiGame[]
): Map<number, ApiGame> => new Map(games.map((game) => [game.game_id, game]));

export const findEarliestGame = (
  games: ApiGame[]
): ApiGame | undefined => {
  if (games.length === 0) return undefined;
  return games.reduce((earliest, game) => {
    const gameTime = Date.parse(game.game_time);
    return gameTime < Date.parse(earliest.game_time) ? game : earliest;
  });
};

export interface GameCoverResult {
  isFinal: boolean;
  // Which team is (or ended up) ahead on the pool's cbs_spread -- null on a
  // push, or if the game hasn't started. Computed off the live score once
  // one exists, not just once final, so "who's covering" can track an
  // in-progress game -- consumers that only care about the locked-in result
  // should gate on `isFinal` themselves (see e.g. AllAloneCard/LineMoversCard).
  // This is what "did the pick cover" means in this pool (see CLAUDE.md:
  // cbs_spread is the line the pool is actually graded against), not the
  // straight-up winner.
  coveringTeamId: number | null;
}

// Mirrors the cover formula in Scoreboard/utils/scoreboardUtils.ts's getCover
// so "covered" means the same thing everywhere in the app.
export const getGameCoverResult = (game: ApiGame): GameCoverResult => {
  const isFinal = game.status === "FINAL";

  if (game.home_score == null || game.away_score == null) {
    return { isFinal, coveringTeamId: null };
  }

  const margin = game.home_score + (game.cbs_spread ?? 0) - game.away_score;
  return {
    isFinal,
    coveringTeamId:
      margin > 0
        ? game.home_team.id
        : margin < 0
        ? game.away_team.id
        : null,
  };
};
