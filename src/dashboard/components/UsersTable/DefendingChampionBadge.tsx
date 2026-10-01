import Box from "@mui/material/Box";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import { BadgeTooltip } from "./BadgeTooltip";

// Only the most recently closed season's winner gets this -- not an
// all-time "ever won a title" badge (career.titles), which isn't shown
// here. Derived from career.trend.last_season.rank === 1, so it clears
// itself automatically once a new season closes with a different winner.
export function DefendingChampionBadge({
  season,
  plain,
}: {
  season: number | null;
  plain?: boolean;
}) {
  if (season == null) return null;

  return (
    <BadgeTooltip plain={plain} title={`Defending champion (${season})`}>
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
        {/* 3.7:1 on its tile; the brighter #d4a017 was 2.1:1. */}
        <EmojiEventsIcon sx={{ fontSize: "0.8125rem" }} htmlColor="#9a7410" />
      </Box>
    </BadgeTooltip>
  );
}
