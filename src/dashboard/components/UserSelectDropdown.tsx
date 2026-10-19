import Skeleton from "@mui/material/Skeleton";
import { PayPeriod, RankedUser } from "../types";
import { periodName } from "../utils/payPeriods";
import { ordinal } from "../helper";
import { Select } from "../ui/Select";
import uiStyles from "../ui/ui.module.css";
import styles from "./UserSelectDropdown.module.css";
import UserAvatar from "./UserAvatar";
import { ScoreWithCovering } from "./UsersTable/ScoreWithCovering";
import { MoneyLines } from "./UsersTable/MoneyLines";
import {
  ShownMoneyStanding,
  playerSummaryText,
} from "./UsersTable/usersTableUtils";

export type Props = {
  userList: RankedUser[];
  user: string | undefined;
  onUserChange: (userId: string) => void;
  // Controlled from MainGrid so the "Choose your name" hint can open it.
  open: boolean;
  onOpenChange: (open: boolean) => void;
  // After the menu has finished closing (focus is back on the select).
  onMenuClosed?: () => void;
  // "card" on desktop: name, place and score with the money lines beside
  // them. "compact" on phones: one row, place and score after the name.
  summary: "card" | "compact";
  // The money lines worth showing (desktop card only; phones put them on
  // the table's paid lines).
  standings: ShownMoneyStanding[];
  // The shown prize segment (shownSegment), for "2nd half 3rd" in the card.
  segment?: PayPeriod | null;
  // Set while a past week is browsed, so the card's place and money read
  // as that week's, not today's.
  asOfWeek?: number;
};

// The player picker doubles as the selected player's summary, so the
// header says who you are and where you stand in one place instead of a
// dropdown plus a second line repeating the name.
export default function UserSelectDropdown({
  userList,
  user,
  onUserChange,
  open,
  onOpenChange,
  onMenuClosed,
  summary,
  standings,
  segment = null,
  asOfWeek,
}: Props) {
  // Case-insensitive, so lowercase names sit with their letter instead of
  // after "Z".
  const users = [...userList].sort((a, b) =>
    a.name.localeCompare(b.name, undefined, { sensitivity: "base" })
  );

  // The card's facts are laid out without words between them, so screen
  // readers get a spoken summary instead of the layout.
  const renderValue = (value: string) => {
    const selected = users.find((u) => u.id === value);
    // Someone is picked but there's no roster to show them from (still
    // loading, or the leaderboard is down with nothing saved): a quiet
    // placeholder, not "Find yourself…", which would invite a re-pick.
    if (user && users.length === 0) {
      return (
        <span className={styles.waiting}>
          <Skeleton
            variant="circular"
            width={26}
            height={26}
            animation={false}
          />
          <Skeleton variant="text" width={110} animation={false} />
          <span className={uiStyles.visuallyHidden}>
            Your player, waiting for the standings
          </span>
        </span>
      );
    }
    if (!value || !selected) {
      return <span className={styles.placeholder}>Find yourself…</span>;
    }
    return (
      <>
        <span className={uiStyles.visuallyHidden}>
          {playerSummaryText(
            selected,
            segment,
            summary === "card" ? standings : [],
            asOfWeek
          )}
        </span>
        <span aria-hidden className={styles.layout}>
          {renderCard(selected)}
        </span>
      </>
    );
  };

  const renderCard = (selected: RankedUser) => {
    const segmentPlace = segment ? selected.periods[segment.key]?.place : null;
    const score = (
      <ScoreWithCovering
        total={selected.cumulative_score + selected.trending_score}
        covering={selected.trending_score}
      />
    );
    const avatar = (
      <UserAvatar
        userName={selected.name}
        userId={selected.id}
        size={summary === "card" ? 32 : 22}
        includeName={false}
      />
    );

    if (summary === "compact") {
      return (
        <span className={styles.compactRow}>
          {avatar}
          <span className={styles.compactName}>{selected.name}</span>
          {selected.place != null && (
            <span className={styles.compactStanding}>
              <span className={styles.compactPlace}>
                {ordinal(selected.place)}
              </span>
              {" · "}
              {score}
            </span>
          )}
        </span>
      );
    }

    return (
      <span className={styles.cardRow}>
        {avatar}
        <span className={styles.cardText}>
          <span className={styles.cardName}>{selected.name}</span>
          <span className={styles.cardLine}>
            {selected.place != null && `${ordinal(selected.place)} · `}
            {score} pts
            {segmentPlace != null &&
              ` · ${periodName(segment!)} ${ordinal(segmentPlace)}`}
            {asOfWeek != null && ` · as of week ${asOfWeek}`}
          </span>
        </span>
        {standings.length > 0 && (
          <>
            <span aria-hidden className={styles.divider} />
            <MoneyLines standings={standings} />
          </>
        )}
      </span>
    );
  };

  // Out of the roster (not loaded yet, or the leaderboard is down): shown
  // as no one, without un-picking them.
  const value = user && users.some((u) => u.id === user) ? user : "";

  return (
    <div className={styles.wrap}>
      <span id="user-select-label" className={uiStyles.visuallyHidden}>
        Player
      </span>
      <Select
        id="user-drop-down"
        labelledBy="user-select-label"
        className={summary === "card" ? styles.card : styles.compact}
        valueClassName={styles.value}
        value={value}
        onChange={onUserChange}
        open={open}
        onOpenChange={onOpenChange}
        onOpenChangeComplete={(isOpen) => {
          if (!isOpen) onMenuClosed?.();
        }}
        renderValue={renderValue}
        options={[
          // Only to clear a choice; with no one chosen it would just be
          // the highlighted first item when the menu opens.
          ...(user ? [{ value: "", label: <em>No one</em> }] : []),
          ...users.map((userItem) => ({
            value: userItem.id,
            label: userItem.name,
          })),
        ]}
      />
    </div>
  );
}
