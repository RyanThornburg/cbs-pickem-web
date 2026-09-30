import { useEffect, useState } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import CircularProgress from "@mui/material/CircularProgress";
import {
  Game,
  GameDetails as GameDetailsData,
  PlayerLine,
} from "../../../../types";
import { fetchGameDetails } from "../../../../data/GetGameDetails";
import { poll } from "../../../../../api/pickemApi";
import { isLiveStatus } from "../../utils/scoreboardUtils";
import { useCurrentWeek } from "../../../CurrentWeekContext";
import { TeamLogo } from "../shared/TeamLogo";
import { STAT_BAR_COLORS, teamStatRows } from "../../utils/teamStats";

const LIVE_DETAILS_POLL_MS = 60_000;

// "38/52, 280 YDS, 2 TD" -- zero TD/INT counts are left off.
const statLine = (parts: [unknown, string, boolean?][]): string =>
  parts
    .filter(
      ([value, , hideZero]) =>
        value != null && value !== "" && !(hideZero && value === 0)
    )
    .map(([value, unit]) => (unit ? `${value} ${unit}` : String(value)))
    .join(", ");

const LEADER_FORMATS: {
  key: "passing" | "rushing" | "receiving";
  label: string;
  line: (s: PlayerLine["stats"]) => string;
}[] = [
  {
    key: "passing",
    label: "Passing",
    line: (s) =>
      statLine([
        [s.comp_att, ""],
        [s.yards, "YDS"],
        [s.passing_touch_downs, "TD", true],
        [s.interceptions, "INT", true],
      ]),
  },
  {
    key: "rushing",
    label: "Rushing",
    line: (s) =>
      statLine([
        [s.total_rushes, "CAR"],
        [s.yards, "YDS"],
        [s.rushing_touch_downs, "TD", true],
      ]),
  },
  {
    key: "receiving",
    label: "Receiving",
    line: (s) =>
      statLine([
        [s.total_receptions, "REC"],
        [s.yards, "YDS"],
        [s.receiving_touch_downs, "TD", true],
      ]),
  },
];

const SectionTitle = ({ children }: { children: string }) => (
  <Typography
    variant="overline"
    sx={{ color: "text.secondary", lineHeight: 1.6, fontWeight: 700 }}
  >
    {children}
  </Typography>
);

const Leaders = ({ game }: { game: Game }) => {
  const leaders = game.leaders;
  if (!leaders) return null;
  return (
    <Box>
      <SectionTitle>Leaders</SectionTitle>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "auto 1fr",
          columnGap: 1.5,
          rowGap: 0.75,
          fontSize: "0.82rem",
        }}
      >
        {LEADER_FORMATS.flatMap(({ key, label, line }) =>
          (["away", "home"] as const).map((side) => {
            const player = leaders[side][key];
            if (!player) return null;
            const abbr = (side === "home" ? game.home_team : game.away_team)
              .abbr;
            return (
              <Box key={`${key}-${side}`} sx={{ display: "contents" }}>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 0.75,
                    color: "text.secondary",
                  }}
                >
                  <TeamLogo abbr={abbr} size={16} />
                  {label}
                </Box>
                <Box sx={{ minWidth: 0 }}>
                  <b>{player.name}</b>{" "}
                  <Box component="span" sx={{ color: "text.secondary" }}>
                    {line(player.stats)}
                  </Box>
                </Box>
              </Box>
            );
          })
        )}
      </Box>
    </Box>
  );
};

