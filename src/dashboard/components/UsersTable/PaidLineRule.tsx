import { MONEY_GOLD } from "./StandingsStatus";
import { SELECTED_ROW_BG } from "./selectedRowSx";
import { PrizesHelp } from "./PrizesHelp";
import styles from "./PaidLineRule.module.css";

// Deep trophy gold: the prize color, dark enough for 12px text (5.1:1).
const PAID_GOLD = MONEY_GOLD;

// The dashed "paid" line under the last paid place, in User Picks and the
// first-half leader card. Its label names the prize and any tie. Below md,
// where the header has no room for money lines, `note` says how far back
// the selected player is ("you're 3 pts back"), right on the line it's
// measured against.
export function PaidLineRule({
  label,
  note,
}: {
  label: string;
  note?: string;
}) {
  return (
    <>
      {/* The label and its "?" sit beside the separator, not inside it: a
          separator's children are presentational, which would hide the
          button from screen readers. */}
      <div className={styles.rule}>
        <div
          role="separator"
          aria-label={label}
          className={styles.line}
          style={{ borderTopColor: PAID_GOLD }}
        />
        <div className={styles.label}>
          <span
            aria-hidden
            className={styles.labelText}
            style={{ color: PAID_GOLD }}
          >
            {label}
          </span>
          <PrizesHelp />
        </div>
      </div>
      {note && (
        <div className={styles.noteRow}>
          <span
            className={styles.note}
            // The selected row's highlight: it's about that row's player.
            style={{ backgroundColor: SELECTED_ROW_BG }}
          >
            {note}
          </span>
        </div>
      )}
    </>
  );
}
