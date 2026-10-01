import { fetchJson } from "../../api/pickemApi";
import { Game, GameStatus } from "../types";
import {
  ApiGame,
  ApiWeekGamesResponse,
  toGame,
  weekGamesUrl,
} from "./weekGames";

// Poll faster while a game is live. The Worker caches the games key at the
// edge for 30s, so polling much faster than that mostly re-reads the same data.
const LIVE_POLL_MS = 30_000;
const IDLE_POLL_MS = 60_000;
const LIVE_STATUSES: ReadonlySet<string> = new Set([
  GameStatus.Inprogress,
  GameStatus.Halftime,
  GameStatus.Delayed,
]);
// Status only flips to IN_PROGRESS a minute or so after kickoff, so treat a
// SCHEDULED game as live from shortly before kickoff. Capped after kickoff so
// a game stuck at SCHEDULED (e.g. postponed) doesn't keep the fast poll on.
const PRE_KICKOFF_MS = 5 * 60_000;
const POST_KICKOFF_MS = 15 * 60_000;

export const hasLiveishGame = (games: ApiGame[], now: number): boolean =>
  games.some((game) => {
    if (LIVE_STATUSES.has(game.status)) {
      return true;
    }
    if (game.status !== GameStatus.Scheduled) {
      return false;
    }
    const untilKickoff = Date.parse(game.game_time) - now;
    return untilKickoff < PRE_KICKOFF_MS && untilKickoff > -POST_KICKOFF_MS;
  });

export const GetGameDataByWeek = (
  season: number,
  week: number,
  callback: (games: Game[]) => void,
  // Each failed fetch; the poll keeps going and tries again on schedule.
  onError?: (error: Error) => void
) => {
  if (season === 0 || week === 0) {
    callback([]);
    return;
  }

  let stopped = false;
  let inFlight = false;
  let fast = false;
  let timer: ReturnType<typeof setTimeout> | undefined;

  const tick = async () => {
    if (stopped || inFlight) {
      return;
    }
    clearTimeout(timer);
    inFlight = true;
    // Skip the fetch while the tab is hidden; onVisible catches up on return.
    if (document.visibilityState !== "hidden") {
      try {
        const data = await fetchJson<ApiWeekGamesResponse>(
          weekGamesUrl(season, week)
        );
        if (!stopped) {
          fast = hasLiveishGame(data.games, Date.now());
          callback(data.games.map(toGame));
        }
      } catch (error) {
        console.error("Failed to fetch week games", error);
        if (!stopped) {
          onError?.(error instanceof Error ? error : new Error(String(error)));
        }
      }
    }
    inFlight = false;
    if (!stopped) {
      timer = setTimeout(tick, fast ? LIVE_POLL_MS : IDLE_POLL_MS);
    }
  };

  const onVisible = () => {
    if (document.visibilityState === "visible") {
      tick();
    }
  };

  document.addEventListener("visibilitychange", onVisible);
  tick();

  return () => {
    stopped = true;
    clearTimeout(timer);
    document.removeEventListener("visibilitychange", onVisible);
  };
};
