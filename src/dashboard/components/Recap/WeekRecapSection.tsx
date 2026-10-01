import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { Box, Button, Collapse, Stack, Typography } from "@mui/material";
import { useId, useMemo, useState } from "react";
import { RecapItem } from "../../types";
import { CategoryMark } from "./recapCategory";
import { WeekRecapCard } from "./WeekRecapCards";
import { MAX_CARDS, selectWeekCards } from "./weekCards";

// The recap row at the top of Trends › Week (this week's items) and
// Trends › Season (season-to-date items): a heading row with the
// "All N notes" toggle on the right (the full list opens under it, above the
// cards), then up to 4 cards (see weekCards.ts for the rule). `lead` is an
// extra first card (the selected player's "You this week") that takes one
// of the 4 slots. With no item cards, `empty` shows under the row.
export default function WeekRecapSection({
  title,
  status,
  items,
  lead,
  empty,
  selectedUserId,
}: {
  title: string;
  status?: string;
  items: RecapItem[];
  lead?: React.ReactNode;
  empty?: React.ReactNode;
  selectedUserId?: string;
}) {
  const [showAll, setShowAll] = useState(false);
  const headingId = useId();
  const hasLead = !!lead;
  const cards = useMemo(
    () => selectWeekCards(items, hasLead ? MAX_CARDS - 1 : MAX_CARDS),
    [items, hasLead]
  );

  return (
    <Box component="section" aria-labelledby={headingId}>
      <Stack
        direction="row"
        sx={{
          alignItems: "center",
          justifyContent: "space-between",
          mb: 1,
          flexWrap: "wrap",
          columnGap: 1.5,
          minHeight: 44,
        }}
      >
        <Stack
          direction="row"
          spacing={1.5}
          sx={{ alignItems: "baseline", flexWrap: "wrap" }}
        >
          <Typography id={headingId} variant="h6" component="h2">
            {title}
          </Typography>
          {status && (
            <Typography variant="caption" sx={{ color: "text.secondary" }}>
              {status}
            </Typography>
          )}
        </Stack>
        {items.length > 0 && (
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
            sx={{ minHeight: 44 }}
          >
            All {items.length} notes
          </Button>
        )}
      </Stack>

      <Collapse in={showAll} unmountOnExit>
        <Stack component="ul" spacing={1} sx={{ m: 0, p: 0, pl: 0.5 }}>
          {items.map((t) => (
            <Stack
              component="li"
              key={t.id}
              direction="row"
              spacing={1}
              sx={{ alignItems: "center", listStyle: "none" }}
            >
              <CategoryMark category={t.category} size={20} />
              <Typography variant="body2">{t.headline}</Typography>
            </Stack>
          ))}
        </Stack>
      </Collapse>

      <Box
        sx={{
          display: "grid",
          // 1, 2, then 4 across: 4 cards never wrap 3 + 1.
          gridTemplateColumns: {
            xs: "minmax(0, 1fr)",
            sm: "repeat(2, minmax(0, 1fr))",
            lg: "repeat(4, minmax(0, 1fr))",
          },
          gap: 1.5,
          alignItems: "start",
          mt: showAll ? 2 : 0,
        }}
      >
        {lead}
        {cards.map((card) => (
          <WeekRecapCard
            key={card.key}
            card={card}
            selectedUserId={selectedUserId}
          />
        ))}
      </Box>
      {items.length === 0 && empty && (
        <Box sx={{ mt: lead ? 1.5 : 0 }}>{empty}</Box>
      )}
    </Box>
  );
}
