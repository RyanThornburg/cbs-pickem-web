import { pollJson } from "../../api/pickemApi";
import { HistoricalRecords } from "../types";

// meta:historical only changes when a season closes, so this barely needs
// to poll -- 30 min matches the other season-level data.
const POLL_INTERVAL_MS = 30 * 60_000;

export const GetHistorical = (
  callback: (records: HistoricalRecords) => void
) =>
  pollJson<HistoricalRecords>("/api/historical", POLL_INTERVAL_MS, callback, (error) =>
    console.error("Failed to fetch historical records", error)
  );
