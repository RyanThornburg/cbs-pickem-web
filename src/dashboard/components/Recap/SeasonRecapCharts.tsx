import { Box, Paper, Stack, Typography, useTheme } from "@mui/material";
import { useEffect, useRef, useState } from "react";
import {
  RecapChaosPoint,
  RecapPoolAccuracyPoint,
  WeekRecap,
} from "../../types";

// Week-over-week charts for Trends › Season, from the recap key's `series`
// (every week through the selected one). Hand-drawn SVG: two single-series
// charts don't justify a chart library. Each week's column is one hover /
// focus target (bigger than the mark) that opens a tooltip.
//
// Charts are drawn at their measured on-screen width (not a fixed viewBox
// scaled down), so axis text stays 11px on a phone.

const H = 210;
const PAD = { left: 40, right: 16, top: 24, bottom: 44 };
const PLOT_H = H - PAD.top - PAD.bottom;
// Narrowest column that still fits a "Wk 18" label.
const MIN_LABEL_BAND = 34;

const GOLD = "#d4a017";
const WINLESS = "hsl(0, 65%, 45%)";
const CHAOS = "hsl(18, 85%, 55%)";

const pct = (n: number) => `${(n * 100).toFixed(1)}%`;

// Band layout: each week is centered in its own column, so the first and
// last weeks don't sit on the plot edges.
interface Geom {
  W: number;
  plotW: number;
  band: number;
  x: (i: number) => number;
  // Whether week i gets an x-axis label: thinned out when columns are too
  // narrow, always keeping the latest week.
  labelled: (i: number) => boolean;
}

const geom = (W: number, n: number): Geom => {
  const plotW = W - PAD.left - PAD.right;
  const band = plotW / Math.max(1, n);
  const every = Math.ceil(MIN_LABEL_BAND / band);
  return {
    W,
    plotW,
    band,
    x: (i) => PAD.left + (i + 0.5) * band,
    labelled: (i) =>
      i === n - 1 || ((n - 1 - i) % every === 0 && n - 1 - i >= every),
  };
};

// Width of the chart's container, for drawing at 1:1.
const useWidth = (fallback: number) => {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(fallback);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () =>
      setWidth(Math.max(240, Math.round(el.getBoundingClientRect().width)));
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, width] as const;
};

// Tooltip anchored over a column (x/y in chart pixels).
function ChartTooltip({
  x,
  y,
  W,
  children,
}: {
  x: number;
  y: number;
  W: number;
  children: React.ReactNode;
}) {
  const left = (x / W) * 100;
  return (
    <Box
      role="tooltip"
      sx={{
        position: "absolute",
        left: `${left}%`,
        top: `${(y / H) * 100}%`,
        transform: `translate(${left > 70 ? "-100%" : left < 30 ? "0" : "-50%"}, calc(-100% - 8px))`,
        pointerEvents: "none",
        bgcolor: "background.paper",
        border: 1,
        borderColor: "divider",
        boxShadow: 4,
        borderRadius: 1,
        px: 1.25,
        py: 0.75,
        fontSize: "0.78rem",
        whiteSpace: "nowrap",
        zIndex: 2,
      }}
    >
      {children}
    </Box>
  );
}

function ChartCard({
  title,
  children,
  legend,
  plotRef,
}: {
  title: string;
  children: React.ReactNode;
  legend?: React.ReactNode;
  plotRef: React.Ref<HTMLDivElement>;
}) {
  return (
    <Paper
      variant="outlined"
      sx={{
        p: 1.5,
        textAlign: "left",
        display: "flex",
        flexDirection: "column",
        gap: 1,
        minWidth: 0,
      }}
    >
      <Typography sx={{ fontSize: "0.85rem", fontWeight: 700 }}>
        {title}
      </Typography>
      <Box ref={plotRef} sx={{ position: "relative" }}>
        {children}
      </Box>
      {legend}
    </Paper>
  );
}

