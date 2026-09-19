import { GameWithOdds } from "../../data/GetGamesTabData";
import { Book, Forecast, Stadium, TeamRecord } from "../../types";

// Thresholds live here (frontend), not the data pipeline -- the data repo
// only captures raw measurements (temp, wind, precip%, visibility, official
// alerts); whether a given reading is "notable" is a display decision, and
// one likely to get retuned during the season, so it doesn't need a
// data-repo deploy to change. Decided 2026-09-17 (see CLAUDE.local.md).
export const WEATHER_THRESHOLDS = {
  windMph: 20,
  gustMph: 20,
  freezingF: 32,
  heavyPrecipPct: 50,
  lowVisibilityMi: 3,
};
export const BIG_MOVE_PTS = 2;
export const CBS_DIVERGE_PTS = 1;

export const fmtSpread = (n: number | undefined | null): string => {
  if (n == null) return "—";
  if (n === 0) return "PK";
  return n > 0 ? `+${n}` : `${n}`;
};

export const fmtMoney = (n: number | undefined | null): string => {
  if (n == null) return "—";
  return n > 0 ? `+${n}` : `${n}`;
};

export const merryskyUrl = (stadium?: Stadium): string | null => {
  if (stadium?.latitude == null || stadium?.longitude == null) return null;
  return `https://merrysky.net/forecast/${stadium.latitude},%20${stadium.longitude}`;
};

export const formatRecord = (record?: TeamRecord): string => {
  if (!record) return "";
  return record.ties > 0
    ? `${record.wins}-${record.losses}-${record.ties}`
    : `${record.wins}-${record.losses}`;
};

// Spread numbers are home-perspective: positive = home is getting points,
// negative = home is giving them up. If the market's close line grants home
// MORE points than CBS does (close > cbs), the market rates home weaker
// than CBS does -- so CBS is too tough on home / too soft on away, and away
// is the side worth more than CBS is charging for it. Mirror image when
// close < cbs: home is the value side.
export const getValueSide = (game: GameWithOdds): "home" | "away" | null => {
  const close = game.market_spread?.close;
  if (close == null || game.cbs_spread == null) return null;
  const delta = close - game.cbs_spread;
  if (Math.abs(delta) < CBS_DIVERGE_PTS) return null;
  return delta > 0 ? "away" : "home";
};

export const getMoveDelta = (game: GameWithOdds): number | null => {
  const open = game.market_spread?.open;
  const close = game.market_spread?.close;
  if (open == null || close == null) return null;
  const delta = close - open;
  return Math.abs(delta) >= BIG_MOVE_PTS ? delta : null;
};

// Most-agreed-on total among the books, not an average -- an average of
// half-point lines (e.g. 54.5/54.5/54.5/55/55) can land on an off number
// like 54.7 that no book actually offers. A total is always a whole or
// half point, same as a spread, so the consensus figure needs to be too.
export const modeTotal = (books: Book[]): number | null => {
  const vals = books
    .map((b) => b.total?.home_point)
    .filter((v): v is number => v != null);
  if (!vals.length) return null;

  const counts = new Map<number, number>();
  vals.forEach((v) => counts.set(v, (counts.get(v) ?? 0) + 1));

  let best = vals[0];
  let bestCount = 0;
  counts.forEach((count, val) => {
    if (count > bestCount) {
      bestCount = count;
      best = val;
    }
  });
  return best;
};

// Bigger is always better, whether that's a less-negative favorite spread
// (-2 beats -3), a bigger underdog number (+8 beats +7), or a cheaper price
// (-105 beats -110, +105 beats -105) -- same rule for spreads, moneylines,
// and prices alike.
export const bestOf = (
  values: (number | null | undefined)[]
): number | null => {
  const present = values.filter((v): v is number => v != null);
  return present.length ? Math.max(...present) : null;
};

export const isBest = (
  value: number | null | undefined,
  best: number | null
): boolean => value != null && best != null && Math.abs(value - best) < 0.001;

export interface WeatherFlag {
  label: string;
  tier: "danger" | "warn";
}

// A flood watch/warning next to "Mostly Clear, 94°F" reads as contradictory
// even though it's real data (the alert can cover a wider window, or trail
// earlier rain) -- only surface a flood-type alert when the forecast itself
// still shows a rain signal at this snapshot. Other alert types (Heat
// Advisory, wind, winter storm, etc.) aren't filtered -- those already line
// up with the displayed condition/temp, nothing contradictory to hide.
const isFloodAlert = (alert: string): boolean => /flood/i.test(alert);

const hasRainSignal = (forecast: Forecast): boolean =>
  forecast.precip_type === "rain" ||
  forecast.precipitation_pct > 0 ||
  /rain|drizzle|shower|storm/i.test(forecast.condition);

// Raw measurements come straight from the forecast payload; only the "does
// this cross a line worth calling out" judgment happens here.
export const weatherFlags = (forecast: Forecast): WeatherFlag[] => {
  const flags: WeatherFlag[] = [];
  if (forecast.weather_alert && (!isFloodAlert(forecast.weather_alert) || hasRainSignal(forecast))) {
    flags.push({ label: forecast.weather_alert, tier: "danger" });
  }
  if (forecast.wind_speed_mph >= WEATHER_THRESHOLDS.windMph) {
    flags.push({ label: `High Wind ${forecast.wind_speed_mph}mph`, tier: "warn" });
  } else if (forecast.wind_gust_mph >= WEATHER_THRESHOLDS.gustMph) {
    flags.push({ label: `Gusts to ${forecast.wind_gust_mph}mph`, tier: "warn" });
  }
  if (forecast.temp_f <= WEATHER_THRESHOLDS.freezingF) {
    flags.push({ label: `Freezing ${forecast.temp_f}°F`, tier: "warn" });
  }
  if (forecast.precipitation_pct >= WEATHER_THRESHOLDS.heavyPrecipPct) {
    flags.push({ label: `${forecast.precipitation_pct}% Precip`, tier: "warn" });
  }
  if (
    forecast.visibility_mi != null &&
    forecast.visibility_mi < WEATHER_THRESHOLDS.lowVisibilityMi
  ) {
    flags.push({ label: `${forecast.visibility_mi}mi Visibility`, tier: "warn" });
  }
  return flags;
};
