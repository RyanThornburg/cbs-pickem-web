import { KeyboardEvent, PointerEvent, useId, useState } from "react";
import Box from "@mui/material/Box";
import { Game, WinProbabilityPoint } from "../../../../types";
import { useWidth } from "../../../shared/useWidth";
import { STAT_BAR_COLORS } from "../../utils/teamStats";
import {
  clockLabel,
  coverChanges,
  coverMargin,
  coverText,
  gameLength,
  gameMinute,
  scoringMarkers,
  winText,
} from "../../utils/gameFlow";

// Win probability over the game, and the margin against the CBS line under
// it on the same time axis: who's going to win, then who's covering and by
// how much. Hovering, tapping or arrowing through either chart shows the
// same moment in both. Away is the box score's blue and home its orange, so
// the charts match the split bars below them; red and green stay with the
// your-pick badge.

const INK = "rgba(0, 0, 0, 0.87)";
const MUTED = "rgba(0, 0, 0, 0.6)";
const FAINT = "rgba(0, 0, 0, 0.38)";
const GRID = "rgba(0, 0, 0, 0.07)";
const AWAY_TINT = "rgba(31, 119, 208, 0.12)";
const HOME_TINT = "rgba(242, 140, 40, 0.16)";
const PAD = { left: 34, right: 10, top: 8 };

type Kind = "wp" | "margin";

interface Scale {
  x: (minute: number) => number;
  y: (value: number) => number;
  value: (p: WinProbabilityPoint) => number;
  mid: number;
  ticks: { value: number; label: string; side: "home" | "away" | "mid" }[];
}

const scaleFor = (
  kind: Kind,
  width: number,
  height: number,
  bottom: number,
  end: number,
  points: WinProbabilityPoint[],
  spread: number,
  home: string,
  away: string
): Scale => {
  const plotW = width - PAD.left - PAD.right;
  const plotH = height - PAD.top - bottom;
  const x = (m: number) => PAD.left + (m / end) * plotW;
  if (kind === "wp") {
    const y = (v: number) => PAD.top + ((100 - v) / 100) * plotH;
    return {
      x,
      y,
      value: (p) => p.home_win_pct,
      mid: 50,
      ticks: [
        { value: 100, label: home, side: "home" },
        { value: 50, label: "50%", side: "mid" },
        { value: 0, label: away, side: "away" },
      ],
    };
  }
  // Symmetric around the line, in whole touchdowns, at least one each way.
  const most = Math.max(
    0,
    ...points.map((p) => Math.abs(coverMargin(p, spread)))
  );
  const span = Math.max(7, Math.ceil(most / 7) * 7);
  const y = (v: number) => PAD.top + ((span - v) / (2 * span)) * plotH;
  return {
    x,
    y,
    value: (p) => coverMargin(p, spread),
    mid: 0,
    ticks: [
      { value: span, label: home, side: "home" },
      { value: 0, label: "Line", side: "mid" },
      { value: -span, label: away, side: "away" },
    ],
  };
};

