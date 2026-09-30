import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import {
  Box,
  Button,
  Collapse,
  Divider,
  Stack,
  Typography,
} from "@mui/material";
import { useMemo, useState } from "react";
import { WeekRecap } from "../../types";
import { CategoryMark, ScopeTag } from "./recapCategory";
import { WeekRecapCard } from "./WeekRecapCards";
import { selectWeekCards } from "./weekCards";

// "Week N recap" at the top of Trends › Week: a heading row with the
// "All N items" toggle on the right (the full list opens under it, above the
// cards), then up to 4 cards (see weekCards.ts for the rule).
export default function WeekRecapSection({
  recap,
}: {
  recap: WeekRecap | undefined;
}) {
  const [showAll, setShowAll] = useState(false);
  const cards = useMemo(() => selectWeekCards(recap?.items ?? []), [recap]);

  if (!recap || recap.items.length === 0) return null;

  return (
    <Box id="week-recap" sx={{ mb: { xs: 3, md: 1 }, textAlign: "left" }}>
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        sx={{ mb: 1, flexWrap: "wrap", columnGap: 1.5 }}
      >
        <Stack
          direction="row"
          alignItems="baseline"
          spacing={1.5}
          sx={{ flexWrap: "wrap" }}
        >
          <Typography variant="subtitle2" sx={{ color: "text.secondary" }}>
            Week {recap.week} recap
          </Typography>
          {!recap.week_complete && (
            <Typography variant="caption" color="text.secondary">
              So far: {recap.games_final} of {recap.games_total} games final
            </Typography>
          )}
        </Stack>
        <Button
          size="small"
          onClick={() => setShowAll((s) => !s)}
          endIcon={
            <ExpandMoreIcon
              sx={{
                transform: showAll ? "rotate(180deg)" : "none",
                transition: "transform 150ms",
              }}
            />
          }
          aria-expanded={showAll}
        >
          All {recap.items.length} notes this week
        </Button>
      </Stack>

      <Collapse in={showAll} unmountOnExit>
        <Stack spacing={1} sx={{ mb: 2, pl: 0.5 }}>
          {recap.items.map((t) => (
            <Stack key={t.id} direction="row" spacing={1} alignItems="center">
              <CategoryMark category={t.category} size={20} />
              <ScopeTag scope={t.scope} />
              <Typography variant="body2">{t.headline}</Typography>
            </Stack>
          ))}
        </Stack>
      </Collapse>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
          gap: 1.5,
          alignItems: "start",
        }}
      >
        {cards.map((card) => (
          <WeekRecapCard key={card.key} card={card} />
        ))}
      </Box>

      {/* Desktop only: separates the items from the trend cards below. */}
      <Divider sx={{ display: { xs: "none", md: "block" }, mt: 3 }} />
    </Box>
  );
}
