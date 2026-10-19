import { useEffect, useState } from "react";
import { RankedUser } from "../../types";
import { ordinal } from "../../helper";
import UserAvatar from "../UserAvatar";
import { ScoreWithCovering } from "./ScoreWithCovering";
import { pts } from "./MoneyLines";
import { SELECTED_ROW_BG } from "./selectedRowSx";
import { ShownMoneyStanding } from "./usersTableUtils";
import { PHONE_TAB_BAR_OFFSET } from "../PhoneTabBar";
import uiStyles from "../../ui/ui.module.css";
import styles from "./PinnedPlayerRow.module.css";

// The prize most worth a line: one you're in, else the closest chase.
const pinnedNote = (standings: ShownMoneyStanding[]) => {
  const inMoney = standings.find((s) => s.inMoney);
  if (inMoney) return `In the ${inMoney.prize.toLowerCase()} money`;
  const chasing = [...standings].sort((a, b) => a.ptsOut - b.ptsOut)[0];
  return chasing
    ? `${pts(chasing.ptsOut)} to the ${chasing.prize.toLowerCase()} money`
    : null;
};

// Below md, the selected player's row sticks to the bottom of the screen
// while their real row is scrolled out of view, with the money note the
// header has no room for. Tapping it scrolls to the real row.
export function PinnedPlayerRow({
  user,
  standings,
}: {
  user: RankedUser | undefined;
  standings: ShownMoneyStanding[];
}) {
  const [rowInView, setRowInView] = useState(true);
  const userId = user?.id;

  useEffect(() => {
    if (!userId) return undefined;
    // Both table variants render a row for the player, but only the one
    // on screen ever intersects; the other is display: none.
    const rows = document.querySelectorAll<HTMLElement>(
      `[data-user-row="${CSS.escape(userId)}"]`
    );
    if (!rows.length) return undefined;
    const visible = new Set<Element>();
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) =>
        entry.isIntersecting
          ? visible.add(entry.target)
          : visible.delete(entry.target)
      );
      setRowInView(visible.size > 0);
    });
    rows.forEach((row) => observer.observe(row));
    return () => observer.disconnect();
  }, [userId, standings]);

  if (!user || rowInView) return null;

  const note = pinnedNote(standings);
  const scrollToRow = () => {
    const row = [
      ...document.querySelectorAll<HTMLElement>(
        `[data-user-row="${CSS.escape(user.id)}"]`
      ),
    ].find((el) => el.offsetParent !== null);
    const reduce = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    row?.scrollIntoView({
      block: "center",
      behavior: reduce ? "auto" : "smooth",
    });
  };

  return (
    <div
      className={styles.pinned}
      // Just above the phone tab bar.
      style={{ bottom: PHONE_TAB_BAR_OFFSET }}
    >
      <button
        type="button"
        onClick={scrollToRow}
        aria-label={`Go to your row: ${user.place ? `${ordinal(user.place)}, ` : ""}${user.name}${note ? `, ${note}` : ""}`}
        className={`${uiStyles.plainButton} ${styles.button}`}
        // The player's own row color.
        style={{ backgroundColor: SELECTED_ROW_BG }}
      >
        <span className={styles.place}>{user.place ?? "–"}</span>
        <UserAvatar
          userName={user.name}
          userId={user.id}
          size={22}
          fontSize="0.875rem"
        />
        <span className={styles.score}>
          <ScoreWithCovering
            total={user.cumulative_score + user.trending_score}
            covering={user.trending_score}
          />
        </span>
        {note && <span className={styles.note}>{note}</span>}
      </button>
    </div>
  );
}
