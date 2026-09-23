import Box from "@mui/material/Box";
import Tooltip from "@mui/material/Tooltip";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";

// Only the most recently closed season's winner gets this -- not an
// all-time "ever won a title" badge (career.titles), which isn't shown
// here. Derived from career.trend.last_season.rank === 1, so it clears
// itself automatically once a new season closes with a different winner.
export function DefendingChampionBadge({ season }: { season: number | null }) {
  if (season == null) return null;

  return (
    <Tooltip title={`Defending champion - ${season}`}>
      <Box
        sx={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          width: 20,
          height: 20,
          borderRadius: "50%",
          bgcolor: "rgba(212,160,23,0.18)",
          flexShrink: 0,
        }}
      >
        <EmojiEventsIcon sx={{ fontSize: "0.8125rem" }} htmlColor="#d4a017" />
      </Box>
    </Tooltip>
  );
}
