import Box from "@mui/material/Box";
import ButtonBase from "@mui/material/ButtonBase";
import Typography from "@mui/material/Typography";
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

// The id each game's card/row carries, so a chip can jump to it.
export const gameAnchorId = (game: Game) => `scoreboard-game-${game.game_id}`;

// On the card/row: land below the sticky desktop tab row, and no focus ring
// for the programmatic focus (the scroll already shows where you are).
export const JUMP_TARGET_SX = {
  scrollMarginTop: { xs: 12, md: 72 },
  "&:focus": { outline: "none" },
} as const;

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
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 0.75,
          fontSize: "0.75rem",
          color: "text.secondary",
          "& > span:first-of-type": { fontSize: "0.75rem" },
        }}
      >
        <StatusText game={game} />
        <Box
          component="span"
          sx={{ whiteSpace: "nowrap", display: { xs: "none", sm: "inline" } }}
        >
          {where}
        </Box>
      </Box>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 0.75,
          fontWeight: 700,
          fontSize: "1.125rem",
          lineHeight: 1.3,
          whiteSpace: "nowrap",
        }}
      >
        <TeamLogo abbr={team.abbr} size={18} />
        {team.abbr}
        <Box
          component="span"
          sx={{
            fontWeight: 500,
            fontSize: "0.875rem",
            color: "text.secondary",
          }}
        >
          {line}
        </Box>
      </Box>
      <Box
        className="state"
        sx={{ fontSize: "0.8125rem", fontWeight: 600, lineHeight: 1.35 }}
      >
        {full}
      </Box>
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
    <Box
      component="section"
      aria-labelledby="your-picks-heading"
      sx={{ display: "flex", flexDirection: "column", gap: 1 }}
    >
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          flexWrap: "wrap",
          columnGap: 2,
        }}
      >
        <Typography
          id="your-picks-heading"
          component="h3"
          sx={{ fontWeight: 700, fontSize: "0.875rem" }}
        >
          Your picks
        </Typography>
        <Typography
          sx={{
            fontSize: "0.8125rem",
            color: "text.secondary",
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {pickTally(picks)}
        </Typography>
      </Box>
      <Box
        sx={{
          display: "grid",
          gap: 1,
          // One row of five from md; below that the chips scroll sideways
          // rather than stacking into a tall block above the games.
          gridTemplateColumns: {
            md: `repeat(${Math.max(picks.length, 5)}, minmax(0, 1fr))`,
          },
          gridAutoFlow: { xs: "column", md: "row" },
          gridAutoColumns: { xs: "minmax(140px, 1fr)", md: undefined },
          overflowX: { xs: "auto", md: "visible" },
          // room for the focus ring and close-game ring inside the scroller
          p: { xs: "3px", md: 0 },
          m: { xs: "-3px", md: 0 },
          scrollSnapType: { xs: "x proximity", md: "none" },
          "& > *": { scrollSnapAlign: "start" },
        }}
      >
        {picks.map(({ game, side }) => (
          <Chip key={game.game_id} game={game} side={side} />
        ))}
      </Box>
    </Box>
  );
};
