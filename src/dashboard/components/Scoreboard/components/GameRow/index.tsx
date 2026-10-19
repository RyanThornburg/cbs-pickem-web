import { CSSProperties, Fragment, memo, useState } from "react";
import { Game, GameStatus } from "../../../../types";
import { roofText, weatherParts } from "../../../../utils/weatherText";
import {
  isLiveStatus,
  getGameHighlight,
  hasBall,
  hasStarted,
  highlightBorder,
  Side,
  teamLineText,
  userPickSide,
} from "../../utils/scoreboardUtils";
import { TeamLink } from "../../../shared/TeamLink";
import { TeamLogo } from "../../../shared/TeamLogo";
import { BallIcon } from "../shared/BallIcon";
import { AtsTag } from "../shared/AtsTag";
import { FieldStrip } from "../shared/FieldStrip";
import { PickSplitBar } from "../shared/PickSplitBar";
import { YourPickBadge } from "../shared/YourPickBadge";
import { HighlightFlags } from "../shared/HighlightFlags";
import { StatusText, tvName } from "../shared/StatusText";
import { highlightClass } from "../shared/highlight";
import { DetailsToggle } from "../shared/DetailsToggle";
import { GameDetails } from "../GameDetails";
import { GameRecapTags } from "../shared/GameRecapTags";
import { GameTag } from "../../../Recap/recapBadges";
import { gameAnchorId, jumpTargetClass } from "../YourPicksStrip";
import styles from "./GameRow.module.css";

export interface GameRowProps {
  game: Game;
  userId?: string;
  // Recap tags for this game ("Upset of the week", "Won, didn't cover").
  tags?: GameTag[];
  // See GameCardProps.picksRevealed.
  picksRevealed?: boolean;
  // See GameCardProps.total.
  total?: number | null;
}

// The middle column: where the ball is while a game is live, otherwise the
// forecast (upcoming). Final rows don't render it -- the box score toggle
// takes that column.
const Middle = ({ game }: { game: Game }) => {
  const live = game.live;
  if (game.status === GameStatus.Inprogress) {
    const down =
      live?.down != null && live.down <= 0
        ? "Try / kickoff"
        : (live?.down_distance_text ?? "");
    return (
      <div className={styles.field}>
        <div className={styles.downRow}>
          <span className={live?.down === 4 ? styles.fourthDown : styles.down}>
            {down}
          </span>
          <div className={styles.flags}>
            <HighlightFlags highlight={getGameHighlight(game)} />
          </div>
        </div>
        <FieldStrip game={game} height={16} />
      </div>
    );
  }
  if (
    game.status === GameStatus.Halftime ||
    game.status === GameStatus.Delayed
  ) {
    return (
      <div className={styles.paused}>
        <span className={styles.caption}>
          {game.status === GameStatus.Halftime ? "Halftime" : "Delayed"}
        </span>
        <FieldStrip game={game} height={16} />
      </div>
    );
  }
  const f = game.forecast;
  if (f && game.stadium?.roof_type === "Open") {
    // Each part stays whole and the line wraps between parts, so a narrow
    // column shows "Wind 5 mph W" on a second line instead of "Wind 5 m…".
    const parts = weatherParts(f, { precip: false });
    return (
      <p className={styles.note}>
        {parts.map((part, i) => (
          <Fragment key={part}>
            <span className={styles.part}>
              {part}
              {i < parts.length - 1 && " ·"}
            </span>
            {i < parts.length - 1 && " "}
          </Fragment>
        ))}
      </p>
    );
  }
  // Indoors: the stadium and its roof, as on the cards and Games. A long
  // name ellipsizes; the roof always shows.
  return (
    <p className={`${styles.note} ${styles.indoor}`}>
      <span className={styles.stadium}>{game.stadium?.name ?? ""}</span>
      {game.stadium && game.stadium.roof_type !== "Open" && (
        <span className={styles.roof}>
          {game.stadium.name ? " · " : ""}
          {roofText(game.stadium.roof_type)}
        </span>
      )}
    </p>
  );
};