function Chart({
  kind,
  title,
  headline,
  points,
  spread,
  game,
  height,
  axis,
  active,
  onActive,
}: {
  kind: Kind;
  title: string;
  headline: string;
  points: WinProbabilityPoint[];
  spread: number;
  game: Game;
  height: number;
  axis: boolean;
  active: number | null;
  onActive: (i: number | null) => void;
}) {
  const [ref, width] = useWidth(520);
  const clipId = useId().replace(/:/g, "");
  const home = game.home_team.abbr;
  const away = game.away_team.abbr;
  const end = gameLength(points);
  const bottom = axis ? 20 : 6;
  const s = scaleFor(
    kind,
    width,
    height,
    bottom,
    end,
    points,
    spread,
    home,
    away
  );
  const plotBottom = height - bottom;
  const coords = points.map((p) => [s.x(gameMinute(p)), s.y(s.value(p))]);
  const path = coords
    .map(([a, b], i) => `${i ? "L" : "M"}${a.toFixed(1)},${b.toFixed(1)}`)
    .join("");
  const yMid = s.y(s.mid);
  const area =
    coords.length > 1
      ? `${path}L${coords[coords.length - 1][0].toFixed(1)},${yMid}L${coords[0][0].toFixed(1)},${yMid}Z`
      : "";
  const markers = kind === "margin" ? scoringMarkers(points) : [];
  const last = points[points.length - 1];
  const quarters = end === 70 ? [15, 30, 45, 60] : [15, 30, 45];
  const periodLabels = ["Q1", "Q2", "Q3", "Q4", ...(end === 70 ? ["OT"] : [])];
  const activePoint = active == null ? undefined : points[active];

  const nearest = (event: PointerEvent<SVGSVGElement>) => {
    const box = event.currentTarget.getBoundingClientRect();
    const px = ((event.clientX - box.left) / box.width) * width;
    let best = 0;
    let bestD = Infinity;
    points.forEach((p, i) => {
      const d = Math.abs(s.x(gameMinute(p)) - px);
      if (d <= bestD) {
        bestD = d;
        best = i;
      }
    });
    return best;
  };
  const onKeyDown = (event: KeyboardEvent<SVGSVGElement>) => {
    const step = event.shiftKey ? 10 : 1;
    const from = active ?? points.length - 1;
    if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
      event.preventDefault();
      const to = from + (event.key === "ArrowRight" ? step : -step);
      onActive(Math.max(0, Math.min(points.length - 1, to)));
    } else if (event.key === "Home") {
      event.preventDefault();
      onActive(0);
    } else if (event.key === "End") {
      event.preventDefault();
      onActive(points.length - 1);
    } else if (event.key === "Escape") {
      onActive(null);
    }
  };

  return (
    <Box>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          gap: 1,
          flexWrap: "wrap",
          mb: 0.25,
        }}
      >
        <Box
          component="span"
          sx={{
            fontSize: "0.75rem",
            fontWeight: 700,
            color: "text.secondary",
            textTransform: "uppercase",
            letterSpacing: "0.04em",
          }}
        >
          {title}
        </Box>
        <Box
          component="span"
          sx={{ fontSize: "0.8125rem", fontVariantNumeric: "tabular-nums" }}
        >
          {headline}
        </Box>
      </Box>
      <Box ref={ref}>
        <svg
          width={width}
          height={height}
          viewBox={`0 0 ${width} ${height}`}
          style={{
            display: "block",
            overflow: "visible",
            touchAction: "pan-y",
          }}
          tabIndex={0}
          role="img"
          aria-label={`${title}: ${headline}. Use the left and right arrow keys to step through the game.`}
          onPointerMove={(e) => onActive(nearest(e))}
          onPointerDown={(e) => onActive(nearest(e))}
          onPointerLeave={(e) => e.pointerType === "mouse" && onActive(null)}
          onFocus={() => onActive(active ?? points.length - 1)}
          onBlur={() => onActive(null)}
          onKeyDown={onKeyDown}
        >
          <defs>
            <clipPath id={`above${clipId}`}>
              <rect x={0} y={0} width={width} height={yMid} />
            </clipPath>
            <clipPath id={`below${clipId}`}>
              <rect x={0} y={yMid} width={width} height={height - yMid} />
            </clipPath>
          </defs>
          <rect
            x={PAD.left}
            y={PAD.top}
            width={width - PAD.left - PAD.right}
            height={plotBottom - PAD.top}
            fill="none"
            stroke={GRID}
          />
          {quarters.map((m) => (
            <line
              key={m}
              x1={s.x(m)}
              x2={s.x(m)}
              y1={PAD.top}
              y2={plotBottom}
              stroke={GRID}
            />
          ))}
          <line
            x1={PAD.left}
            x2={width - PAD.right}
            y1={yMid}
            y2={yMid}
            stroke={FAINT}
            strokeDasharray="4 3"
          />
          {area && (
            <>
              <path
                d={area}
                fill={HOME_TINT}
                clipPath={`url(#above${clipId})`}
              />
              <path
                d={area}
                fill={AWAY_TINT}
                clipPath={`url(#below${clipId})`}
              />
            </>
          )}
          <path
            d={path}
            fill="none"
            stroke={INK}
            strokeWidth={1.6}
            strokeLinejoin="round"
          />
          {markers.map((p, i) => {
            const prev = points[points.indexOf(p) - 1];
            const homeScored = !prev || p.home_score > prev.home_score;
            return (
              <circle
                key={i}
                cx={s.x(gameMinute(p))}
                cy={s.y(s.value(p))}
                r={3.5}
                fill="#fff"
                stroke={
                  homeScored ? STAT_BAR_COLORS.home : STAT_BAR_COLORS.away
                }
                strokeWidth={2}
              />
            );
          })}
          {last && (
            <circle
              cx={s.x(gameMinute(last))}
              cy={s.y(s.value(last))}
              r={4}
              fill={INK}
            />
          )}
          {s.ticks.map((t) => (
            <text
              key={t.value}
              x={PAD.left - 6}
              y={s.y(t.value) + 4}
              textAnchor="end"
              fontSize={11}
              fontWeight={t.side === "mid" ? 400 : 700}
              fill={
                t.side === "home"
                  ? STAT_BAR_COLORS.home
                  : t.side === "away"
                    ? STAT_BAR_COLORS.away
                    : MUTED
              }
            >
              {t.label}
            </text>
          ))}
          {axis &&
            periodLabels.map((label, i) => (
              <text
                key={label}
                x={s.x(i * 15 + (i === 4 ? 5 : 7.5))}
                y={height - 5}
                textAnchor="middle"
                fontSize={11}
                fill={MUTED}
              >
                {label}
              </text>
            ))}
          {activePoint && (
            <>
              <line
                x1={s.x(gameMinute(activePoint))}
                x2={s.x(gameMinute(activePoint))}
                y1={PAD.top}
                y2={plotBottom}
                stroke={MUTED}
              />
              <circle
                cx={s.x(gameMinute(activePoint))}
                cy={s.y(s.value(activePoint))}
                r={4.5}
                fill="#fff"
                stroke={INK}
                strokeWidth={2}
              />
            </>
          )}
        </svg>
      </Box>
    </Box>
  );
}

