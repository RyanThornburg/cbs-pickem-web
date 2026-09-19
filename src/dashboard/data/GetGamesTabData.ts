import { fetchJson, poll } from "../../api/pickemApi";
import { Book, BookMarketSide, Forecast, GameStatus, MarketSpread, Stadium, Team } from "../types";
import { ApiJoinGame, fetchWeekGames, toTeam } from "./weekGames";

const POLL_INTERVAL_MS = 5 * 60_000;

interface ApiMarketSpread {
  book_count: number;
  open: number;
  open_agreement: number;
  close: number;
  close_agreement: number;
}

interface ApiBookMarketSide {
  home_point: number | null;
  home_price: number | null;
  away_point: number | null;
  away_price: number | null;
  captured_at: string;
}

interface ApiBook {
  bookmaker: string;
  moneyline?: ApiBookMarketSide;
  spread?: ApiBookMarketSide;
  total?: ApiBookMarketSide;
}

interface ApiGameOdds {
  game_id: number;
  cbs_spread?: number | null;
  market_spread: ApiMarketSpread | null;
  books?: ApiBook[];
}

interface ApiOddsResponse {
  week: number;
  updated_at: string;
  games: ApiGameOdds[];
}

const fetchOdds = (season: number, week: number): Promise<ApiOddsResponse> =>
  fetchJson<ApiOddsResponse>(`/api/weeks/${season}/${week}/odds`);

export interface GameWithOdds {
  game_id: number;
  home_team: Team;
  away_team: Team;
  status: GameStatus;
  game_time: number;
  tv_network?: string;
  gametracker_url?: string;
  stadium?: Stadium;
  forecast?: Forecast | null;
  cbs_spread?: number;
  market_spread: MarketSpread | null;
  books: Book[];
}

const toBookMarketSide = (
  side?: ApiBookMarketSide
): BookMarketSide | undefined =>
  side
    ? {
        home_point: side.home_point,
        home_price: side.home_price,
        away_point: side.away_point,
        away_price: side.away_price,
        captured_at: side.captured_at,
      }
    : undefined;

const toBook = (book: ApiBook): Book => ({
  bookmaker: book.bookmaker,
  moneyline: toBookMarketSide(book.moneyline),
  spread: toBookMarketSide(book.spread),
  total: toBookMarketSide(book.total),
});

const joinGameWithOdds = (
  game: ApiJoinGame,
  odds: ApiGameOdds | undefined
): GameWithOdds => ({
  game_id: game.game_id,
  home_team: toTeam(game.home_team),
  away_team: toTeam(game.away_team),
  status: game.status as GameStatus,
  game_time: Date.parse(game.game_time),
  tv_network: game.tv_network,
  gametracker_url: game.gametracker_url,
  stadium: game.stadium,
  forecast: game.forecast,
  cbs_spread: odds?.cbs_spread ?? game.cbs_spread ?? undefined,
  market_spread: odds?.market_spread
    ? {
        book_count: odds.market_spread.book_count,
        open: odds.market_spread.open,
        open_agreement: odds.market_spread.open_agreement,
        close: odds.market_spread.close,
        close_agreement: odds.market_spread.close_agreement,
      }
    : null,
  books: (odds?.books ?? []).map(toBook),
});

export const GetGamesTabData = (
  season: number,
  week: number,
  callback: (games: GameWithOdds[]) => void
): (() => void) => {
  if (season === 0 || week === 0) {
    callback([]);
    return () => {};
  }

  let cancelled = false;

  const stop = poll(() => {
    Promise.all([fetchWeekGames(season, week), fetchOdds(season, week)])
      .then(([weekGames, odds]) => {
        if (cancelled) return;

        const oddsByGameId = new Map(odds.games.map((o) => [o.game_id, o]));
        const games = weekGames.games
          .map((game) => joinGameWithOdds(game, oddsByGameId.get(game.game_id)))
          .sort((a, b) => a.game_time - b.game_time);

        callback(games);
      })
      .catch((error) => {
        if (!cancelled) {
          console.error("Failed to fetch games tab data", error);
        }
      });
  }, POLL_INTERVAL_MS);

  return () => {
    cancelled = true;
    stop();
  };
};
