import { fetchJson, pollAsync } from "../../api/pickemApi";
import {
  Book,
  BookMarketSide,
  Forecast,
  GameStatus,
  MarketSpread,
  Stadium,
  Team,
} from "../types";
import {
  ApiGame,
  fetchWeekGames,
  getGameCoverResult,
  toTeam,
} from "./weekGames";

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
  neutral_site?: boolean;
  forecast?: Forecast | null;
  home_score?: number;
  away_score?: number;
  cbs_spread?: number;
  market_spread: MarketSpread | null;
  // Which team covers the pool's cbs_spread, once there's a score -- see
  // getGameCoverResult for the formula (same one the Trends cards grade
  // against). Consumers that only care about the locked-in result should
  // gate on status === GameStatus.Final themselves, same as everywhere else.
  coveringTeamId: number | null;
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
  game: ApiGame,
  odds: ApiGameOdds | undefined
): GameWithOdds => {
  // odds.cbs_spread wins over game.cbs_spread below (same as before) -- grade
  // the cover against that same effective number so the "who covered"
  // indicator can never disagree with the CBS Line the user is looking at.
  const effectiveCbsSpread = odds?.cbs_spread ?? game.cbs_spread ?? undefined;

  return {
    game_id: game.game_id,
    home_team: toTeam(game.home_team),
    away_team: toTeam(game.away_team),
    status: game.status as GameStatus,
    game_time: Date.parse(game.game_time),
    tv_network: game.tv_network ?? undefined,
    gametracker_url: game.gametracker_url ?? undefined,
    stadium: game.stadium,
    neutral_site: game.neutral_site ?? undefined,
    forecast: game.forecast,
    home_score: game.home_score,
    away_score: game.away_score,
    coveringTeamId: getGameCoverResult({
      ...game,
      cbs_spread: effectiveCbsSpread,
    }).coveringTeamId,
    cbs_spread: effectiveCbsSpread,
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
  };
};

// Just the books per game, for the Scoreboard's O/U. Logs and delivers
// nothing when the week has no odds key yet.
export const GetWeekBooks = (
  season: number,
  week: number,
  callback: (booksByGameId: Map<number, Book[]>) => void
): (() => void) => {
  if (season === 0 || week === 0) return () => {};
  const load = async () => {
    const odds = await fetchOdds(season, week);
    return new Map(
      odds.games.map((o) => [o.game_id, (o.books ?? []).map(toBook)])
    );
  };
  return pollAsync(load, POLL_INTERVAL_MS, callback, (error) =>
    console.warn("No odds for the scoreboard totals", error)
  );
};

export const GetGamesTabData = (
  season: number,
  week: number,
  callback: (games: GameWithOdds[]) => void
): (() => void) => {
  if (season === 0 || week === 0) {
    callback([]);
    return () => {};
  }

  const load = async (): Promise<GameWithOdds[]> => {
    const [weekGames, odds] = await Promise.all([
      fetchWeekGames(season, week),
      fetchOdds(season, week),
    ]);
    const oddsByGameId = new Map(odds.games.map((o) => [o.game_id, o]));
    return weekGames.games
      .map((game) => joinGameWithOdds(game, oddsByGameId.get(game.game_id)))
      .sort((a, b) => a.game_time - b.game_time);
  };

  return pollAsync(load, POLL_INTERVAL_MS, callback, (error) =>
    console.error("Failed to fetch games tab data", error)
  );
};
