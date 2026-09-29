import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { Box, Button, Collapse, Stack, Typography } from "@mui/material";
import { useMemo, useState } from "react";
import { WeekTidbits } from "../../types";
import { CategoryMark, ScopeTag } from "./tidbitCategory";
import { WeekTidbitCard } from "./WeekTidbitCards";
import { selectWeekCards } from "./weekCards";

// "Week N in tidbits" at the top of Trends › Week: up to 6 cards (see
// weekCards.ts for the rule), then every tidbit as a plain list.
export default function WeekTidbitsSection({ tidbits }: { tidbits: WeekTidbits | undefined }) {
  const [showAll, setShowAll] = useState(false);
  const cards = useMemo(() => selectWeekCards(tidbits?.tidbits ?? []), [tidbits]);

  if (!tidbits || tidbits.tidbits.length === 0) return null;

  return (
    <Box id="week-tidbits" sx={{ mb: 3, textAlign: "left" }}>
      <Stack direction="row" alignItems="baseline" spacing={1.5} sx={{ mb: 1, flexWrap: "wrap" }}>
        <Typography variant="subtitle2" sx={{ color: "text.secondary" }}>
          Week {tidbits.week} in tidbits
        </Typography>
        {!tidbits.week_complete && (
          <Typography variant="caption" color="text.secondary">
            So far: {tidbits.games_final} of {tidbits.games_total} games final
          </Typography>
        )}
      </Stack>

      <Box sx={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 1.5, alignItems: "start" }}>
        {cards.map((card) => (
          <WeekTidbitCard key={card.key} card={card} />
        ))}
      </Box>

      <Button
        size="small"
        onClick={() => setShowAll((s) => !s)}
        endIcon={<ExpandMoreIcon sx={{ transform: showAll ? "rotate(180deg)" : "none", transition: "transform 150ms" }} />}
        aria-expanded={showAll}
        sx={{ mt: 1 }}
      >
        All {tidbits.tidbits.length} tidbits this week
      </Button>
      <Collapse in={showAll} unmountOnExit>
        <Stack spacing={1} sx={{ mt: 1, pl: 0.5 }}>
          {tidbits.tidbits.map((t) => (
            <Stack key={t.id} direction="row" spacing={1} alignItems="center">
              <CategoryMark category={t.category} size={20} />
              <ScopeTag scope={t.scope} />
              <Typography variant="body2">{t.headline}</Typography>
            </Stack>
          ))}
        </Stack>
      </Collapse>
    </Box>
  );
}