const LegendDot = ({
  color,
  hollow,
  label,
}: {
  color: string;
  hollow?: boolean;
  label: string;
}) => (
  <Stack direction="row" spacing={0.6} alignItems="center">
    <svg width="10" height="10" aria-hidden="true">
      <circle
        cx="5"
        cy="5"
        r="4"
        fill={hollow ? "none" : color}
        stroke={color}
        strokeWidth={hollow ? 2 : 0}
      />
    </svg>
    <span>{label}</span>
  </Stack>
);

// Transparent full-height column per week: the hover/focus target.
function HitColumns({
  g,
  labels,
  onActive,
}: {
  g: Geom;
  labels: string[];
  onActive: (i: number | null) => void;
}) {
  return (
    <>
      {labels.map((label, i) => (
        <rect
          key={i}
          x={g.x(i) - g.band / 2}
          y={PAD.top - 10}
          width={g.band}
          height={PLOT_H + 40}
          fill="transparent"
          tabIndex={0}
          aria-label={label}
          onMouseEnter={() => onActive(i)}
          onMouseLeave={() => onActive(null)}
          onFocus={() => onActive(i)}
          onBlur={() => onActive(null)}
          onClick={() => onActive(i)}
          style={{ outline: "none", cursor: "pointer" }}
        />
      ))}
    </>
  );
}

