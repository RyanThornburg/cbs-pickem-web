import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import { Box, IconButton, Typography, useMediaQuery } from "@mui/material";
import { useEffect, useMemo, useState } from "react";
import { WeekTidbits } from "../../types";
import { CategoryMark, ScopeTag } from "./tidbitCategory";
import { getSeenTidbits, markTidbitSeen, orderForRotation } from "./tidbitUtils";

const ROTATE_MS = 8000;

type Props = {
  tidbits: WeekTidbits | undefined;
};

// One-line rotating strip of the week's top tidbits on User Picks. Unseen
// tidbits come first; rotation pauses while hovered or focused, and doesn't
// auto-advance at all for reduced motion.
export default function TidbitStrip({ tidbits }: Props) {
  const reduceMotion = useMediaQuery("(prefers-reduced-motion: reduce)");
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  const season = tidbits?.season ?? 0;
  const week = tidbits?.week ?? 0;
  // Re-order only when the set of tidbits changes, not on every 5-minute
  // poll, so the strip doesn't jump around under the viewer.
  const idsKey = tidbits?.tidbits.map((t) => t.id).join("|") ?? "";
  const items = useMemo(
    () => (tidbits ? orderForRotation(tidbits.tidbits, getSeenTidbits(season, week)) : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [idsKey, season, week]
  );
  // Same order, but the latest poll's text (numbers change during the week).
  const byId = new Map(tidbits?.tidbits.map((t) => [t.id, t]) ?? []);
  const current = items.length ? byId.get(items[index % items.length].id) : undefined;

  useEffect(() => setIndex(0), [idsKey, season, week]);

  useEffect(() => {
    if (current) markTidbitSeen(season, week, current.id);
  }, [current, season, week]);

  useEffect(() => {
    if (reduceMotion || paused || items.length < 2) return;
    const id = setInterval(() => setIndex((i) => (i + 1) % items.length), ROTATE_MS);
    return () => clearInterval(id);
  }, [reduceMotion, paused, items.length]);

  if (!current) return null;

  const step = (delta: number) => setIndex((i) => (i + delta + items.length) % items.length);

  return (
    <Box
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      sx={{
        display: "grid",
        gridTemplateColumns: { xs: "auto minmax(0, 1fr)", sm: "auto minmax(0, 1fr) auto" },
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
        background: "linear-gradient(90deg, hsl(210, 100%, 97%), transparent 45%)",
      }}
    >
      <CategoryMark category={current.category} />
      <Box sx={{ minWidth: 0 }}>
        <Box sx={{ display: "flex", gap: 1, alignItems: "center", mb: 0.25 }}>
          <ScopeTag scope={current.scope} />
          <Typography variant="caption" color="text.secondary" sx={{ fontVariantNumeric: "tabular-nums" }}>
            {(index % items.length) + 1} of {items.length}
          </Typography>
        </Box>
        <Typography aria-live="polite" sx={{ fontSize: "0.9rem", fontWeight: 500 }}>
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
        <IconButton size="small" aria-label="Previous tidbit" onClick={() => step(-1)}>
          <ChevronLeftIcon fontSize="small" />
        </IconButton>
        <Box sx={{ display: "flex", gap: 0.5 }}>
          {items.map((item, i) => {
            const on = i === index % items.length;
            return (
              <Box
                key={item.id}
                component="button"
                type="button"
                aria-label={`Show tidbit ${i + 1}`}
                aria-current={on}
                onClick={() => setIndex(i)}
                sx={{
                  width: on ? 14 : 6,
                  height: 6,
                  p: 0,
                  border: 0,
                  borderRadius: 3,
                  cursor: "pointer",
                  bgcolor: on ? "primary.main" : "divider",
                }}
              />
            );
          })}
        </Box>
        <IconButton size="small" aria-label="Next tidbit" onClick={() => step(1)}>
          <ChevronRightIcon fontSize="small" />
        </IconButton>
      </Box>
    </Box>
  );
}
