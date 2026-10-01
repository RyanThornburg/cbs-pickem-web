import { GameWithOdds } from "../../data/GetGamesTabData";
import dayjs from "dayjs";
import {
  Book,
  Forecast,
  GameStatus,
  HourlyForecast,
  Stadium,
  TeamRecord,
} from "../../types";

// Thresholds live here (frontend), not the data pipeline -- the data repo
// only captures raw measurements (temp, wind, precip%, visibility, official
// alerts); whether a given reading is "notable" is a display decision, and
// one likely to get retuned during the season, so it doesn't need a
// data-repo deploy to change. Decided 2026-09-17 (see CLAUDE.local.md).
export const WEATHER_THRESHOLDS = {
  windMph: 20,
  gustMph: 20,
  freezingF: 32,
  hotF: 90,
  heavyPrecipPct: 50,
  lowVisibilityMi: 3,
  snowAccumIn: 0.1,
};
// During-game trend notes: only call out a precip change when it crosses
// into "likely" (heavyPrecipPct), or shifts by at least shiftPts and the
// wetter side of the shift is at least minNotablePct -- 0% -> 12% isn't news.
export const PRECIP_TREND = {
  shiftPts: 15,
  minNotablePct: 30,
};
export const BIG_MOVE_PTS = 2;
export const CBS_DIVERGE_PTS = 1;

// A real minus sign (U+2212), not a hyphen: with tabular figures Inter gives
// the hyphen a digit-wide slot, which reads as "- 3.5". The minus fills it
// the way "+" does.
const signed = (n: number): string =>
  n > 0 ? `+${n}` : `\u2212${Math.abs(n)}`;

export const fmtSpread = (n: number | undefined | null): string => {
  if (n == null) return "—";
  if (n === 0) return "PK";
  return signed(n);
};

export const fmtMoney = (n: number | undefined | null): string => {
  if (n == null) return "—";
  return signed(n);
};

