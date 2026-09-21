import { pollJson } from "../../api/pickemApi";
import { Game } from "../types";
import { ApiWeekGamesResponse, toGame, weekGamesUrl } from "./weekGames";

const POLL_INTERVAL_MS = 60_000;

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
    weekGamesUrl(season, week),
    POLL_INTERVAL_MS,
    (data) => callback(data.games.map(toGame)),
    (error) => console.error("Failed to fetch week games", error)
  );
};