const ScoringPlays = ({ game }: { game: Game }) => {
  const plays = game.scoring_plays ?? [];
  if (!plays.length) return null;
  // Array order is the real order -- clock is null on ~15% of plays.
  return (
    <Box>
      <SectionTitle>Scoring plays</SectionTitle>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "auto auto 1fr auto",
          columnGap: 1,
          rowGap: 0.75,
          fontSize: "0.8rem",
          alignItems: "start",
        }}
      >
        {plays.map((play, i) => {
          const abbr =
            play.team_id === game.home_team.id
              ? game.home_team.abbr
              : game.away_team.abbr;
          return (
            <Box key={i} sx={{ display: "contents" }}>
              <Box sx={{ color: "text.secondary", whiteSpace: "nowrap" }}>
                {play.quarter > 4 ? "OT" : `Q${play.quarter}`}{" "}
                {play.clock ?? ""}
              </Box>
              <TeamLogo abbr={abbr} size={16} />
              <Box sx={{ minWidth: 0 }}>{play.description}</Box>
              <Box
                sx={{
                  whiteSpace: "nowrap",
                  fontVariantNumeric: "tabular-nums",
                  color: "text.secondary",
                }}
              >
                {play.away_score}–{play.home_score}
              </Box>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
};

const StatSide = ({
  main,
  sub,
  align,
}: {
  main: string | number;
  sub?: string | number;
  align: "left" | "right";
}) => (
  <Box
    sx={{
      display: "flex",
      gap: 0.5,
      alignItems: "baseline",
      justifyContent: align === "left" ? "flex-start" : "flex-end",
      whiteSpace: "nowrap",
    }}
  >
    {align === "right" && sub != null && (
      <Box
        component="span"
        sx={{ color: "text.secondary", fontSize: "0.72rem" }}
      >
        ({sub})
      </Box>
    )}
    <Box component="span" sx={{ fontWeight: 600 }}>
      {main}
    </Box>
    {align === "left" && sub != null && (
      <Box
        component="span"
        sx={{ color: "text.secondary", fontSize: "0.72rem" }}
      >
        ({sub})
      </Box>
    )}
  </Box>
);

// ESPN-style: each stat gets a split bar in the two teams' colors, so who's
// ahead reads at a glance. Giveaways/penalties are flipped (fewer = longer).
const BoxScore = ({
  game,
  details,
}: {
  game: Game;
  details: GameDetailsData;
}) => {
  const box = details.box_score;
  if (!box) return null;
  const rows = teamStatRows(box.away, box.home);
  if (!rows.length) return null;
  const colors = STAT_BAR_COLORS;
  // Logo with a stripe in its bar color underneath, as the key
  const keyedLogo = (abbr: string, color: string) => (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "3px",
      }}
    >
      <TeamLogo abbr={abbr} size={22} />
      <Box sx={{ width: 22, height: 3, borderRadius: 2, bgcolor: color }} />
    </Box>
  );

  return (
    <Box>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "auto 1fr auto",
          alignItems: "center",
          mb: 0.5,
        }}
      >
        {keyedLogo(game.away_team.abbr, colors.away)}
        <Box sx={{ textAlign: "center" }}>
          <SectionTitle>Team stats</SectionTitle>
        </Box>
        {keyedLogo(game.home_team.abbr, colors.home)}
      </Box>
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: 1,
          fontSize: "0.82rem",
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {rows.map((row) => (
          <Box key={row.label}>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: "1fr auto 1fr",
                alignItems: "baseline",
                columnGap: 1,
              }}
            >
              <StatSide {...row.away} align="left" />
              <Box
                sx={{
                  color: "text.secondary",
                  textAlign: "center",
                  fontSize: "0.78rem",
                }}
              >
                {row.label}
              </Box>
              <StatSide {...row.home} align="right" />
            </Box>
            <Box
              role="img"
              aria-label={`${row.label}: ${game.away_team.abbr} ${row.away.main}, ${game.home_team.abbr} ${row.home.main}`}
              sx={{ display: "flex", gap: "4px", mt: "3px", height: 4 }}
            >
              <Box
                sx={{
                  width: `${row.awayShare * 100}%`,
                  bgcolor: colors.away,
                  borderRadius: 2,
                  minWidth: 3,
                }}
              />
              <Box
                sx={{
                  width: `${(1 - row.awayShare) * 100}%`,
                  bgcolor: colors.home,
                  borderRadius: 2,
                  minWidth: 3,
                }}
              />
            </Box>
          </Box>
        ))}
      </Box>
    </Box>
  );
};

// Opened from a card: leaders and scoring plays come with the games feed;
// team stats are fetched from the per-game details key on first open.
// `columns`: wide rows (compact layout) put team stats beside the leaders
// and scoring plays instead of under them.
export const GameDetails = ({
  game,
  columns = false,
}: {
  game: Game;
  columns?: boolean;
}) => {
  const { season } = useCurrentWeek();
  const [details, setDetails] = useState<GameDetailsData | null>(null);
  const [state, setState] = useState<"loading" | "done" | "missing">("loading");

  const live = isLiveStatus(game.status);

  // A live game's team stats keep changing, so refetch them every minute
  // while the panel is open (leaders and scoring plays already update with
  // the scoreboard's own poll). Once final, one fetch is enough.
  useEffect(() => {
    let cancelled = false;
    const load = () =>
      fetchGameDetails(season, game.game_id)
        .then((data) => {
          if (cancelled) return;
          setDetails(data);
          setState("done");
        })
        // Keep the last good stats on a failed refresh
        .catch(
          () => !cancelled && setState((s) => (s === "done" ? s : "missing"))
        );
    if (!live) {
      load();
      return () => {
        cancelled = true;
      };
    }
    const stop = poll(load, LIVE_DETAILS_POLL_MS);
    return () => {
      cancelled = true;
      stop();
    };
  }, [season, game.game_id, live]);

  const nothing =
    !game.leaders &&
    !game.scoring_plays?.length &&
    state !== "loading" &&
    !details?.box_score;
  return (
    <Box
      sx={{
        display: "grid",
        gap: 1.5,
        pt: 1,
        alignItems: "start",
        gridTemplateColumns: columns
          ? { xs: "1fr", md: "minmax(0, 3fr) minmax(0, 2fr)" }
          : "1fr",
      }}
    >
      {nothing && (
        <Typography variant="caption" sx={{ color: "text.secondary" }}>
          No stats for this game yet.
        </Typography>
      )}
      <Box
        sx={{ display: "flex", flexDirection: "column", gap: 1.5, minWidth: 0 }}
      >
        <Leaders game={game} />
        <ScoringPlays game={game} />
      </Box>
      <Box sx={{ minWidth: 0 }}>
        {state === "loading" && !details && <CircularProgress size={18} />}
        {details && <BoxScore game={game} details={details} />}
      </Box>
    </Box>
  );
};
