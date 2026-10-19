import { CSSProperties, Fragment } from "react";
import { GameStatus, UserPick } from "../../types";
import { StatusColor } from "../../helper";
import { Icon, IconName } from "../../ui/Icon";
import uiStyles from "../../ui/ui.module.css";
import styles from "./UserPickStack.module.css";

const pickStatusKey = (pick: UserPick): keyof typeof StatusColor => {
  if (!pick.visible) return "TBD";
  if (pick.is_correct === true) return "CORRECT";
  if (pick.is_correct === false) return "INCORRECT";
  if (pick.trending_status && pick.trending_status in StatusColor) {
    return pick.trending_status as keyof typeof StatusColor;
  }
  return "NONE";
};

// A second channel besides the tile color (DESIGN.md's "Status Needs A
// Second Channel" rule): an icon for sighted users, words for screen readers.
// Final games say won/lost; live ones say covering/not covering, with the
// same trend arrows the Scoreboard's your-pick badge uses.
const pickResult = (
  pick: UserPick,
  isGameOver: boolean
): { label: string; icon?: IconName } => {
  if (!pick.visible) return { label: "pick not shown yet" };
  if (pick.is_correct === true) return { label: "won", icon: "Check" };
  if (pick.is_correct === false) return { label: "lost", icon: "Close" };
  if (!isGameOver && pick.trending_status === "CORRECT")
    return { label: "covering", icon: "TrendingUp" };
  if (!isGameOver && pick.trending_status === "INCORRECT")
    return { label: "not covering", icon: "TrendingDown" };
  return { label: "not started" };
};

// One pick: the fill carries the result, the edge carries the game's state
// (none before kickoff, dashed and italic while live, solid when final), and
// an icon plus hidden text repeat the result without color. Also drawn in
// the badge key.
export const PickTile = ({
  pick,
  header = false,
}: {
  pick: UserPick;
  header?: boolean;
}) => {
  const team = pick.visible ? pick.team : "TBD";
  const isGameOver = pick.visible && pick.game_status === GameStatus.Final;
  const inProgress = pick.visible && pick.game_status === GameStatus.Inprogress;

  const { label, icon } = pickResult(pick, isGameOver);
  const statusColor = StatusColor[pickStatusKey(pick)];

  return (
    <div
      className={[
        styles.tile,
        header && styles.headerTile,
        isGameOver && styles.final,
        inProgress && styles.live,
      ]
        .filter(Boolean)
        .join(" ")}
      style={{
        backgroundColor: statusColor.bgColor,
        borderColor: isGameOver
          ? statusColor.borderColor
          : inProgress
            ? statusColor.borderInProgressColor
            : undefined,
      }}
    >
      <span className={styles.tileContent}>
        {team}
        {icon && <Icon name={icon} className={styles.resultIcon} />}
        <span className={uiStyles.visuallyHidden}>, {label}</span>
      </span>
    </div>
  );
};

// A player's picks that are still hidden, as one quiet tile filling the rest
// of the row instead of a "TBD" tile each, so before kickoff the table isn't
// a wall of TBDs and the columns still line up. No count: CBS lets a player
// save fewer than five picks, so the feed can't say how many are hidden.
const HIDDEN_NOTE =
  "Each pick shows at its game's kickoff or the Sunday 1 PM ET deadline, whichever comes first.";

const HiddenPicksTile = ({ header }: { header: boolean }) => (
  <div
    title={HIDDEN_NOTE}
    className={[styles.hiddenTile, header && styles.hiddenHeaderTile]
      .filter(Boolean)
      .join(" ")}
    style={{ backgroundColor: StatusColor.TBD.bgColor }}
  >
    Hidden until kickoff
    <span className={uiStyles.visuallyHidden}>. {HIDDEN_NOTE}</span>
  </div>
);

// A hairline between two of the table's tiles (MUI's vertical Divider).
const TileDivider = () => (
  <div
    role="separator"
    aria-orientation="vertical"
    className={styles.divider}
  />
);

// GetUserByWeek already returns picks in the right order and padded to 5 (real
// visible picks first, then TBD placeholders, or empty if the user made no picks) --
// no further filtering/sorting needed here.
export const UserGamePicksStack = (
  picks: Array<UserPick>,
  header: boolean = false,
  // RankedUser.has_submitted_picks; undefined when the feed didn't say.
  submitted?: boolean
) => {
  // The feed says this player hasn't submitted, as opposed to "TBD" tiles
  // (submitted, hidden until kickoff). If it doesn't say, show nothing.
  if (picks.length === 0) {
    if (submitted !== false) return null;
    return <p className={styles.noPicks}>No picks yet</p>;
  }

  // Two or more hidden picks merge into one tile, in the header and the
  // table alike. A lone hidden pick stays a normal TBD tile (the label
  // wouldn't fit one tile's width).
  const hidden = picks.filter((pick) => !pick.visible);
  const merge = hidden.length > 1;
  const tiles = merge ? picks.filter((pick) => pick.visible) : picks;
  // Hairlines between the table's tiles; the header's spaced pills don't
  // need them (they dropped in and out at fractional offsets).
  const divided = !header;

  return (
    <div
      className={[
        styles.stack,
        header && styles.headerStack,
        merge && !header && styles.fill,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {tiles.map((pick, i) => (
        <Fragment key={pick.game_id}>
          {divided && i > 0 && <TileDivider />}
          <div className={styles.slot}>
            <PickTile pick={pick} header={header} />
          </div>
        </Fragment>
      ))}
      {merge && (
        <>
          {divided && tiles.length > 0 && <TileDivider />}
          <div
            className={styles.hiddenSlot}
            style={{ "--hidden-picks": hidden.length } as CSSProperties}
          >
            <HiddenPicksTile header={header} />
          </div>
        </>
      )}
    </div>
  );
};