export function GameFlow({
  game,
  points,
  final,
}: {
  game: Game;
  points: WinProbabilityPoint[];
  // The game is over (the curve may still be the live one for a minute).
  final: boolean;
}) {
  const [active, setActive] = useState<number | null>(null);
  const spread = game.cbs_spread;
  const home = game.home_team.abbr;
  const away = game.away_team.abbr;
  const last = points[points.length - 1];
  if (!last) return null;
  const shown = active == null ? undefined : points[active];
  const scorer = shown && scoringMarkers(points).includes(shown);
  const changes = spread == null ? 0 : coverChanges(points, spread);

  const tooltip = shown && (
    <Box
      role="status"
      sx={{
        fontSize: "0.75rem",
        lineHeight: 1.5,
        fontVariantNumeric: "tabular-nums",
        color: "text.secondary",
        minHeight: "1.5em",
      }}
    >
      <Box component="b" sx={{ color: "text.primary" }}>
        {clockLabel(shown)}
      </Box>
      {` · ${away} ${shown.away_score}, ${home} ${shown.home_score} · ${winText(shown, home, away)}`}
      {spread != null && ` · ${coverText(shown, spread, home, away)}`}
      {scorer && " · scoring play"}
    </Box>
  );

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1.25 }}>
      <Chart
        kind="wp"
        title="Win probability"
        headline={
          final
            ? last.home_score === last.away_score
              ? "Tie"
              : `${last.home_score > last.away_score ? home : away} won`
            : winText(last, home, away)
        }
        points={points}
        spread={spread ?? 0}
        game={game}
        height={92}
        axis={spread == null}
        active={active}
        onActive={setActive}
      />
      {spread != null && (
        <Chart
          kind="margin"
          title="Against the CBS line"
          headline={coverText(last, spread, home, away, final)}
          points={points}
          spread={spread}
          game={game}
          height={112}
          axis
          active={active}
          onActive={setActive}
        />
      )}
      {/* The moment being read sits in a line under the charts rather than
          a floating tooltip, so it never covers the curve on a phone. */}
      {tooltip ?? (
        <Box
          sx={{
            fontSize: "0.75rem",
            lineHeight: 1.5,
            color: "text.secondary",
            minHeight: "1.5em",
          }}
        >
          {spread != null && (
            <>
              The cover changed hands{" "}
              <Box component="b" sx={{ color: "text.primary" }}>
                {changes} {changes === 1 ? "time" : "times"}
              </Box>
              {final ? "" : " so far"}.{" "}
            </>
          )}
          Hover or tap a chart to read any moment.
        </Box>
      )}
    </Box>
  );
}
