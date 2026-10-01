import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import HistoryIcon from "@mui/icons-material/History";

// Under the tab row whenever a past week is being browsed, on every weekly
// tab: only the number in the Week select changed before, so old standings
// could pass for this week's.
export default function PastWeekNotice({
  week,
  currentWeek,
  onBack,
}: {
  week: number;
  currentWeek: number;
  onBack: () => void;
}) {
  return (
    <Box
      role="status"
      sx={{
        display: "flex",
        alignItems: "center",
        flexWrap: "wrap",
        columnGap: 1,
        rowGap: 0.5,
        mt: 2,
        pl: 1.5,
        pr: 0.5,
        py: 0.5,
        border: 1,
        borderColor: "divider",
        borderRadius: 2,
        // DESIGN.md slate-50: a quiet tone, not a warning.
        bgcolor: "hsl(220, 35%, 97%)",
        textAlign: "left",
      }}
    >
      <HistoryIcon
        aria-hidden
        sx={{ color: "text.secondary", fontSize: "1.25rem" }}
      />
      <Typography variant="body2" sx={{ flex: "1 1 10rem", minWidth: 0 }}>
        <Box component="span" sx={{ fontWeight: 600 }}>
          Week {week}
        </Box>
        <Box component="span" sx={{ color: "text.secondary" }}>
          {" "}
          · a past week, not this week
        </Box>
      </Typography>
      <Button size="small" onClick={onBack} sx={{ minHeight: 36 }}>
        Back to week {currentWeek}
      </Button>
    </Box>
  );
}
