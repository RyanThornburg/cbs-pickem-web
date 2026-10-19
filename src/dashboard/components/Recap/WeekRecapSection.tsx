import { Collapse } from "@mui/material";
import { CSSProperties, useId, useMemo, useState } from "react";
import { RecapItem } from "../../types";
import { CategoryMark } from "./recapCategory";
import { WeekRecapCard } from "./WeekRecapCards";
import { MAX_CARDS, selectWeekCards } from "./weekCards";
import { Button } from "../../ui/Button";
import { Icon } from "../../ui/Icon";
import styles from "./WeekRecapSection.module.css";

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

  // Never fewer than 3 columns, so one or two cards don't stretch wide.
  const rowColumns = Math.min(4, Math.max(3, cards.length + (lead ? 1 : 0)));

  return (
    <section aria-labelledby={headingId}>
      <div className={styles.head}>
        <div className={styles.titleRow}>
          <h3 id={headingId} className={styles.title}>
            {title}
          </h3>
          {status && <span className={styles.status}>{status}</span>}
        </div>
        {items.length > 0 && (
          <Button
            size="small"
            onClick={() => setShowAll((s) => !s)}
            endIcon={
              <Icon
                name="ExpandMore"
                style={{
                  transform: showAll ? "rotate(180deg)" : "none",
                  transition: "transform 150ms",
                }}
              />
            }
            aria-expanded={showAll}
            style={{ minHeight: 44 }}
          >
            All {items.length} notes
          </Button>
        )}
      </div>

      <Collapse in={showAll} unmountOnExit>
        <ul className={styles.list}>
          {items.map((t) => (
            <li key={t.id} className={styles.item}>
              <CategoryMark category={t.category} size={20} />
              <p className={styles.headline}>{t.headline}</p>
            </li>
          ))}
        </ul>
      </Collapse>

      <div
        className={
          showAll ? `${styles.cards} ${styles.cardsOpen}` : styles.cards
        }
        style={{ "--row-columns": rowColumns } as CSSProperties}
      >
        {lead}
        {cards.map((card) => (
          <WeekRecapCard
            key={card.key}
            card={card}
            selectedUserId={selectedUserId}
          />
        ))}
      </div>
      {items.length === 0 && empty && (
        <div className={lead ? styles.emptyAfterLead : undefined}>{empty}</div>
      )}
    </section>
  );
}
