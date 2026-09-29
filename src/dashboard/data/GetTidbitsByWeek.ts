import { pollJson } from "../../api/pickemApi";
import { WeekTidbits } from "../types";

// The key is rewritten every 5 minutes, so polling faster buys nothing.
const POLL_INTERVAL_MS = 5 * 60_000;

// The tidbits shape version this UI was written for. The data repo bumps it
// on any rename or shape change, so a key at another version (or with none,
// like the pre-v2 keys) is treated as no data rather than half-rendered.
export const TIDBITS_VERSION = 2;

export const GetTidbitsByWeek = (
  season: number,
  week: number,
  callback: (tidbits: WeekTidbits | undefined) => void
) => {
  if (season === 0 || week === 0) {
    callback(undefined);
    return;
  }

  return pollJson<WeekTidbits>(
    `/api/weeks/${season}/${week}/tidbits`,
    POLL_INTERVAL_MS,
    (data) => {
      if (data.version !== TIDBITS_VERSION) {
        console.warn(
          `Tidbits for week ${week} are version ${data.version ?? "none"}, expected ${TIDBITS_VERSION}`
        );
        callback(undefined);
        return;
      }
      callback(data);
    },
    // A week with no key 404s; that's "no tidbits", not an error to surface.
    () => callback(undefined)
  );
};
