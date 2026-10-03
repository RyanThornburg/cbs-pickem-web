import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { SpreadBucketRecord } from "../../types";
import { visuallyHidden } from "../../helper";
import { SPREAD_BUCKET_LABELS } from "./playerUtils";

// The tallest bar's height; every bar is to the same scale.
const MAX_BAR = 64;

// Wins up, losses down, one column per line size from big favorites to big
// underdogs, so "where do this player's picks win" reads left to right.
export function SpreadLadder({ buckets }: { buckets: SpreadBucketRecord[] }) {
  const max = Math.max(1, ...buckets.map((b) => Math.max(b.wins, b.losses)));
  const unit = MAX_BAR / max;
  const bar = (count: number, color: string, up: boolean) => (
    <Box
      sx={{
        height: MAX_BAR + 18,
        display: "flex",
        flexDirection: up ? "column-reverse" : "column",
        alignItems: "center",
      }}
    >
      {count > 0 && (
        <>
          <Box
            sx={{
              width: "min(34px, 60%)",
              height: count * unit,
              bgcolor: color,
              borderRadius: up ? "3px 3px 0 0" : "0 0 3px 3px",
            }}
          />
          <Typography
            aria-hidden
            sx={{
              fontSize: "0.75rem",
              fontWeight: 600,
              lineHeight: "18px",
              color: up ? "success.dark" : "error.dark",
            }}
          >
            {count}
          </Typography>
        </>
      )}
    </Box>
  );
  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: "28px repeat(7, minmax(0, 1fr))",
        maxWidth: 640,
        columnGap: 0.5,
      }}
    >
      <Box
        aria-hidden
        sx={{
          display: "flex",
          flexDirection: "column",
          fontSize: "0.6875rem",
        }}
      >
        <Box
          sx={{
            height: MAX_BAR + 18,
            display: "flex",
            alignItems: "flex-end",
            color: "success.dark",
            pb: 0.25,
          }}
        >
          Won
        </Box>
        <Box sx={{ height: "1px" }} />
        <Box sx={{ color: "error.dark", pt: 0.25 }}>Lost</Box>
      </Box>
      {buckets.map((bucket) => {
        const { short, long } = SPREAD_BUCKET_LABELS[bucket.bucket];
        return (
          <Box
            key={bucket.bucket}
            role="group"
            aria-label={long}
            sx={{ display: "flex", flexDirection: "column", minWidth: 0 }}
          >
            {bar(bucket.wins, "#66bb6a", true)}
            <Box sx={{ height: "1px", bgcolor: "rgba(0, 0, 0, 0.25)" }} />
            {bar(bucket.losses, "#ef5350", false)}
            <Typography
              aria-hidden
              sx={{
                mt: 0.5,
                fontSize: "0.6875rem",
                lineHeight: 1.25,
                color: bucket.picks ? "text.secondary" : "text.disabled",
                textAlign: "center",
              }}
            >
              {short}
            </Typography>
            <Box component="span" sx={visuallyHidden}>
              {bucket.wins} won, {bucket.losses} lost
            </Box>
          </Box>
        );
      })}
    </Box>
  );
}
