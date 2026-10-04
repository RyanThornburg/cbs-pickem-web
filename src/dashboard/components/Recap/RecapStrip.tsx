import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import {
  Box,
  IconButton,
  Link,
  Typography,
  useMediaQuery,
} from "@mui/material";
import { Link as RouterLink, useSearchParams } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { WeekRecap } from "../../types";
import { CategoryMark, ScopeTag } from "./recapCategory";
import { getSeenItems, markItemSeen, orderForRotation } from "./recapUtils";

const ROTATE_MS = 8000;

type Props = {
  recap: WeekRecap | undefined;
  // False while browsing a past week: its week items go untagged.
  isCurrentWeek: boolean;
};

// One-line rotating strip of the week's top items on User Picks. Unseen
// items come first; rotation pauses while hovered or focused, and doesn't
// auto-advance at all for reduced motion.
export default function RecapStrip({ recap, isCurrentWeek }: Props) {
  const reduceMotion = useMediaQuery("(prefers-reduced-motion: reduce)");
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  // Screen readers hear the headline only after a manual step, not on
  // every 8-second rotation.
  const [announce, setAnnounce] = useState(false);
  const [searchParams] = useSearchParams();
  const pastWeek = searchParams.get("week");

  const season = recap?.season ?? 0;
  const week = recap?.week ?? 0;
  // Re-order only when the set of items changes, not on every 5-minute
  // poll, so the strip doesn't jump around under the viewer.
  const idsKey = recap?.items.map((t) => t.id).join("|") ?? "";
  const items = useMemo(
    () =>
      recap ? orderForRotation(recap.items, getSeenItems(season, week)) : [],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [idsKey, season, week]
  );
  // Same order, but the latest poll's text (numbers change during the week).
  const byId = new Map(recap?.items.map((t) => [t.id, t]) ?? []);
  const current = items.length
    ? byId.get(items[index % items.length].id)
    : undefined;

  useEffect(() => setIndex(0), [idsKey, season, week]);

  useEffect(() => {
    if (current) markItemSeen(season, week, current.id);
  }, [current, season, week]);

  useEffect(() => {
    if (reduceMotion || paused || items.length < 2) return;
    const id = setInterval(
      () => setIndex((i) => (i + 1) % items.length),
      ROTATE_MS
    );
    return () => clearInterval(id);
  }, [reduceMotion, paused, items.length]);

  if (!current) return null;

  const step = (delta: number) => {
    setAnnounce(true);
    setIndex((i) => (i + delta + items.length) % items.length);
  };

  return (
    <Box
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      sx={{
        display: "grid",
        gridTemplateColumns: {
          xs: "auto minmax(0, 1fr)",
          sm: "auto minmax(0, 1fr) auto",
        },
        columnGap: 1.5,
        rowGap: 1,
        alignItems: "center",
        border: 1,
        borderColor: "divider",
        borderRadius: 2.5,
        px: 1.5,
        py: 1.25,
        mb: 2,
        textAlign: "left",
        background:
          "linear-gradient(90deg, hsl(210, 100%, 97%), transparent 45%)",
      }}
    >
      <CategoryMark category={current.category} />
      <Box sx={{ minWidth: 0 }}>
        <Box sx={{ display: "flex", gap: 1, alignItems: "center", mb: 0.25 }}>
          {/* On a past week the intro row already says which week, so a
              week item gets no tag ("This week" would be wrong). */}
          {(isCurrentWeek || current.scope === "season") && (
            <ScopeTag scope={current.scope} />
          )}
          <Typography
            variant="caption"
            sx={{
              color: "text.secondary",
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {(index % items.length) + 1} of {items.length}
          </Typography>
        </Box>
        <Typography
          aria-live={announce ? "polite" : "off"}
          sx={{ fontSize: "0.875rem", fontWeight: 500 }}
        >
          {/* The full sentence has room on desktop; phones get the
              80-character version so the strip doesn't change height. */}
          <Box component="span" sx={{ display: { xs: "none", sm: "inline" } }}>
            {current.headline}
          </Box>
          <Box component="span" sx={{ display: { xs: "inline", sm: "none" } }}>
            {current.short}
          </Box>
        </Typography>
      </Box>
      <Box
        sx={{
          gridColumn: { xs: "1 / -1", sm: "auto" },
          display: "flex",
          alignItems: "center",
          justifyContent: { xs: "space-between", sm: "flex-end" },
          gap: 0.75,
        }}
      >
        <IconButton
          size="small"
          aria-label="Previous item"
          onClick={() => step(-1)}
        >
          <ChevronLeftIcon fontSize="small" />
        </IconButton>
        <Box sx={{ display: "flex" }}>
          {items.map((item, i) => {
            const on = i === index % items.length;
            return (
              // The button is a 24px-tall hit area; the dot is drawn inside
              // it. Out of the tab order: Previous/Next are the keyboard
              // way through, rather than eight stops before the table.
              <Box
                key={item.id}
                component="button"
                type="button"
                tabIndex={-1}
                aria-label={`Show item ${i + 1}`}
                aria-current={on}
                onClick={() => {
                  setAnnounce(true);
                  setIndex(i);
                }}
                sx={{
                  display: "grid",
                  placeItems: "center",
                  width: on ? 22 : 14,
                  height: 24,
                  p: 0,
                  border: 0,
                  bgcolor: "transparent",
                  cursor: "pointer",
                  "&::before": {
                    content: '""',
                    width: on ? 14 : 6,
                    height: 6,
                    borderRadius: 3,
                    bgcolor: on ? "primary.main" : "divider",
                  },
                }}
              />
            );
          })}
        </Box>
        <IconButton size="small" aria-label="Next item" onClick={() => step(1)}>
          <ChevronRightIcon fontSize="small" />
        </IconButton>
        <Link
          component={RouterLink}
          to={{
            pathname: "/trends",
            search: pastWeek ? `?week=${pastWeek}` : "",
          }}
          underline="hover"
          sx={{
            fontSize: "0.75rem",
            fontWeight: 600,
            whiteSpace: "nowrap",
            ml: 0.5,
            display: { xs: "none", sm: "inline" },
          }}
        >
          Full recap →
        </Link>
      </Box>
    </Box>
  );
}
