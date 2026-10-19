import { IconButton, useMediaQuery } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import { memo, useEffect, useMemo, useState } from "react";
import { WeekRecap } from "../../types";
import { CategoryMark, ScopeTag } from "./recapCategory";
import { getSeenItems, markItemSeen, orderForRotation } from "./recapUtils";
import { Icon } from "../../ui/Icon";
import styles from "./RecapStrip.module.css";

const ROTATE_MS = 8000;

type Props = {
  recap: WeekRecap | undefined;
  // False while browsing a past week: its week items go untagged.
  isCurrentWeek: boolean;
};

// One-line rotating strip of the week's top items on User Picks. Unseen
// items come first; rotation pauses while hovered or focused, and doesn't
// auto-advance at all for reduced motion.
// Memoized for the same reason as UsersTable: User Picks stays mounted.
const RecapStrip = memo(function RecapStrip({ recap, isCurrentWeek }: Props) {
  const reduceMotion = useMediaQuery("(prefers-reduced-motion: reduce)");
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  // Screen readers hear the headline only after a manual step, not on
  // every 8-second rotation.
  const [announce, setAnnounce] = useState(false);

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
    <div
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      className={styles.strip}
    >
      <CategoryMark category={current.category} />
      <div className={styles.body}>
        <div className={styles.meta}>
          {/* On a past week the intro row already says which week, so a
              week item gets no tag ("This week" would be wrong). */}
          {(isCurrentWeek || current.scope === "season") && (
            <ScopeTag scope={current.scope} />
          )}
          <span className={styles.count}>
            {(index % items.length) + 1} of {items.length}
          </span>
        </div>
        <p aria-live={announce ? "polite" : "off"} className={styles.headline}>
          {/* The full sentence has room on desktop; phones get the
              80-character version so the strip doesn't change height. */}
          <span className={styles.long}>{current.headline}</span>
          <span className={styles.short}>{current.short}</span>
        </p>
      </div>
      <div className={styles.controls}>
        <IconButton
          size="small"
          aria-label="Previous item"
          onClick={() => step(-1)}
        >
          <Icon name="ChevronLeft" size="small" className={styles.stepIcon} />
        </IconButton>
        <div className={styles.dots}>
          {items.map((item, i) => {
            const on = i === index % items.length;
            return (
              // The button is a 24px-tall hit area; the dot is drawn inside
              // it. Out of the tab order: Previous/Next are the keyboard
              // way through, rather than eight stops before the table.
              <button
                key={item.id}
                type="button"
                tabIndex={-1}
                aria-label={`Show item ${i + 1}`}
                aria-current={on}
                onClick={() => {
                  setAnnounce(true);
                  setIndex(i);
                }}
                className={on ? `${styles.dot} ${styles.dotOn}` : styles.dot}
              />
            );
          })}
        </div>
        <IconButton size="small" aria-label="Next item" onClick={() => step(1)}>
          <Icon name="ChevronRight" size="small" className={styles.stepIcon} />
        </IconButton>
        <RouterLink
          to={{
            pathname: "/trends",
            search: isCurrentWeek ? "" : `?week=${week}`,
          }}
          className={styles.fullRecap}
        >
          Full recap →
        </RouterLink>
      </div>
    </div>
  );
});

export default RecapStrip;
