import Box from "@mui/material/Box";

// Three pips, filled for each timeout left. Renders nothing when the feed
// has no count (between plays, or before the pipeline deploy).
export const Timeouts = ({ left }: { left?: number }) => {
  if (left == null) return null;
  return (
    <Box
      component="span"
      title={`${left} timeout${left === 1 ? "" : "s"} left`}
      sx={{ display: "inline-flex", gap: "2px", alignItems: "center" }}
    >
      {[0, 1, 2].map((i) => (
        <Box
          key={i}
          component="span"
          sx={{
            width: 6,
            height: 6,
            borderRadius: "1px",
            bgcolor: i < left ? "text.primary" : "divider",
            opacity: i < left ? 0.8 : 1,
          }}
        />
      ))}
    </Box>
  );
};
