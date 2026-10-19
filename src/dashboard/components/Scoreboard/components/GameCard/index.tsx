import { memo, useState } from "react";
import { Chip } from "../../../../ui/Chip";
import { Game, GameStatus, LinescoreSide } from "../../../../types";
import { getVenueBadge } from "../../../../utils/venue";
import { roofText, weatherLine } from "../../../../utils/weatherText";
import {
  getGameHighlight,
  hasBall,
  hasStarted,
  highlightBorder,
  isLiveStatus,
  Side,
  teamLineText,
  userPickSide,
} from "../../utils/scoreboardUtils";
import { TeamLink } from "../../../shared/TeamLink";
import { TeamLogo } from "../../../shared/TeamLogo";
import { Icon } from "../../../../ui/Icon";
import { BallIcon } from "../shared/BallIcon";
import { Timeouts } from "../shared/Timeouts";
import { AtsTag } from "../shared/AtsTag";
import { FieldStrip } from "../shared/FieldStrip";
import { PickSplitBar } from "../shared/PickSplitBar";
import { YourPickBadge } from "../shared/YourPickBadge";
import { HighlightFlags } from "../shared/HighlightFlags";
import { StatusText, tvName } from "../shared/StatusText";
import { highlightClass } from "../shared/highlight";
import { GameDetails } from "../GameDetails";
import { DetailsToggle } from "../shared/DetailsToggle";
import { GameRecapTags } from "../shared/GameRecapTags";
import { GameTag } from "../../../Recap/recapBadges";
import { gameAnchorId, jumpTargetClass } from "../YourPicksStrip";
import styles from "./GameCard.module.css";

export interface GameCardProps {
  game: Game;
  userId?: string;
  totalUsers?: number;
  // Recap tags for this game ("Upset of the week", "Won, didn't cover").
  tags?: GameTag[];
  // False before the Sunday deadline on a game that hasn't started, when an
  // empty pick list means the picks aren't public yet.
  picksRevealed?: boolean;
  // The game's O/U, shown next to the away team (the spread sits by home).
  total?: number | null;
}

const QUARTERS: (keyof LinescoreSide)[] = ["q1", "q2", "q3", "q4"];

const recordText = (game: Game, side: Side) => {
  const r = (side === "home" ? game.home_team : game.away_team).record;
  return r ? `${r.wins}-${r.losses}${r.ties ? `-${r.ties}` : ""}` : "";
};

const DownDistance = ({ game }: { game: Game }) => {
  const live = game.live;
  if (!live) return null;
  // down is -1 on a try/kickoff, with no text
  if (live.down != null && live.down <= 0) {
    return <span className={styles.down}>Try / kickoff</span>;
  }
  if (!live.down_distance_text) return null;
  return (
    <span className={live.down === 4 ? styles.fourthDown : styles.down}>
      {live.down_distance_text}
    </span>
  );
};

const Situation = ({ game }: { game: Game }) => {
  const live = game.live;
  if (!live || !isLiveStatus(game.status)) return null;
  const inProgress = game.status === GameStatus.Inprogress;
  const lastPlay = live.last_play?.text;
  const wp = live.win_probability;
  const leader =
    wp?.home != null && wp?.away != null
      ? wp.home >= wp.away
        ? { abbr: game.home_team.abbr, pct: wp.home }
        : { abbr: game.away_team.abbr, pct: wp.away }
      : null;
  const weather = live.weather;

  if (!inProgress && !lastPlay) return null;
  return (
    <div className={styles.situation}>
      {inProgress && (
        <>
          <DownDistance game={game} />
          <FieldStrip game={game} />
        </>
      )}
      {lastPlay && (
        <div>
          <span className={styles.lastPlayLabel}>Last play</span>
          {lastPlay}
        </div>
      )}
      {inProgress && (live.drive_text || leader || weather) && (
        <div className={styles.driveLine}>
          {live.drive_text && (
            <span>
              Drive: {live.drive_text}
              {live.possession_text && live.drive_start?.text
                ? ` · from ${live.drive_start.text}`
                : ""}
            </span>
          )}
          {leader && (
            <span>
              Win prob: {leader.abbr} {Math.round(leader.pct)}%
            </span>
          )}
          {weather && (
            <span>Now: {weatherLine(weather, { precip: false })}</span>
          )}
        </div>
      )}
    </div>
  );
};

const PregameLine = ({ game }: { game: Game }) => {
  const f = game.forecast;
  const outdoor = game.stadium?.roof_type === "Open";
  return (
    <p className={styles.pregame}>
      {f && outdoor
        ? `Forecast: ${weatherLine(f)}`
        : [
            game.stadium?.name,
            game.stadium && !outdoor && roofText(game.stadium.roof_type),
          ]
            .filter(Boolean)
            .join(" · ")}
    </p>
  );
};

