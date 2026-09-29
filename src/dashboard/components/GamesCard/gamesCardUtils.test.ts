import dayjs from "dayjs";
import { Book, Forecast, HourlyForecast, WeatherAlert } from "../../types";
import { GameWithOdds } from "../../data/GetGamesTabData";
import {
  bestOf,
  fmtSpread,
  formatRecord,
  getMoveDelta,
  getTotalResult,
  getValueSide,
  isBest,
  modeTotal,
  weatherFlags,
  weatherTrends,
} from "./gamesCardUtils";

const hour = (time: string, overrides: Partial<HourlyForecast> = {}): HourlyForecast => ({
  time,
  temp_f: 60,
  feels_like_f: 60,
  condition: "Cloudy",
  precip_type: "rain",
  precipitation_pct: 0,
  wind_speed_mph: 5,
  wind_gust_mph: 8,
  ...overrides,
});

const forecast = (overrides: Partial<Forecast> = {}, hours: HourlyForecast[] = []): Forecast => ({
  temp_f: 60,
  feels_like_f: 60,
  condition: "Cloudy",
  precip_type: "rain",
  wind_speed_mph: 5,
  wind_gust_mph: 8,
  precipitation_pct: 0,
  visibility_mi: 10,
  weather_alerts: [],
  during_game: {
    precipitation_pct_max: hours.length ? Math.max(...hours.map((h) => h.precipitation_pct)) : null,
    precip_type: hours.length ? "rain" : null,
    wind_gust_mph_max: null,
    temp_f_low: null,
    temp_f_high: null,
    snow_accumulation_in: hours.length ? 0 : null,
    hours,
  },
  ...overrides,
});

const alert = (title: string): WeatherAlert => ({
  title,
  severity: null,
  starts: null,
  expires: null,
  uri: null,
});

const H1 = "2026-09-27T17:00:00Z";
const H2 = "2026-09-27T18:00:00Z";
const H3 = "2026-09-27T19:00:00Z";
const at = (t: string) => dayjs(t).format("hA");

describe("weatherTrends", () => {
  it("is empty outside the hourly window (hours: [])", () => {
    expect(weatherTrends(forecast({ precipitation_pct: 40 }))).toEqual([]);
  });

  it("is empty for a steady game", () => {
    const hrs = [H1, H2, H3].map((t) => hour(t, { precipitation_pct: 7 }));
    expect(weatherTrends(forecast({ precipitation_pct: 5 }, hrs))).toEqual([]);
  });

  it("calls out rain arriving mid-game (SEA @ WAS, week 3)", () => {
    const hrs = [
      hour(H1, { condition: "Drizzle and Breezy", precipitation_pct: 38 }),
      hour(H2, { condition: "Light Rain", precipitation_pct: 68 }),
      hour(H3, { condition: "Light Rain and Breezy", precipitation_pct: 63 }),
    ];
    expect(weatherTrends(forecast({ precipitation_pct: 38 }, hrs))).toEqual([
      { direction: "up", worsening: true, label: `Rain 68% by ${at(H2)}` },
    ]);
  });

  it("calls out clearing (TEN @ NYG, week 3)", () => {
    const hrs = [
      hour(H1, { precipitation_pct: 52 }),
      hour(H2, { precipitation_pct: 52 }),
      hour(H3, { precipitation_pct: 36 }),
    ];
    expect(weatherTrends(forecast({ precipitation_pct: 52 }, hrs))).toEqual([
      { direction: "down", worsening: false, label: `Rain 36% by ${at(H3)}` },
    ]);
  });

  it("calls out a notable rise that stays under 50%", () => {
    const hrs = [hour(H1, { precipitation_pct: 10 }), hour(H2, { precipitation_pct: 35 })];
    expect(weatherTrends(forecast({ precipitation_pct: 10 }, hrs))).toEqual([
      { direction: "up", worsening: true, label: `Rain 35% by ${at(H2)}` },
    ]);
  });

  it("reports the wettest hour, not the first to qualify", () => {
    const hrs = [hour(H1, { precipitation_pct: 10 }), hour(H2, { precipitation_pct: 35 }), hour(H3, { precipitation_pct: 70 })];
    expect(weatherTrends(forecast({ precipitation_pct: 10 }, hrs))).toEqual([
      { direction: "up", worsening: true, label: `Rain 70% by ${at(H3)}` },
    ]);
  });

  it("ignores small rises that never get notable", () => {
    const hrs = [hour(H1), hour(H2, { precipitation_pct: 20 })];
    expect(weatherTrends(forecast({}, hrs))).toEqual([]);
  });

  it("uses Snow when the condition is snowy", () => {
    const hrs = [hour(H1), hour(H2, { condition: "Light Snow", precipitation_pct: 60, temp_f: 30 })];
    expect(weatherTrends(forecast({ temp_f: 34 }, hrs))).toEqual([
      { direction: "up", worsening: true, label: `Snow 60% by ${at(H2)}` },
      { direction: "down", worsening: true, label: `Freezing by ${at(H2)} (30°F)` },
    ]);
  });

  it("ignores temp swings that don't cross an extreme", () => {
    const hrs = [hour(H1, { temp_f: 54 }), hour(H2, { temp_f: 45 })];
    expect(weatherTrends(forecast({ temp_f: 54 }, hrs))).toEqual([]);
  });

  it("calls out heat crossing 90", () => {
    const hrs = [hour(H1, { temp_f: 88 }), hour(H2, { temp_f: 91 })];
    expect(weatherTrends(forecast({ temp_f: 88 }, hrs))).toEqual([
      { direction: "up", worsening: true, label: `91°F by ${at(H2)}` },
    ]);
  });
});

