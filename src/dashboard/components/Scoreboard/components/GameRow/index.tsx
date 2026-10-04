import { Fragment, memo, useState } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
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
import { highlightSx } from "../shared/highlightSx";
import { DetailsToggle } from "../shared/DetailsToggle";
import { GameDetails } from "../GameDetails";
import { GameRecapTags } from "../shared/GameRecapTags";
import { GameTag } from "../../../Recap/recapBadges";
import { gameAnchorId, JUMP_TARGET_SX } from "../YourPicksStrip";

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
      <Box
        sx={{ display: "flex", flexDirection: "column", gap: 0.5, minWidth: 0 }}
      >
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 1,
            fontSize: "0.8125rem",
            minHeight: 20,
          }}
        >
          <Box
            component="span"
            sx={{
              fontWeight: live?.down === 4 ? 700 : 600,
            }}
          >
            {down}
          </Box>
          <Box sx={{ display: "flex", gap: 0.5 }}>
            <HighlightFlags highlight={getGameHighlight(game)} />
          </Box>
        </Box>
        <FieldStrip game={game} height={16} />
      </Box>
    );
  }
  if (
    game.status === GameStatus.Halftime ||
    game.status === GameStatus.Delayed
  ) {
    return (
      <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
        <Typography variant="caption" sx={{ color: "text.secondary" }}>
          {game.status === GameStatus.Halftime ? "Halftime" : "Delayed"}
        </Typography>
        <FieldStrip game={game} height={16} />
      </Box>
    );
  }
  const f = game.forecast;
  if (f && game.stadium?.roof_type === "Open") {
    // Each part stays whole and the line wraps between parts, so a narrow
    // column shows "Wind 5 mph W" on a second line instead of "Wind 5 m…".
    const parts = weatherParts(f, { precip: false });
    return (
      <Typography
        variant="body2"
        sx={{ color: "text.secondary", fontSize: "0.8125rem" }}
      >
        {parts.map((part, i) => (
          <Fragment key={part}>
            <Box component="span" sx={{ whiteSpace: "nowrap" }}>
              {part}
              {i < parts.length - 1 && " ·"}
            </Box>
            {i < parts.length - 1 && " "}
          </Fragment>
        ))}
      </Typography>
    );
  }
  // Indoors: the stadium and its roof, as on the cards and Games. A long
  // name ellipsizes; the roof always shows.
  return (
    <Typography
      variant="body2"
      sx={{
        display: "flex",
        minWidth: 0,
        color: "text.secondary",
        fontSize: "0.8125rem",
      }}
    >
      <Box
        component="span"
        sx={{
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {game.stadium?.name ?? ""}
      </Box>
      {game.stadium && game.stadium.roof_type !== "Open" && (
        <Box component="span" sx={{ flexShrink: 0, whiteSpace: "pre" }}>
          {game.stadium.name ? " · " : ""}
          {roofText(game.stadium.roof_type)}
        </Box>
      )}
    </Typography>
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
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: { xs: 0.5, md: 1 },
          minWidth: 0,
        }}
      >
        <TeamLink
          abbr={team.abbr}
          sx={{ gap: { xs: 0.5, md: 1 }, flexShrink: 0 }}
        >
          <TeamLogo abbr={team.abbr} size={22} decorative />
          <Typography sx={{ fontWeight: 700, width: 38, flexShrink: 0 }}>
            {team.abbr}
          </Typography>
        </TeamLink>
        {/* A fixed slot, so the line, tag and score stay aligned whether or
            not this team has the ball */}
        <Box
          component="span"
          sx={{ width: 16, display: "inline-flex", flexShrink: 0 }}
        >
          {hasBall(game, side) && <BallIcon abbr={team.abbr} />}
        </Box>
        <Box
          component="span"
          sx={{
            fontSize: "0.75rem",
            color: "text.secondary",
            width: 52,
            flexShrink: 0,
            whiteSpace: "nowrap",
          }}
        >
          {teamLineText(game, side, total)}
        </Box>
        <AtsTag game={game} side={side} compact />
        <Typography
          sx={{
            ml: "auto",
            fontWeight: 700,
            fontSize: "1.25rem",
            lineHeight: 1,
            minWidth: 28,
            textAlign: "right",
            fontVariantNumeric: "tabular-nums",
            color: final && score < other ? "text.secondary" : "text.primary",
          }}
        >
          {started ? score : ""}
        </Typography>
      </Box>
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
    <Box
      id={gameAnchorId(game)}
      tabIndex={-1}
      sx={[
        (t) => ({
          ...JUMP_TARGET_SX,
          display: "grid",
          gridTemplateColumns:
            // Wide enough for "SUN 12:00 PM" on one line.
            "108px minmax(0, 1.4fr) minmax(0, 1.3fr) minmax(0, 1fr) 156px",
          gridTemplateAreas: desktopAreas,
          columnGap: 2,
          rowGap: 1,
          alignItems: "center",
          px: { xs: 1.25, md: 1.75 },
          py: 1.25,
          borderBottom: 1,
          borderColor: "divider",
          "&:last-of-type": { borderBottom: 0 },
          ...(pickSide && {
            background: `linear-gradient(90deg, ${t.palette.action.selected}, transparent 45%)`,
          }),
          [t.breakpoints.down("md")]: {
            // 96px fits "THU 12:30 PM"; the tighter gap and padding leave
            // the team lines the 196px they need at 360 (logo, abbr, ball,
            // line, ✓ tag, a two-digit score).
            gridTemplateColumns: "96px minmax(0, 1fr)",
            gridTemplateAreas: mobileAreas,
            columnGap: 1.25,
          },
        }),
        highlightSx(border, true),
      ]}
    >
      <Box
        sx={{
          gridArea: "status",
          display: "flex",
          flexDirection: "column",
          gap: 0.25,
          minWidth: 0,
        }}
      >
        <StatusText game={game} />
        <Typography variant="caption" sx={{ color: "text.secondary" }}>
          {tvName(game.tv_network)}
        </Typography>
        <GameRecapTags tags={tags} wrap />
      </Box>
      <Box
        sx={{
          gridArea: "teams",
          display: "flex",
          flexDirection: "column",
          gap: 0.5,
          minWidth: 0,
        }}
      >
        {teamLine("away")}
        {teamLine("home")}
      </Box>
      {!final && (
        <Box sx={{ gridArea: "middle", minWidth: 0 }}>
          <Middle game={game} />
        </Box>
      )}
      {hasDetails && (
        <Box
          sx={{
            gridArea: "toggle",
            minWidth: 0,
            borderTop: { xs: 1, md: 0 },
            borderColor: "divider",
            mt: { md: final ? 0 : -0.5 },
          }}
        >
          <DetailsToggle
            open={open}
            onToggle={() => setOpen((o) => !o)}
            sx={{
              width: { xs: "100%", md: "auto" },
              justifyContent: { xs: "center", md: "flex-start" },
            }}
          />
        </Box>
      )}
      <Box sx={{ gridArea: "picks", minWidth: 0 }}>
        <PickSplitBar
          game={game}
          userId={userId}
          picksRevealed={picksRevealed}
          compact
        />
      </Box>
      {/* Only rendered with a pick: the phone layout has no "you" area otherwise,
          and an unplaced area name makes the grid add phantom columns. */}
      {pickSide && (
        <Box
          sx={{
            gridArea: "you",
            display: "flex",
            justifyContent: { xs: "flex-start", md: "flex-end" },
          }}
        >
          <YourPickBadge game={game} side={pickSide} compact />
        </Box>
      )}
      {open && (
        <Box
          sx={{
            gridArea: "details",
            minWidth: 0,
            borderTop: 1,
            borderColor: "divider",
          }}
        >
          <GameDetails game={game} columns />
        </Box>
      )}
    </Box>
  );
});

GameRow.displayName = "GameRow";
