import Box from "@mui/material/Box";

// Settled points, then a green "+N" for picks covering right now, so a
// score that could still change reads as such. The same format as the
// leader cards; `total` is what the table sorts and ranks on.
export function ScoreWithCovering({
  total,
  covering,
  hideCoveringOnPhone = false,
}: {
  total: number;
  covering: number;
  // The phone table shows the "+N" once per row (in Score): it's the same
  // picks in every column, and three copies squeeze the name at 360px.
  hideCoveringOnPhone?: boolean;
}) {
  if (covering <= 0) return <>{total}</>;
  return (
    <Box component="span" sx={{ whiteSpace: "nowrap" }}>
      {total - covering}
      <Box
        component="span"
        title={`${covering} pick${covering === 1 ? "" : "s"} covering now`}
        sx={{
          display: hideCoveringOnPhone
            ? { xs: "none", sm: "inline" }
            : "inline",
          ml: 0.5,
          fontSize: "0.75rem",
          fontWeight: 600,
          color: "success.main",
        }}
      >
        +{covering}
      </Box>
    </Box>
  );
}