describe("weatherFlags", () => {
  it("flags the during-game peak, not just kickoff", () => {
    const hrs = [hour(H1, { precipitation_pct: 38 }), hour(H2, { precipitation_pct: 68, wind_gust_mph: 24 })];
    const labels = weatherFlags(forecast({ precipitation_pct: 38 }, hrs)).map((f) => f.label);
    expect(labels).toEqual(["Gusts to 24mph", "68% Precip"]);
  });

  it("falls back to kickoff values without hourly data", () => {
    expect(weatherFlags(forecast({ precipitation_pct: 55 })).map((f) => f.label)).toEqual(["55% Precip"]);
  });

  it("flags snow accumulation over precip %", () => {
    const f = forecast({}, [hour(H1, { precipitation_pct: 80, condition: "Snow" })]);
    f.during_game!.snow_accumulation_in = 1.24;
    expect(weatherFlags(f).map((x) => x.label)).toEqual(["Snow 1.2in"]);
  });

  it("works on forecasts that predate during_game", () => {
    const f = forecast({ temp_f: 28 });
    delete f.during_game;
    expect(weatherFlags(f).map((x) => x.label)).toEqual(["Freezing 28°F"]);
    expect(weatherTrends(f)).toEqual([]);
  });

  it("flags each distinct alert title once", () => {
    const f = forecast({
      precipitation_pct: 60,
      weather_alerts: [alert("Flood Watch"), alert("Flood Watch"), alert("Wind Advisory")],
    });
    expect(weatherFlags(f).map((x) => x.label)).toEqual(["Flood Watch", "Wind Advisory", "60% Precip"]);
  });

  it("hides a flood alert on a dry forecast (MIN @ CHI, week 2)", () => {
    const f = forecast({ condition: "Overcast", precip_type: "none", weather_alerts: [alert("Flood Watch")] });
    expect(weatherFlags(f)).toEqual([]);
  });

  it("keeps a flood alert when rain shows up during the game", () => {
    const f = forecast(
      { condition: "Overcast", precip_type: "none", weather_alerts: [alert("Flood Watch")] },
      [hour(H1), hour(H2, { precipitation_pct: 20 })]
    );
    expect(weatherFlags(f).map((x) => x.label)).toEqual(["Flood Watch"]);
  });
});

