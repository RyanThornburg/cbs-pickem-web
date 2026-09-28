import { memo, useState } from "react";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import Chip from "@mui/material/Chip";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import PlaceIcon from "@mui/icons-material/Place";
import PublicIcon from "@mui/icons-material/Public";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { Game, GameStatus, LinescoreSide } from "../../../../types";
import { getVenueBadge } from "../../../../utils/venue";
import {
  getGameHighlight,
  hasBall,
  hasStarted,
  highlightBorder,
  isLiveStatus,
  Side,
  sideLine,
  userPickSide,
} from "../../utils/scoreboardUtils";
import { TeamLogo } from "../shared/TeamLogo";
import { BallIcon } from "../shared/BallIcon";
import { Timeouts } from "../shared/Timeouts";
import { AtsTag } from "../shared/AtsTag";
import { FieldStrip } from "../shared/FieldStrip";
import { PickSplitBar } from "../shared/PickSplitBar";
import { YourPickBadge } from "../shared/YourPickBadge";
import { HighlightFlags } from "../shared/HighlightFlags";
import { StatusText, tvName } from "../shared/StatusText";
import { highlightSx } from "../shared/highlightSx";
import { GameDetails } from "../GameDetails";

export interface GameCardProps {
  game: Game;
  userId?: string;
  totalUsers?: number;
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
    return <Box component="span" sx={{ fontWeight: 700 }}>Try / kickoff</Box>;
  }
  if (!live.down_distance_text) return null;
  return (
    <Box component="span" sx={{ fontWeight: 700, color: live.down === 4 ? "error.main" : "text.primary" }}>
      {live.down_distance_text}
    </Box>
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
    <Box sx={{ display: "flex", flexDirection: "column", gap: 0.75, bgcolor: "action.hover", borderRadius: 2, p: 1.25, fontSize: "0.85rem" }}>
      {inProgress && (
        <>
          <DownDistance game={game} />
          <FieldStrip game={game} />
        </>
      )}
      {lastPlay && (
        <Box>
          <Box component="span" sx={{ color: "text.secondary", fontWeight: 600, mr: 0.5 }}>Last play</Box>
          {lastPlay}
        </Box>
      )}
      {inProgress && (live.drive_text || leader || weather) && (
        <Box sx={{ display: "flex", flexWrap: "wrap", columnGap: 1.5, rowGap: 0.25, color: "text.secondary", fontSize: "0.8rem" }}>
          {live.drive_text && <span>Drive: {live.drive_text}</span>}
          {leader && <span>Win prob: {leader.abbr} {Math.round(leader.pct)}%</span>}
          {weather && (
            <span>
              Now: {Math.round(weather.temp_f)}° · {weather.condition} · wind {Math.round(weather.wind_speed_mph)} mph
            </span>
          )}
        </Box>
      )}
    </Box>
  );
};

const PregameLine = ({ game }: { game: Game }) => {
  const f = game.forecast;
  const outdoor = game.stadium?.roof_type === "Open";
  return (
    <Typography variant="body2" sx={{ color: "text.secondary", fontSize: "0.82rem" }}>
      {f && outdoor
        ? `Forecast: ${Math.round(f.temp_f)}° · ${f.condition} · wind ${Math.round(f.wind_speed_mph)} mph · ${f.precipitation_pct}% precip`
        : `${game.stadium?.name ?? ""}${game.stadium && !outdoor ? ` · ${game.stadium.roof_type.toLowerCase()} roof` : ""}`}
    </Typography>
  );
};

