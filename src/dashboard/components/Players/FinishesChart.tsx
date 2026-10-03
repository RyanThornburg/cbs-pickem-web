import Box from "@mui/material/Box";
import { ordinal } from "../../helper";
import { useWidth } from "../shared/useWidth";
import { FinishPoint } from "./playerUtils";

const HEIGHT = 186;
const PAD = { top: 22, right: 14, bottom: 36, left: 34 };
const GOLD = "#d4a017";
const INK = "hsl(220, 20%, 25%)";
const MUTED = "rgba(0, 0, 0, 0.6)";

// Finish by season, 1st at the top, with each finish written over its dot
// (so nothing hides in a tooltip). This season's place so far is the hollow
// blue dot at the end, joined by a dashed line since it isn't final.
export function FinishesChart({ points }: { points: FinishPoint[] }) {
  const [ref, width] = useWidth(560);
  const maxRank = Math.max(10, ...points.map((p) => p.rank));
  const plotW = width - PAD.left - PAD.right;
  const plotH = HEIGHT - PAD.top - PAD.bottom;
  const x = (i: number) =>
    PAD.left +
    (points.length === 1 ? plotW / 2 : (i * plotW) / (points.length - 1));
  const y = (rank: number) => PAD.top + ((rank - 1) / (maxRank - 1)) * plotH;
  const ticks = [
    1,
    5,
    10,
    ...(maxRank > 15 ? [Math.ceil(maxRank / 5) * 5] : []),
  ];
  // Thin the year labels when columns get narrow.
  const step = plotW / Math.max(1, points.length - 1) < 34 ? 2 : 1;
  const closed = points.filter((p) => !p.current);
  const current = points.find((p) => p.current);

  return (
    <Box ref={ref} sx={{ width: "100%", maxWidth: 640 }}>
      <svg
        width={width}
        height={HEIGHT}
        role="img"
        aria-label={`Finish by season: ${points
          .map(
            (p) => `${p.season} ${ordinal(p.rank)}${p.current ? " so far" : ""}`
          )
          .join(", ")}`}
        style={{ display: "block" }}
      >
        {ticks.map((rank) => (
          <g key={rank}>
            <line
              x1={PAD.left}
              x2={width - PAD.right}
              y1={y(rank)}
              y2={y(rank)}
              stroke="rgba(0, 0, 0, 0.08)"
            />
            <text
              x={PAD.left - 8}
              y={y(rank) + 4}
              textAnchor="end"
              fontSize={11}
              fill={MUTED}
            >
              {ordinal(rank)}
            </text>
          </g>
        ))}
        {closed.length > 1 && (
          <polyline
            fill="none"
            stroke={INK}
            strokeWidth={1.5}
            points={closed
              .map((p) => `${x(points.indexOf(p))},${y(p.rank)}`)
              .join(" ")}
          />
        )}
        {current && closed.length > 0 && (
          <line
            x1={x(points.length - 2)}
            y1={y(closed[closed.length - 1].rank)}
            x2={x(points.length - 1)}
            y2={y(current.rank)}
            stroke={INK}
            strokeWidth={1.5}
            strokeDasharray="3 3"
          />
        )}
        {points.map((p, i) => (
          <g key={p.season}>
            <circle
              cx={x(i)}
              cy={y(p.rank)}
              r={p.current ? 4.5 : 4}
              fill={p.current ? "#fff" : p.rank === 1 ? GOLD : INK}
              stroke={p.current ? "hsl(210, 98%, 42%)" : "#fff"}
              strokeWidth={p.current ? 2 : 1}
            />
            <text
              x={x(i)}
              y={y(p.rank) - 9}
              textAnchor="middle"
              fontSize={11}
              fontWeight={p.rank <= 3 ? 700 : 500}
              fill={p.rank === 1 ? "#8a6a0f" : MUTED}
            >
              {p.rank}
            </text>
            {i % step === (points.length - 1) % step && (
              <text
                x={x(i)}
                y={HEIGHT - 6}
                textAnchor="middle"
                fontSize={11}
                fill={MUTED}
              >
                ’{String(p.season).slice(2)}
              </text>
            )}
          </g>
        ))}
      </svg>
    </Box>
  );
}
