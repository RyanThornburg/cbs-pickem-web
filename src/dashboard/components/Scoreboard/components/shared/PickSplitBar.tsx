import { Tooltip } from "../../../../ui/Tooltip";
import { Game, UserId } from "../../../../types";
import { UserAvatar } from "../../../UserAvatar";
import { getCover, Side } from "../../utils/scoreboardUtils";
import { TeamLogo } from "../../../shared/TeamLogo";
import styles from "./PickSplitBar.module.css";

interface Props {
  game: Game;
  userId?: string;
  totalUsers?: number;
  compact?: boolean;
  // False when an empty pick list only means picks aren't public yet (see
  // picksRevealed in scoreboardUtils) -- then nothing is shown.
  picksRevealed?: boolean;
}

const byName = (a: UserId, b: UserId) => a.name.localeCompare(b.name);

const PickerList = ({
  abbr,
  users,
  userId,
}: {
  abbr: string;
  users: UserId[];
  userId?: string;
}) => (
  <div className={styles.pickers}>
    <div className={styles.pickersHead}>
      <TeamLogo abbr={abbr} size={18} />
      {abbr} · {users.length}
    </div>
    {users.length === 0 ? (
      <span className={styles.nobody}>Nobody</span>
    ) : (
      [...users].sort(byName).map((user) => (
        <div
          key={user.id}
          className={user.id === userId ? styles.you : styles.picker}
        >
          <UserAvatar userId={user.id} userName={user.name} size={18} />
        </div>
      ))
    )}
  </div>
);

// Who picked each side, colored by who's winning the pick right now. Every
// picker's name is in the tooltip -- hover on desktop, tap on mobile.
export const PickSplitBar = ({
  game,
  userId,
  totalUsers,
  compact,
  picksRevealed = true,
}: Props) => {
  const away = game.picks.away;
  const home = game.picks.home;
  const total = away.length + home.length;

  if (total === 0) {
    if (!picksRevealed) return null;
    return <span className={styles.caption}>Nobody picked this game</span>;
  }

  const cover = getCover(game);
  // Who's winning the pick: green for the side covering (or that covered),
  // red for the other, grey with no cover yet.
  const result = (side: Side) =>
    !cover || cover.side === null
      ? "even"
      : cover.side === side
        ? "winning"
        : "losing";
  // Each side's label takes the green/red of its half of the bar, a step
  // darker so the text stays readable: winning (or won) the pick vs. losing
  // (or lost) it.
  const count = (
    side: Side,
    abbr: string,
    n: number,
    align: "left" | "right"
  ) => (
    <span
      className={[
        styles.count,
        styles[`${result(side)}Label`],
        align === "right" && styles.countRight,
        cover?.side && styles.countDecided,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <span>
        {align === "left" ? (
          <>
            {abbr} <b>{n}</b>
          </>
        ) : (
          <>
            <b>{n}</b> {abbr}
          </>
        )}
      </span>
    </span>
  );

  // Hover, focus or a tap opens every picker's name; a tap elsewhere or
  // Escape closes it (the Tooltip handles all of it).
  return (
    <div>
      <Tooltip
        side="top"
        arrow
        tone="light"
        popupClassName={styles.popup}
        title={
          <div className={styles.tooltipLists}>
            <PickerList
              abbr={game.away_team.abbr}
              users={away}
              userId={userId}
            />
            <PickerList
              abbr={game.home_team.abbr}
              users={home}
              userId={userId}
            />
          </div>
        }
      >
        <div
          role="button"
          tabIndex={0}
          aria-label={`${away.length} picked ${game.away_team.abbr}, ${home.length} picked ${game.home_team.abbr}. Show names.`}
          className={styles.trigger}
        >
          <div className={styles.counts}>
            {count("away", game.away_team.abbr, away.length, "left")}
            {!compact && totalUsers ? (
              <span>
                {total} of {totalUsers} picked this game
              </span>
            ) : null}
            {count("home", game.home_team.abbr, home.length, "right")}
          </div>
          <div className={styles.bar}>
            <div
              className={styles[result("away")]}
              style={{ width: `${(away.length / total) * 100}%` }}
            />
            <div
              className={`${styles[result("home")]} ${styles.homeHalf}`}
              style={{ width: `${(home.length / total) * 100}%` }}
            />
          </div>
        </div>
      </Tooltip>
    </div>
  );
};