const oddsGame = (overrides: Partial<GameWithOdds> = {}): GameWithOdds =>
  ({ market_spread: null, books: [], ...overrides }) as GameWithOdds;
const market = (open: number, close: number) => ({ book_count: 5, open, open_agreement: 1, close, close_agreement: 1 });

describe("odds helpers", () => {
  it("getValueSide: the side CBS undercharges, once the market is 1+ point off", () => {
    // Market gives home more points than CBS: market rates home weaker, so away is the value.
    expect(getValueSide(oddsGame({ cbs_spread: -3, market_spread: market(-3, -2) }))).toBe("away");
    expect(getValueSide(oddsGame({ cbs_spread: -3, market_spread: market(-3, -4.5) }))).toBe("home");
    expect(getValueSide(oddsGame({ cbs_spread: -3, market_spread: market(-3, -3.5) }))).toBeNull();
    expect(getValueSide(oddsGame({ cbs_spread: undefined, market_spread: market(-3, -6) }))).toBeNull();
    expect(getValueSide(oddsGame({ cbs_spread: -3 }))).toBeNull();
  });

  it("getMoveDelta: open-to-close moves of 2+ points only", () => {
    expect(getMoveDelta(oddsGame({ market_spread: market(-3, -5) }))).toBe(-2);
    expect(getMoveDelta(oddsGame({ market_spread: market(1, 4.5) }))).toBe(3.5);
    expect(getMoveDelta(oddsGame({ market_spread: market(-3, -4.5) }))).toBeNull();
    expect(getMoveDelta(oddsGame())).toBeNull();
  });

  it("getTotalResult: over, under, or null on a push or with no score", () => {
    expect(getTotalResult(oddsGame({ home_score: 24, away_score: 21 }), 44.5)).toBe("over");
    expect(getTotalResult(oddsGame({ home_score: 20, away_score: 21 }), 44.5)).toBe("under");
    expect(getTotalResult(oddsGame({ home_score: 24, away_score: 20 }), 44)).toBeNull();
    expect(getTotalResult(oddsGame({ home_score: 24, away_score: 21 }), null)).toBeNull();
    expect(getTotalResult(oddsGame(), 44.5)).toBeNull();
  });

  it("modeTotal: the most common book total (the Over line), not an average", () => {
    const book = (total?: number | null): Book => ({
      bookmaker: "b",
      total: total === undefined ? undefined : { home_point: total, home_price: -110, away_point: total, away_price: -110, captured_at: "" },
    });
    expect(modeTotal([54.5, 54.5, 54.5, 55, 55].map(book))).toBe(54.5);
    expect(modeTotal([book(47), book(undefined), book(null), book(47.5), book(47.5)])).toBe(47.5);
    // A tie goes to the value seen first.
    expect(modeTotal([book(44), book(44.5)])).toBe(44);
    expect(modeTotal([book(undefined)])).toBeNull();
    expect(modeTotal([])).toBeNull();
  });

  it("bestOf / isBest: bigger is better for spreads and prices alike", () => {
    expect(bestOf([-3, -2.5, null, undefined, -3.5])).toBe(-2.5);
    expect(bestOf([-110, -105, 100])).toBe(100);
    expect(bestOf([null, undefined])).toBeNull();
    expect(isBest(-2.5, -2.5)).toBe(true);
    expect(isBest(-3, -2.5)).toBe(false);
    expect(isBest(null, -2.5)).toBe(false);
    expect(isBest(-2.5, null)).toBe(false);
  });

  it("formats spreads and records", () => {
    expect(fmtSpread(3.5)).toBe("+3.5");
    expect(fmtSpread(-7)).toBe("-7");
    expect(fmtSpread(0)).toBe("PK");
    expect(fmtSpread(null)).toBe("—");
    expect(formatRecord({ wins: 2, losses: 1, ties: 0 })).toBe("2-1");
    expect(formatRecord({ wins: 2, losses: 1, ties: 1 })).toBe("2-1-1");
    expect(formatRecord(undefined)).toBe("");
  });
});
