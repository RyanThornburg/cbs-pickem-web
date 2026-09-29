import { pollJson } from "../../api/pickemApi";
import { WeekRecap } from "../types";

// The key is rewritten every 5 minutes, so polling faster buys nothing.
const POLL_INTERVAL_MS = 5 * 60_000;

// The recap shape version this UI was written for. The data repo bumps it
// on any rename or shape change, so a key at another version (or with none,
// like the pre-v2 keys) is treated as no data rather than half-rendered.
export const RECAP_VERSION = 3;

export const GetRecapByWeek = (
  season: number,
  week: number,
  callback: (recap: WeekRecap | undefined) => void
) => {
  if (season === 0 || week === 0) {
    callback(undefined);
    return;
  }

  return pollJson<WeekRecap>(
    `/api/weeks/${season}/${week}/recap`,
    POLL_INTERVAL_MS,
    (data) => {
      if (data.version !== RECAP_VERSION) {
        console.warn(
          `Recap for week ${week} is version ${data.version ?? "none"}, expected ${RECAP_VERSION}`
        );
        callback(undefined);
        return;
      }
      callback(data);
    },
    // A week with no key 404s; that's "no items", not an error to surface.
    () => callback(undefined)
  );
};
