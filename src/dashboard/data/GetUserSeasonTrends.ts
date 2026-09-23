import { fetchJson, poll } from "../../api/pickemApi";
import { UserSeasonTrends } from "../types";

// Matches the cadence of the other season-scoped trends endpoint
// (GetSeasonTrends.ts) -- this data only changes as weeks finalize, not
// live-game-fast.
const POLL_INTERVAL_MS = 30 * 60_000;

// One KV entry per user (user:{id}:season:{season}), so a table of N users
// means N requests per poll -- fine at this pool's size, and each response is
// a few KB. A user missing the key entirely (e.g. brand new, or the data
// pipeline hasn't backfilled them yet) is dropped from the map rather than
// failing the whole poll.
export const GetUserSeasonTrends = (
  userIds: string[],
  season: number,
  callback: (trends: Record<string, UserSeasonTrends>) => void
) => {
  if (season === 0 || userIds.length === 0) {
    callback({});
    return;
  }

  let cancelled = false;

  const stop = poll(() => {
    Promise.allSettled(
      userIds.map((id) =>
        fetchJson<UserSeasonTrends>(`/api/users/${id}/season/${season}`)
      )
    ).then((results) => {
      if (cancelled) return;

      const trends: Record<string, UserSeasonTrends> = {};
      results.forEach((result, index) => {
        if (result.status === "fulfilled") {
          trends[userIds[index]] = result.value;
        }
      });
      callback(trends);
    });
  }, POLL_INTERVAL_MS);

  return () => {
    cancelled = true;
    stop();
  };
};