function PoolAccuracyChart({
  series,
  inProgressWeek,
}: {
  series: RecapPoolAccuracyPoint[];
  inProgressWeek: number | null;
}) {
  const theme = useTheme();
  const [active, setActive] = useState<number | null>(null);
  const [plotRef, W] = useWidth(460);
  const n = series.length;
  const g = geom(W, n);
  const accs = series.map((p) => p.accuracy);
  // Whole 10% steps around the data, always including the 50% line.
  const lo = Math.min(0.4, Math.floor((Math.min(...accs) - 0.02) * 10) / 10);
  const hi = Math.max(0.6, Math.ceil((Math.max(...accs) + 0.02) * 10) / 10);
  const y = (v: number) => PAD.top + ((hi - v) / (hi - lo)) * PLOT_H;
  const ticks: number[] = [];
  for (let v = lo; v <= hi + 1e-9; v += 0.1)
    ticks.push(Math.round(v * 10) / 10);
  const pts = series.map((p, i) => ({ x: g.x(i), y: y(p.accuracy), p }));
  const last = pts[pts.length - 1];
  const markY = H - 14;
  const text = theme.palette.text.secondary;
  const line = theme.palette.primary.main;

  return (
    <ChartCard
      title="Pool accuracy by week"
      plotRef={plotRef}
      legend={
        <Stack
          direction="row"
          sx={{
            flexWrap: "wrap",
            columnGap: 2,
            rowGap: 0.5,
            fontSize: "0.75rem",
            color: "text.secondary",
          }}
        >
          {/* In the legend rather than on the line, where it collided with
              the latest week's value on narrow screens. */}
          <Stack direction="row" spacing={0.6} alignItems="center">
            <svg width="16" height="10" aria-hidden="true">
              <line
                x1="0"
                x2="16"
                y1="5"
                y2="5"
                stroke={GOLD}
                strokeWidth="1.5"
                strokeDasharray="4 3"
              />
            </svg>
            <span>50%, a coin flip</span>
          </Stack>
          <LegendDot color={GOLD} label="Someone went 5-0" />
          <LegendDot color={WINLESS} label="Someone went 0-5" />
          {inProgressWeek != null && (
            <LegendDot color={line} hollow label="Week in progress" />
          )}
          <span>Hover or tap a week for names</span>
        </Stack>
      }
    >
      <svg
        viewBox={`0 0 ${W} ${H}`}
        width="100%"
        role="img"
        aria-label={`Pool accuracy by week: ${series.map((p) => `week ${p.week} ${pct(p.accuracy)}`).join(", ")}`}
      >
        {ticks.map((v) => (
          <g key={v}>
            <line
              x1={PAD.left}
              x2={W - PAD.right}
              y1={y(v)}
              y2={y(v)}
              stroke={theme.palette.divider}
              strokeWidth={1}
            />
            <text
              x={PAD.left - 6}
              y={y(v) + 4}
              textAnchor="end"
              fontSize="11"
              fill={text}
            >
              {Math.round(v * 100)}%
            </text>
          </g>
        ))}
        <line
          x1={PAD.left}
          x2={W - PAD.right}
          y1={y(0.5)}
          y2={y(0.5)}
          stroke={GOLD}
          strokeDasharray="4 4"
          strokeWidth={1.5}
        />
        <polyline
          points={pts.map((q) => `${q.x},${q.y}`).join(" ")}
          fill="none"
          stroke={line}
          strokeWidth={2}
          strokeLinejoin="round"
        />
        {pts.map(({ x, y: py, p }, i) => {
          const hollow = p.week === inProgressWeek;
          return (
            <circle
              key={p.week}
              cx={x}
              cy={py}
              r={active === i ? 6 : 5}
              fill={hollow ? theme.palette.background.paper : line}
              stroke={hollow ? line : theme.palette.background.paper}
              strokeWidth={2}
            />
          );
        })}
        {last && (
          <text
            x={last.x}
            y={last.y - 11}
            textAnchor="middle"
            fontSize="12"
            fontWeight={700}
            fill={theme.palette.text.primary}
          >
            {pct(last.p.accuracy)}
          </text>
        )}
        {pts.map(({ x, p }, i) =>
          g.labelled(i) ? (
            <text
              key={p.week}
              x={x}
              y={H - 28}
              textAnchor="middle"
              fontSize="11"
              fill={text}
            >
              Wk {p.week}
            </text>
          ) : null
        )}
        {pts.map(({ x, p }) => (
          <g key={`m${p.week}`}>
            {p.perfect.length > 0 && (
              <circle
                cx={p.winless.length ? x - 6 : x}
                cy={markY}
                r={4}
                fill={GOLD}
              />
            )}
            {p.winless.length > 0 && (
              <circle
                cx={p.perfect.length ? x + 6 : x}
                cy={markY}
                r={4}
                fill={WINLESS}
              />
            )}
          </g>
        ))}
        <HitColumns
          g={g}
          labels={series.map((p) => `Week ${p.week}: ${pct(p.accuracy)}`)}
          onActive={setActive}
        />
      </svg>
      {active != null && pts[active] && (
        <ChartTooltip x={pts[active].x} y={pts[active].y} W={W}>
          <b>
            Week {pts[active].p.week}
            {pts[active].p.week === inProgressWeek ? " (so far)" : ""}:{" "}
            {pct(pts[active].p.accuracy)}
          </b>
          <Box sx={{ color: "text.secondary" }}>
            {pts[active].p.correct} of {pts[active].p.graded} picks
          </Box>
          {pts[active].p.perfect.length > 0 && (
            <Box>
              5-0: {pts[active].p.perfect.map((u) => u.name).join(", ")}
            </Box>
          )}
          {pts[active].p.winless.length > 0 && (
            <Box>
              0-5: {pts[active].p.winless.map((u) => u.name).join(", ")}
            </Box>
          )}
        </ChartTooltip>
      )}
    </ChartCard>
  );
}