export const GameCard = memo(({ game, userId, totalUsers }: GameCardProps) => {
  const [open, setOpen] = useState(false);
  const highlight = getGameHighlight(game);
  const border = highlightBorder(highlight);
  const pickSide = userPickSide(game, userId);
  const venueBadge = getVenueBadge(game.stadium, game.neutral_site);
  const started = hasStarted(game);
  const live = game.live;
  const showTimeouts = isLiveStatus(game.status);
  const hasOt = game.linescore?.home.ot != null || game.linescore?.away.ot != null;
  const periods: (keyof LinescoreSide)[] = hasOt ? [...QUARTERS, "ot"] : QUARTERS;
  const final = game.status === GameStatus.Final;

  const teamRow = (side: Side) => {
    const team = side === "home" ? game.home_team : game.away_team;
    const score = side === "home" ? game.home_score : game.away_score;
    const other = side === "home" ? game.away_score : game.home_score;
    const line = game.linescore?.[side];
    return (
      <Box key={side} sx={{ display: "contents" }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, minWidth: 0 }}>
          <TeamLogo abbr={team.abbr} size={30} />
          <Box sx={{ minWidth: 0 }}>
            <Box sx={{ display: "flex", alignItems: "baseline", gap: 0.75, minWidth: 0 }}>
              <Typography sx={{ fontWeight: 700, fontSize: "1.05rem", lineHeight: 1.2 }}>{team.abbr}</Typography>
              {team.name && (
                <Typography noWrap sx={{ color: "text.secondary", fontSize: "0.8rem", display: { xs: "none", sm: "block" } }}>
                  {team.name}
                </Typography>
              )}
            </Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, flexWrap: "wrap", fontSize: "0.75rem", color: "text.secondary" }}>
              <span>{[recordText(game, side), sideLine(game, side)].filter(Boolean).join(" · ")}</span>
              <AtsTag game={game} side={side} />
              {hasBall(game, side) && <BallIcon />}
              {showTimeouts && <Timeouts left={side === "home" ? live?.home_timeouts : live?.away_timeouts} />}
            </Box>
          </Box>
        </Box>
        {periods.map((p) => (
          <Box key={p} sx={{ textAlign: "center", color: line?.[p] != null ? "text.secondary" : "text.disabled", fontSize: "0.85rem" }}>
            {line?.[p] ?? "–"}
          </Box>
        ))}
        <Typography
          sx={{
            textAlign: "right",
            fontWeight: 700,
            fontSize: "1.75rem",
            lineHeight: 1,
            fontVariantNumeric: "tabular-nums",
            color: final && score < other ? "text.disabled" : "text.primary",
          }}
        >
          {started ? score : ""}
        </Typography>
      </Box>
    );
  };

  return (
    <Card
      variant="outlined"
      sx={[
        { p: 1.75, display: "flex", flexDirection: "column", gap: 1.5 },
        !border && !!pickSide && ((t) => ({ borderColor: t.palette.primary.main })),
        highlightSx(border),
      ]}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap", fontSize: "0.8rem", color: "text.secondary" }}>
        <StatusText game={game} />
        <span>{tvName(game.tv_network)}</span>
        <HighlightFlags highlight={highlight} />
        {venueBadge && (
          <Chip
            icon={venueBadge.kind === "international" ? <PublicIcon /> : <PlaceIcon />}
            label={venueBadge.label}
            size="small"
            color="warning"
            variant="outlined"
          />
        )}
        <Box sx={{ flex: 1 }} />
        {pickSide && <YourPickBadge game={game} side={pickSide} />}
      </Box>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: `minmax(0, 1fr) repeat(${periods.length}, 22px) 48px`,
          alignItems: "center",
          columnGap: 0.75,
          rowGap: 1,
        }}
      >
        <span />
        {periods.map((p) => (
          <Box key={p} sx={{ textAlign: "center", fontSize: "0.7rem", fontWeight: 600, color: "text.disabled" }}>
            {p === "ot" ? "OT" : p.slice(1)}
          </Box>
        ))}
        <Box sx={{ textAlign: "right", fontSize: "0.7rem", fontWeight: 600, color: "text.disabled" }}>T</Box>
        {teamRow("away")}
        {teamRow("home")}
      </Box>

      <Situation game={game} />
      {game.status === GameStatus.Scheduled && <PregameLine game={game} />}

      <PickSplitBar game={game} userId={userId} totalUsers={totalUsers} />

      {final && (
        <Box sx={{ borderTop: 1, borderColor: "divider", pt: 0.5 }}>
          <Button
            size="small"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            endIcon={<ExpandMoreIcon sx={{ transform: open ? "rotate(180deg)" : "none", transition: "transform 0.2s" }} />}
            sx={{ px: 0.5, color: "text.secondary" }}
          >
            Box score and leaders
          </Button>
          {open && <GameDetails game={game} />}
        </Box>
      )}
    </Card>
  );
});

GameCard.displayName = "GameCard";
