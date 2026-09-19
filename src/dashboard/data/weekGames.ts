import { fetchJson } from "../../api/pickemApi";
import { Forecast, Stadium, Team, TeamRecord } from "../types";
import { normalizeTeamAbbr } from "../utils/teamAssets";

export interface ApiTeam {
  id: number;
  abbr: string;
  record?: TeamRecord;
}

export interface ApiJoinGame {
  game_id: number;
  status: string;
  game_time: string;
  home_team: ApiTeam;
  away_team: ApiTeam;
  home_score?: number;
  away_score?: number;
  cbs_spread?: number;
  tv_network?: string;
  gametracker_url?: string;
  stadium?: Stadium;
  forecast?: Forecast | null;
}

export interface ApiWeekGamesResponse {
  week: number;
  updated_at: string;
  games: ApiJoinGame[];
}

export const toTeam = (team: ApiTeam): Team => ({
  id: team.id,
  abbr: normalizeTeamAbbr(team.abbr),
  record: team.record,
});

export const fetchWeekGames = (
  season: number,
  week: number
): Promise<ApiWeekGamesResponse> =>
  fetchJson<ApiWeekGamesResponse>(`/api/weeks/${season}/${week}/games`);

export const buildGamesById = (
  games: ApiJoinGame[]
): Map<number, ApiJoinGame> => new Map(games.map((game) => [game.game_id, game]));

export const findEarliestGame = (
  games: ApiJoinGame[]
): ApiJoinGame | undefined => {
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

// Mirrors the cover formula in Scoreboard/TeamScore/index.tsx's homeTeamStats/
// awayTeamStats so "covered" means the same thing everywhere in the app.
export const getGameCoverResult = (game: ApiJoinGame): GameCoverResult => {
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
