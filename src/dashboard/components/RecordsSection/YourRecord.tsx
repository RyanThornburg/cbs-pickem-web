import { Box, Typography } from "@mui/material";
import { ordinal } from "../../helper";
import { CareerRow } from "./recordsUtils";
import { YOU_FILL } from "./recordsTheme";

type Props = {
  row: CareerRow;
  place: { place: number; tied: boolean };
};

const Fact = ({ children }: { children: React.ReactNode }) => (
  <Typography component="span" variant="body2">
    {children}
  </Typography>
);

// The selected player's all-time line, first on the page: one big number
// (their place) plus a few short facts. Titles list their years; without a
// title, the best finish does instead.
export default function YourRecord({ row, place }: Props) {
  const titleYears = [...row.byYear]
    .filter(([, f]) => f.rank === 1)
    .map(([year]) => year)
    .sort((a, b) => a - b);
  const bestYears = [...row.byYear]
    .filter(([, f]) => f.rank === row.best)
    .map(([year]) => year)
    .sort((a, b) => a - b);

  return (
    <Box
      role="group"
      aria-label="Your all-time record"
      sx={(t) => ({
        display: "flex",
        flexWrap: "wrap",
        alignItems: "baseline",
        columnGap: 2,
        rowGap: 0.5,
        px: 1.75,
        py: 1.5,
        borderRadius: 2,
        bgcolor: YOU_FILL,
        boxShadow: `inset 3px 0 0 ${t.palette.primary.main}`,
      })}
    >
      <Typography
        variant="body2"
        sx={{ width: "100%", color: "text.secondary", fontWeight: 600 }}
      >
        {row.name}
        {row.active ? "" : " · former player"}
      </Typography>
      <Typography
        sx={{
          fontSize: "1.75rem",
          fontWeight: 700,
          lineHeight: 1,
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {place.tied ? "T" : ""}
        {ordinal(place.place)}
        <Box
          component="span"
          sx={{ fontSize: "0.875rem", fontWeight: 600, ml: 0.75 }}
        >
          all-time · {row.points} pts
        </Box>
      </Typography>
      {titleYears.length > 0 ? (
        <Fact>
          <b>
            {titleYears.length} title{titleYears.length > 1 ? "s" : ""}
          </b>{" "}
          ({titleYears.join(", ")})
        </Fact>
      ) : (
        row.best !== undefined && (
          <Fact>
            best <b>{ordinal(row.best)}</b> ({bestYears.join(", ")})
          </Fact>
        )
      )}
      <Fact>
        <b>{row.seasons}</b> season{row.seasons === 1 ? "" : "s"}
      </Fact>
      {row.avgFinish !== undefined && (
        <Fact>
          avg finish <b>{row.avgFinish.toFixed(1)}</b>
        </Fact>
      )}
      {row.top5 > 0 && (
        <Fact>
          <b>{row.top5}</b> top-5 finish{row.top5 === 1 ? "" : "es"}
        </Fact>
      )}
    </Box>
  );
}