// A home-perspective line as the favorite gives it: +3 at PIT@CLE (CLE
// getting 3) reads "PIT −3". A bare signed number sat on the away team's
// row and read as that team's line.
export const fmtTeamLine = (
  n: number | undefined | null,
  game: Pick<GameWithOdds, "home_team" | "away_team">
): string => {
  if (n == null) return "—";
  if (n === 0) return "Pick'em";
  const favorite = n < 0 ? game.home_team.abbr : game.away_team.abbr;
  return `${favorite} \u2212${Math.abs(n)}`;
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

// The team the market moved toward (became more favored or less of an
// underdog). Home-perspective numbers rise as home gets more points, so a
// positive move is toward the away team.
export const moveTowardAbbr = (game: GameWithOdds, move: number): string =>
  move > 0 ? game.away_team.abbr : game.home_team.abbr;

// Who covered the CBS line (the one the pool scores against) once a game is
// final, or "Push". coveringTeamId is measured against the CBS line.
export const cbsCoverNote = (game: GameWithOdds): string | null => {
  if (game.status !== GameStatus.Final || game.cbs_spread == null) return null;
  if (game.coveringTeamId == null) return "Push";
  const team =
    game.coveringTeamId === game.home_team.id ? game.home_team : game.away_team;
  return `${team.abbr} covered`;
};

// The tooltip behind the "ARI edge" tag: how much easier the CBS line is
// for the value side than the market's.
export const edgeTitle = (
  game: GameWithOdds,
  side: "home" | "away"
): string => {
  const diff = Math.abs(
    (game.market_spread?.close ?? 0) - (game.cbs_spread ?? 0)
  );
  const abbr = side === "home" ? game.home_team.abbr : game.away_team.abbr;
  return `CBS line is ${diff} easier for ${abbr} than Vegas`;
};

export const getMoveDelta = (game: GameWithOdds): number | null => {
  const open = game.market_spread?.open;
  const close = game.market_spread?.close;
  if (open == null || close == null) return null;
  const delta = close - open;
  return Math.abs(delta) >= BIG_MOVE_PTS ? delta : null;
};

// Whether the combined final score landed over or under the displayed total
// line -- null on a push or when there's nothing final to compare yet.
// Callers gate this on game.status === Final themselves (mirrors coveringTeamId).
export const getTotalResult = (
  game: GameWithOdds,
  line: number | null
): "over" | "under" | null => {
  if (line == null || game.home_score == null || game.away_score == null) {
    return null;
  }
  const actual = game.home_score + game.away_score;
  if (actual === line) return null;
  return actual > line ? "over" : "under";
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

// Which books offer the best bet on one side of a spread or total: the best
// point first, then the best price among those. "higher" points win for a
// spread side (+3 beats +2.5, -2 beats -2.5) and the Under; "lower" wins for
// the Over. Books tied on both get marked alike, since they're the same bet.
export const bestOfferIndexes = (
  offers: { point?: number | null; price?: number | null }[],
  better: "higher" | "lower"
): Set<number> => {
  const sign = better === "higher" ? 1 : -1;
  const points = offers
    .map((o) => o.point)
    .filter((p): p is number => p != null)
    .map((p) => p * sign);
  if (!points.length) return new Set();
  const bestPoint = Math.max(...points);
  const atBestPoint = offers
    .map((o, i) => ({ o, i }))
    .filter(
      ({ o }) => o.point != null && Math.abs(o.point * sign - bestPoint) < 0.001
    );
  const bestPrice = bestOf(atBestPoint.map(({ o }) => o.price));
  return new Set(
    atBestPoint
      .filter(({ o }) => bestPrice == null || isBest(o.price, bestPrice))
      .map(({ i }) => i)
  );
};

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

// Empty `hours` means the game is still outside the hourly-forecast window
// (during_game's fields are all null then) -- fall back to kickoff-only.
export const duringGameHours = (forecast: Forecast): HourlyForecast[] =>
  forecast.during_game?.hours ?? [];

const hasRainSignal = (forecast: Forecast): boolean =>
  forecast.precip_type === "rain" ||
  forecast.precipitation_pct > 0 ||
  /rain|drizzle|shower|storm/i.test(forecast.condition) ||
  duringGameHours(forecast).some(
    (h) =>
      h.precipitation_pct > 0 || /rain|drizzle|shower|storm/i.test(h.condition)
  );

// Worst case across kickoff + every during-game hour, so a game that's dry
// at kickoff but wet by the 2nd quarter still gets flagged.
const gameExtremes = (forecast: Forecast) => {
  const hours = duringGameHours(forecast);
  const dg = forecast.during_game;
  return {
    windMph: Math.max(
      forecast.wind_speed_mph,
      ...hours.map((h) => h.wind_speed_mph)
    ),
    gustMph: Math.max(
      forecast.wind_gust_mph,
      ...hours.map((h) => h.wind_gust_mph)
    ),
    tempLow: Math.min(forecast.temp_f, ...hours.map((h) => h.temp_f)),
    tempHigh: Math.max(forecast.temp_f, ...hours.map((h) => h.temp_f)),
    precipPct: Math.max(
      forecast.precipitation_pct,
      ...hours.map((h) => h.precipitation_pct)
    ),
    snowIn: hours.length ? (dg?.snow_accumulation_in ?? 0) : 0,
  };
};

// Raw measurements come straight from the forecast payload; only the "does
// this cross a line worth calling out" judgment happens here.
export const weatherFlags = (forecast: Forecast): WeatherFlag[] => {
  const flags: WeatherFlag[] = [];
  const x = gameExtremes(forecast);
  // A game can carry several alerts; dedupe by title so two overlapping
  // "Flood Watch" entries don't render as two identical flags.
  const alertTitles = new Set(
    (forecast.weather_alerts ?? []).map((a) => a.title).filter(Boolean)
  );
  alertTitles.forEach((title) => {
    if (!isFloodAlert(title) || hasRainSignal(forecast)) {
      flags.push({ label: title, tier: "danger" });
    }
  });
  if (x.windMph >= WEATHER_THRESHOLDS.windMph) {
    flags.push({ label: `High Wind ${x.windMph}mph`, tier: "warn" });
  } else if (x.gustMph >= WEATHER_THRESHOLDS.gustMph) {
    flags.push({ label: `Gusts to ${x.gustMph}mph`, tier: "warn" });
  }
  if (x.tempLow <= WEATHER_THRESHOLDS.freezingF) {
    flags.push({ label: `Freezing ${x.tempLow}°F`, tier: "warn" });
  } else if (x.tempHigh >= WEATHER_THRESHOLDS.hotF) {
    flags.push({ label: `Hot ${x.tempHigh}°F`, tier: "warn" });
  }
  if (x.snowIn >= WEATHER_THRESHOLDS.snowAccumIn) {
    flags.push({
      label: `Snow ${Math.round(x.snowIn * 10) / 10}in`,
      tier: "warn",
    });
  } else if (x.precipPct >= WEATHER_THRESHOLDS.heavyPrecipPct) {
    flags.push({ label: `${x.precipPct}% Precip`, tier: "warn" });
  }
  if (
    forecast.visibility_mi != null &&
    forecast.visibility_mi < WEATHER_THRESHOLDS.lowVisibilityMi
  ) {
    flags.push({
      label: `${forecast.visibility_mi}mi Visibility`,
      tier: "warn",
    });
  }
  return flags;
};

export interface WeatherTrend {
  direction: "up" | "down";
  // Arrow and severity are independent: "below freezing" points down but is
  // worse weather, "clearing" points down and is better.
  worsening: boolean;
  label: string;
}

// "2PM", no space -- trend notes sit in a narrow column on mobile.
const fmtHour = (time: string): string => dayjs(time).format("hA");

const precipWord = (condition: string): string =>
  /snow|sleet|flurr|ice/i.test(condition) ? "Snow" : "Rain";

// How conditions change *after* kickoff, as short notes under the kickoff
// line. Empty for a steady game (most of them) or when there's no hourly
// data yet. Temps only count when they cross into an extreme -- 54 -> 45 is
// a non-event, dropping below freezing isn't.
export const weatherTrends = (forecast: Forecast): WeatherTrend[] => {
  const hours = duringGameHours(forecast);
  if (!hours.length) return [];
  const trends: WeatherTrend[] = [];
  const { heavyPrecipPct, freezingF, hotF } = WEATHER_THRESHOLDS;
  const kickPct = forecast.precipitation_pct;

  // Labels stay short ("Rain 68% by 2PM", same shape up or down) -- they
  // sit in a ~125px column on mobile. Anchored on the wettest (or driest)
  // hour rather than the first one to qualify, so 10% -> 35% -> 70% reads
  // "70%", not "35%". The % carries how likely it is, so crossing into
  // "likely" and a smaller notable rise share one label.
  const wettest = hours.reduce((a, h) =>
    h.precipitation_pct > a.precipitation_pct ? h : a
  );
  const driest = hours.reduce((a, h) =>
    h.precipitation_pct < a.precipitation_pct ? h : a
  );
  const rising =
    ((kickPct < heavyPrecipPct &&
      wettest.precipitation_pct >= heavyPrecipPct) ||
      (wettest.precipitation_pct - kickPct >= PRECIP_TREND.shiftPts &&
        wettest.precipitation_pct >= PRECIP_TREND.minNotablePct)) &&
    wettest;
  const clearing =
    kickPct >= PRECIP_TREND.minNotablePct &&
    kickPct - driest.precipitation_pct >= PRECIP_TREND.shiftPts &&
    driest;

  if (rising) {
    trends.push({
      direction: "up",
      worsening: true,
      label: `${precipWord(rising.condition)} ${rising.precipitation_pct}% by ${fmtHour(rising.time)}`,
    });
  } else if (clearing) {
    trends.push({
      direction: "down",
      worsening: false,
      // Not "Clearing by 3PM (36%)" -- that read as a 36% chance of
      // clearing. Name the precip so the % is unambiguous; the word comes
      // from kickoff, since the driest hour's condition may just be "Cloudy".
      label: `${precipWord(forecast.condition)} ${clearing.precipitation_pct}% by ${fmtHour(clearing.time)}`,
    });
  }

  if (forecast.temp_f > freezingF) {
    const freeze = hours.find((h) => h.temp_f <= freezingF);
    if (freeze) {
      trends.push({
        direction: "down",
        worsening: true,
        label: `Freezing by ${fmtHour(freeze.time)} (${freeze.temp_f}°F)`,
      });
    }
  }
  if (forecast.temp_f < hotF) {
    const heat = hours.find((h) => h.temp_f >= hotF);
    if (heat) {
      trends.push({
        direction: "up",
        worsening: true,
        label: `${heat.temp_f}°F by ${fmtHour(heat.time)}`,
      });
    }
  }
  return trends;
};
