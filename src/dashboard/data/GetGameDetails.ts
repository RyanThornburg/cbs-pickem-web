import { fetchJson } from "../../api/pickemApi";
import { GameDetails } from "../types";

// `game:{season}:{game_id}:details` -- box score, full player stats and the
// post-game win probability curve. Only fetched when someone opens a game,
// not polled with the scoreboard (~50 KB each). A missing key (404) just
// means the game has no stats yet.
export const fetchGameDetails = (
  season: number,
  gameId: number
): Promise<GameDetails> =>
  fetchJson<GameDetails>(`/api/games/${season}/${gameId}/details`);