export const GameCard = memo(
  ({
    game,
    userId,
    totalUsers,
    tags,
    picksRevealed = true,
    total,
  }: GameCardProps) => {
    const [open, setOpen] = useState(false);
    const highlight = getGameHighlight(game);
    const border = highlightBorder(highlight);
    const pickSide = userPickSide(game, userId);
    const venueBadge = getVenueBadge(game.stadium, game.neutral_site);
    const started = hasStarted(game);
    const live = game.live;
    const showTimeouts = isLiveStatus(game.status);
    const hasOt =
      game.linescore?.home.ot != null || game.linescore?.away.ot != null;
    const periods: (keyof LinescoreSide)[] = hasOt
      ? [...QUARTERS, "ot"]
      : QUARTERS;
    const final = game.status === GameStatus.Final;

    const teamRow = (side: Side) => {
      const team = side === "home" ? game.home_team : game.away_team;
      const score = side === "home" ? game.home_score : game.away_score;
      const other = side === "home" ? game.away_score : game.home_score;
      const line = game.linescore?.[side];
      return (
        <div key={side} className={styles.teamRow}>
          <div className={styles.team}>
            <TeamLink abbr={team.abbr} className={styles.logoLink}>
              <TeamLogo abbr={team.abbr} size={30} />
            </TeamLink>
            <div className={styles.teamText}>
              <div className={styles.teamNameRow}>
                <TeamLink abbr={team.abbr} className={styles.nameLink}>
                  <p className={styles.abbr}>{team.abbr}</p>
                  {team.name && <p className={styles.name}>{team.name}</p>}
                </TeamLink>
                {hasBall(game, side) && <BallIcon abbr={team.abbr} />}
              </div>
              <div className={styles.teamMeta}>
                <span>
                  {[recordText(game, side), teamLineText(game, side, total)]
                    .filter(Boolean)
                    .join(" · ")}
                </span>
                <AtsTag game={game} side={side} />
                {showTimeouts && (
                  <Timeouts
                    left={
                      side === "home"
                        ? live?.home_timeouts
                        : live?.away_timeouts
                    }
                  />
                )}
              </div>
            </div>
          </div>
          {periods.map((p) => (
            <div key={p} className={styles.period}>
              {line?.[p] ?? "–"}
            </div>
          ))}
          <p
            className={`${styles.score} ${final && score < other ? styles.lost : ""}`}
          >
            {started ? score : ""}
          </p>
        </div>
      );
    };

    return (
      <div
        id={gameAnchorId(game)}
        tabIndex={-1}
        className={[
          styles.card,
          jumpTargetClass,
          !border && !!pickSide && styles.picked,
          highlightClass(border),
        ]
          .filter(Boolean)
          .join(" ")}
      >
        <div className={styles.header}>
          <StatusText game={game} />
          <span>{tvName(game.tv_network)}</span>
          <HighlightFlags highlight={highlight} />
          <GameRecapTags tags={tags} />
          {venueBadge && (
            <Chip
              icon={
                // Caption-sized: the chip's icon slot sets the font size.
                <Icon
                  name={
                    venueBadge.kind === "international" ? "Public" : "Place"
                  }
                  size="inherit"
                />
              }
              label={venueBadge.label}
              variant="outlined"
              className={styles.venue}
            />
          )}
          <div className={styles.spacer} />
          {pickSide && <YourPickBadge game={game} side={pickSide} />}
        </div>

        <div
          className={styles.linescore}
          style={{
            gridTemplateColumns: `minmax(0, 1fr) repeat(${periods.length}, 22px) 48px`,
          }}
        >
          <span />
          {periods.map((p) => (
            <div key={p} className={styles.periodHead}>
              {p === "ot" ? "OT" : p.slice(1)}
            </div>
          ))}
          <div className={`${styles.periodHead} ${styles.totalHead}`}>T</div>
          {teamRow("away")}
          {teamRow("home")}
        </div>

        <Situation game={game} />
        {game.status === GameStatus.Scheduled && <PregameLine game={game} />}

        <PickSplitBar
          game={game}
          userId={userId}
          totalUsers={totalUsers}
          picksRevealed={picksRevealed}
        />

        {(final || isLiveStatus(game.status)) && (
          <div className={styles.details}>
            <DetailsToggle open={open} onToggle={() => setOpen((o) => !o)} />
            {open && <GameDetails game={game} />}
          </div>
        )}
      </div>
    );
  }
);

GameCard.displayName = "GameCard";
