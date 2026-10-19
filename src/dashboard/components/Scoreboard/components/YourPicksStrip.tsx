import { CSSProperties } from "react";
import ButtonBase from "@mui/material/ButtonBase";
import { alpha, Theme } from "@mui/material/styles";
import { Game } from "../../../types";
import {
  getGameHighlight,
  getPickState,
  PickState,
  pickStateText,
  pickTally,
  Side,
  sideLine,
  yourPicks,
} from "../utils/scoreboardUtils";
import { StatusText } from "./shared/StatusText";
import { TeamLogo } from "../../shared/TeamLogo";
import styles from "./YourPicksStrip.module.css";

// The id each game's card/row carries, so a chip can jump to it.
export const gameAnchorId = (game: Game) => `scoreboard-game-${game.game_id}`;

// On the card/row: land below the sticky desktop tab row, and no focus ring
// for the programmatic focus (the scroll already shows where you are).
export const jumpTargetClass = styles.jumpTarget;

// Same colors as the your-pick badge: tint for the fill/ring, ink for text.
const TONE: Record<PickState, (t: Theme) => { ink: string; tint: string }> = {
  notStarted: (t) => ({
    ink: t.palette.primary.dark,
    tint: t.palette.primary.main,
  }),
  covering: (t) => ({
    ink: t.palette.success.dark,
    tint: t.palette.success.main,
  }),
  won: (t) => ({ ink: t.palette.success.dark, tint: t.palette.success.main }),
  notCovering: (t) => ({
    ink: t.palette.error.dark,
    tint: t.palette.error.main,
  }),
  lost: (t) => ({ ink: t.palette.error.dark, tint: t.palette.error.main }),
  push: (t) => ({
    ink: t.palette.text.primary,
    tint: t.palette.text.secondary,
  }),
};

const jumpTo = (game: Game) => {
  const el = document.getElementById(gameAnchorId(game));
  if (!el) return;
  const reduce = window.matchMedia?.(
    "(prefers-reduced-motion: reduce)"
  ).matches;
  el.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
  // keyboard and screen reader users land on the game too
  el.focus({ preventScroll: true });
};

const Chip = ({ game, side }: { game: Game; side: Side }) => {
  const state = getPickState(game, side);
  const { full } = pickStateText(game, side);
  const team = side === "home" ? game.home_team : game.away_team;
  const opp = side === "home" ? game.away_team : game.home_team;
  const where = `${side === "home" ? "vs" : "at"} ${opp.abbr}`;
  const line = sideLine(game, side);
  const { close } = getGameHighlight(game);

  return (
    <ButtonBase
      onClick={() => jumpTo(game)}
      aria-label={`${team.abbr} ${line} ${where}: ${full}. Go to the game.`}
      sx={(t) => {
        const { ink, tint } = TONE[state](t);
        return {
          display: "flex",
          flexDirection: "column",
          alignItems: "stretch",
          gap: 0.25,
          minWidth: 0,
          p: "8px 10px",
          borderRadius: 2,
          textAlign: "left",
          bgcolor: alpha(tint, state === "notStarted" ? 0.08 : 0.12),
          // A close game (same rule as the card border) gets the amber ring.
          boxShadow: close
            ? `inset 0 0 0 2px ${t.palette.warning.main}`
            : state === "notStarted"
              ? "none"
              : `inset 0 0 0 1px ${alpha(tint, 0.6)}`,
          "&:hover": { bgcolor: alpha(tint, 0.2) },
          "& .state": { color: ink },
        };
      }}
    >
      <div className={styles.chipTop}>
        <StatusText game={game} />
        <span className={styles.where}>{where}</span>
      </div>
      <div className={styles.chipTeam}>
        <TeamLogo abbr={team.abbr} size={18} />
        {team.abbr}
        <span className={styles.chipLine}>{line}</span>
      </div>
      <div className={`state ${styles.state}`}>{full}</div>
    </ButtonBase>
  );
};

// The selected player's games at a glance, above the list: clock, line and
// the margin in words. Tapping a chip jumps to that game. Nothing in the list
// moves, so the order stays the same for everyone.
export const YourPicksStrip = ({
  games,
  userId,
}: {
  games: Game[];
  userId?: string;
}) => {
  const picks = yourPicks(games, userId);
  if (!picks.length) return null;

  return (
    <section aria-labelledby="your-picks-heading" className={styles.strip}>
      <div className={styles.head}>
        <h3 id="your-picks-heading" className={styles.title}>
          Your picks
        </h3>
        <p className={styles.tally}>{pickTally(picks)}</p>
      </div>
      <div
        className={styles.chips}
        style={{ "--chips": Math.max(picks.length, 5) } as CSSProperties}
      >
        {picks.map(({ game, side }) => (
          <Chip key={game.game_id} game={game} side={side} />
        ))}
      </div>
    </section>
  );
};