function ChaosChart({ series }: { series: RecapChaosPoint[] }) {
  const theme = useTheme();
  const [active, setActive] = useState<number | null>(null);
  const [plotRef, W] = useWidth(460);
  const n = series.length;
  const g = geom(W, n);
  const y = (v: number) => PAD.top + ((10 - v) / 10) * PLOT_H;
  const barW = Math.min(48, g.band * 0.6);
  const text = theme.palette.text.secondary;
  const base = y(0);
  const last = series[series.length - 1];

  return (
    <ChartCard
      title="Chaos index by week"
      plotRef={plotRef}
      legend={
        <Stack
          direction="row"
          sx={{
            flexWrap: "wrap",
            columnGap: 2,
            rowGap: 0.5,
            fontSize: "0.75rem",
            color: "text.secondary",
          }}
        >
          <span>0 = chalk, 10 = chaos</span>
          {series.some((p) => p.partial) && (
            <span>Dashed = week still in progress</span>
          )}
        </Stack>
      }
    >
      <svg
        viewBox={`0 0 ${W} ${H}`}
        width="100%"
        role="img"
        aria-label={`Chaos index by week: ${series.map((p) => `week ${p.week} ${p.index.toFixed(1)}${p.partial ? " so far" : ""}`).join(", ")}`}
      >
        {[0, 5, 10].map((v) => (
          <g key={v}>
            <line
              x1={PAD.left}
              x2={W - PAD.right}
              y1={y(v)}
              y2={y(v)}
              stroke={theme.palette.divider}
              strokeWidth={1}
            />
            <text
              x={PAD.left - 6}
              y={y(v) + 4}
              textAnchor="end"
              fontSize="11"
              fill={text}
            >
              {v}
            </text>
          </g>
        ))}
        {series.map((p, i) => {
          const x = g.x(i) - barW / 2;
          const top = y(p.index);
          const h = Math.max(0, base - top);
          const r = Math.min(4, h);
          // Rounded top only; the bar sits flat on the baseline.
          const d = `M${x},${base} V${top + r} Q${x},${top} ${x + r},${top} H${x + barW - r} Q${x + barW},${top} ${x + barW},${top + r} V${base} Z`;
          return (
            <path
              key={p.week}
              d={d}
              fill={p.partial ? "none" : CHAOS}
              stroke={p.partial ? CHAOS : "none"}
              strokeWidth={p.partial ? 2 : 0}
              strokeDasharray={p.partial ? "4 3" : undefined}
              opacity={active == null || active === i ? 1 : 0.55}
            />
          );
        })}
        {last && (
          <text
            x={g.x(n - 1)}
            y={y(last.index) - 7}
            textAnchor="middle"
            fontSize="12"
            fontWeight={700}
            fill={theme.palette.text.primary}
          >
            {last.index.toFixed(1)}
          </text>
        )}
        {series.map((p, i) =>
          g.labelled(i) ? (
            <text
              key={p.week}
              x={g.x(i)}
              y={H - 28}
              textAnchor="middle"
              fontSize="11"
              fill={text}
            >
              Wk {p.week}
            </text>
          ) : null
        )}
        <HitColumns
          g={g}
          labels={series.map((p) => `Week ${p.week}: ${p.index.toFixed(1)}`)}
          onActive={setActive}
        />
      </svg>
      {active != null && series[active] && (
        <ChartTooltip x={g.x(active)} y={y(series[active].index)} W={W}>
          <b>
            Week {series[active].week}: {series[active].index.toFixed(1)}
            {series[active].partial
              ? ` so far (${series[active].games_final} of ${series[active].games_total} final)`
              : ""}
          </b>
          <Box sx={{ color: "text.secondary" }}>
            Underdogs covered {series[active].underdog_covers} of{" "}
            {series[active].ats_decided} · {series[active].outright_upsets}{" "}
            outright upsets
          </Box>
        </ChartTooltip>
      )}
    </ChartCard>
  );
}

export default function SeasonRecapCharts({
  recap,
}: {
  recap: WeekRecap | undefined;
}) {
  const accuracy = recap?.series.pool_accuracy ?? [];
  const chaos = recap?.series.chaos ?? [];
  if (accuracy.length === 0 && chaos.length === 0) return null;
  const inProgressWeek = recap && !recap.week_complete ? recap.week : null;
  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: {
          xs: "minmax(0, 1fr)",
          md: "repeat(2, minmax(0, 1fr))",
        },
        gap: 1.5,
        mb: 3,
      }}
    >
      {accuracy.length > 0 && (
        <PoolAccuracyChart series={accuracy} inProgressWeek={inProgressWeek} />
      )}
      {chaos.length > 0 && <ChaosChart series={chaos} />}
    </Box>
  );
}