export const GameRow = memo((props: GameRowProps) => {
  const { game, userId, tags, picksRevealed = true, total } = props;
  const [open, setOpen] = useState(false);
  const border = highlightBorder(getGameHighlight(game));
  const pickSide = userPickSide(game, userId);
  const started = hasStarted(game);
  const final = game.status === GameStatus.Final;

  const teamLine = (side: Side) => {
    const team = side === "home" ? game.home_team : game.away_team;
    const score = side === "home" ? game.home_score : game.away_score;
    const other = side === "home" ? game.away_score : game.home_score;
    return (
      <div className={styles.teamLine}>
        <TeamLink abbr={team.abbr} className={styles.teamLink}>
          <TeamLogo abbr={team.abbr} size={22} decorative />
          <p className={styles.abbr}>{team.abbr}</p>
        </TeamLink>
        {/* A fixed slot, so the line, tag and score stay aligned whether or
            not this team has the ball */}
        <span className={styles.ballSlot}>
          {hasBall(game, side) && <BallIcon abbr={team.abbr} />}
        </span>
        <span className={styles.line}>{teamLineText(game, side, total)}</span>
        <AtsTag game={game} side={side} compact />
        <p
          className={`${styles.score} ${final && score < other ? styles.lost : ""}`}
        >
          {started ? score : ""}
        </p>
      </div>
    );
  };

  // Phones stack everything full width under status/teams. Final rows move
  // the box score toggle to the bottom, under the pick bar.
  // Final and live games get the box score toggle. Desktop: final rows put
  // it in the (otherwise empty) middle column; live rows put it under the
  // field. Phones: always last, full width, under the pick bar.
  const hasDetails = final || isLiveStatus(game.status);
  const areas = (rows: string[]) => rows.map((row) => `"${row}"`).join(" ");
  const desktopAreas = areas([
    final ? "status teams toggle picks you" : "status teams middle picks you",
    ...(hasDetails && !final ? [". . toggle . ."] : []),
    ...(open ? ["details details details details details"] : []),
  ]);
  const mobileAreas = areas([
    "status teams",
    ...(final ? [] : ["middle middle"]),
    "picks picks",
    ...(pickSide ? ["you you"] : []),
    ...(hasDetails ? ["toggle toggle"] : []),
    ...(open ? ["details details"] : []),
  ]);

  return (
    <div
      id={gameAnchorId(game)}
      tabIndex={-1}
      className={[
        styles.row,
        jumpTargetClass,
        pickSide && styles.picked,
        highlightClass(border, true),
      ]
        .filter(Boolean)
        .join(" ")}
      style={
        {
          "--desktop-areas": desktopAreas,
          "--mobile-areas": mobileAreas,
        } as CSSProperties
      }
    >
      <div className={styles.status}>
        <StatusText game={game} />
        <span className={styles.caption}>{tvName(game.tv_network)}</span>
        <GameRecapTags tags={tags} wrap />
      </div>
      <div className={styles.teams}>
        {teamLine("away")}
        {teamLine("home")}
      </div>
      {!final && (
        <div className={styles.middle}>
          <Middle game={game} />
        </div>
      )}
      {hasDetails && (
        <div
          className={`${styles.toggle} ${final ? "" : styles.toggleUnderField}`}
        >
          <DetailsToggle
            open={open}
            onToggle={() => setOpen((o) => !o)}
            fullWidthOnPhone
          />
        </div>
      )}
      <div className={styles.picks}>
        <PickSplitBar
          game={game}
          userId={userId}
          picksRevealed={picksRevealed}
          compact
        />
      </div>
      {/* Only rendered with a pick: the phone layout has no "you" area otherwise,
          and an unplaced area name makes the grid add phantom columns. */}
      {pickSide && (
        <div className={styles.you}>
          <YourPickBadge game={game} side={pickSide} compact />
        </div>
      )}
      {open && (
        <div className={styles.details}>
          <GameDetails game={game} columns />
        </div>
      )}
    </div>
  );
});

GameRow.displayName = "GameRow";
