import { WinProbabilityPoint } from "../../../types";
import { formatPts } from "./scoreboardUtils";

// The game-flow charts' math, from the details key's win probability curve:
// game time for the x-axis, the margin against the CBS line, scoring
// markers and how often the cover changed hands.

// Minutes of game time elapsed at a point: 0-60, then up to 70 in a
// regular-season OT (10 minutes). The pre-kickoff point (period 0) is
// minute 0; a point without a clock sits at the start of its period.
export const gameMinute = (point: {
  period: number;
  clock: string | null;
}): number => {
  const { period, clock } = point;
  if (!period) return 0;
  const start = period <= 4 ? (period - 1) * 15 : 60;
  const length = period <= 4 ? 15 : 10;
  const match = clock?.match(/^(\d+):(\d{2})$/);
  if (!match) return start;
  const left = Number(match[1]) + Number(match[2]) / 60;
  return start + Math.max(0, Math.min(length, length - left));
};

// The chart's x-axis end: 60 minutes, or 70 once a point reaches OT.
export const gameLength = (points: WinProbabilityPoint[]): number =>
  points.some((p) => p.period > 4) ? 70 : 60;

// Home margin plus the home CBS line: above 0 the home team is covering,
// below 0 the away team. CBS lines have the hook, so it's never 0.
export const coverMargin = (
  point: { home_score: number; away_score: number },
  cbsSpread: number
): number => point.home_score - point.away_score + cbsSpread;

// Scoring points to mark on the chart. The live curve often has a touchdown
// and its extra point as two points at the same clock (6-7, then 7-7), and
// ESPN's final curve marks fewer; so a marker is any point where the score
// changed, merged with others at the same period and clock (keeping the
// last, the full score).
export const scoringMarkers = (
  points: WinProbabilityPoint[]
): WinProbabilityPoint[] => {
  const out: WinProbabilityPoint[] = [];
  points.forEach((p, i) => {
    const prev = points[i - 1];
    const changed = prev
      ? p.home_score !== prev.home_score || p.away_score !== prev.away_score
      : p.home_score + p.away_score > 0;
    if (!changed) return;
    const last = out[out.length - 1];
    if (last && last.period === p.period && last.clock === p.clock) {
      out[out.length - 1] = p;
    } else {
      out.push(p);
    }
  });
  return out;
};

// How many times the team covering the CBS line switched.
export const coverChanges = (
  points: WinProbabilityPoint[],
  cbsSpread: number
): number => {
  let changes = 0;
  let side: boolean | null = null;
  for (const p of points) {
    const home = coverMargin(p, cbsSpread) > 0;
    if (side !== null && home !== side) changes++;
    side = home;
  }
  return changes;
};

export const clockLabel = (p: WinProbabilityPoint): string =>
  !p.period
    ? "Kickoff"
    : `${p.period > 4 ? "OT" : `Q${p.period}`}${p.clock ? ` ${p.clock}` : ""}`;

// "CLE 60% to win"; rounding never claims 100% for a moment in the game.
export const winText = (
  p: WinProbabilityPoint,
  home: string,
  away: string
): string => {
  const homeAhead = p.home_win_pct >= 50;
  const pct = homeAhead ? p.home_win_pct : 100 - p.home_win_pct;
  const shown = Math.min(99, Math.round(pct));
  return `${homeAhead ? home : away} ${shown}% to win`;
};

// "CLE covering by 2½", or "covered" once the game is over.
export const coverText = (
  p: WinProbabilityPoint,
  cbsSpread: number,
  home: string,
  away: string,
  final = false
): string => {
  const m = coverMargin(p, cbsSpread);
  return `${m > 0 ? home : away} ${final ? "covered" : "covering"} by ${formatPts(Math.abs(m))}`;
};
