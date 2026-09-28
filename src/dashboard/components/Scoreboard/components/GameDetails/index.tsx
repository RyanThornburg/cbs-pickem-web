import { useEffect, useState } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import CircularProgress from "@mui/material/CircularProgress";
import { Game, GameDetails as GameDetailsData, PlayerLine, TeamBoxScore } from "../../../../types";
import { fetchGameDetails } from "../../../../data/GetGameDetails";
import { useCurrentWeek } from "../../../CurrentWeekContext";
import { TeamLogo } from "../shared/TeamLogo";

// "38/52, 280 YDS, 2 TD" -- zero TD/INT counts are left off.
const statLine = (parts: [unknown, string, boolean?][]): string =>
  parts
    .filter(([value, , hideZero]) => value != null && value !== "" && !(hideZero && value === 0))
    .map(([value, unit]) => (unit ? `${value} ${unit}` : String(value)))
    .join(", ");

const LEADER_FORMATS: { key: "passing" | "rushing" | "receiving"; label: string; line: (s: PlayerLine["stats"]) => string }[] = [
  {
    key: "passing",
    label: "Passing",
    line: (s) => statLine([[s.comp_att, ""], [s.yards, "YDS"], [s.passing_touch_downs, "TD", true], [s.interceptions, "INT", true]]),
  },
  {
    key: "rushing",
    label: "Rushing",
    line: (s) => statLine([[s.total_rushes, "CAR"], [s.yards, "YDS"], [s.rushing_touch_downs, "TD", true]]),
  },
  {
    key: "receiving",
    label: "Receiving",
    line: (s) => statLine([[s.total_receptions, "REC"], [s.yards, "YDS"], [s.receiving_touch_downs, "TD", true]]),
  },
];

const formatSeconds = (sec: number) => `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, "0")}`;
const ratio = (made?: number, att?: number) => (made == null || att == null ? undefined : `${made}/${att}`);

const BOX_ROWS: { label: string; value: (b: TeamBoxScore) => string | number | undefined }[] = [
  { label: "Total yards", value: (b) => b.yards_total },
  { label: "Passing yards", value: (b) => b.passing_yards },
  { label: "Rushing yards", value: (b) => b.rushing_yards },
  { label: "First downs", value: (b) => b.first_downs_total },
  { label: "3rd down", value: (b) => ratio(b.third_down_conversions, b.third_down_attempts) },
  { label: "4th down", value: (b) => ratio(b.fourth_down_conversions, b.fourth_down_attempts) },
  { label: "Red zone", value: (b) => ratio(b.redzone_made, b.redzone_attempts) },
  { label: "Turnovers", value: (b) => b.total_turnovers },
  { label: "Sacks allowed", value: (b) => b.sacks_given_up },
  { label: "Penalties", value: (b) => (b.penalties == null ? undefined : `${b.penalties}-${b.penalty_yards ?? 0}`) },
  { label: "Possession", value: (b) => (b.time_of_possession_sec == null ? undefined : formatSeconds(b.time_of_possession_sec)) },
];

const SectionTitle = ({ children }: { children: string }) => (
  <Typography variant="overline" sx={{ color: "text.secondary", lineHeight: 1.6, fontWeight: 700 }}>
    {children}
  </Typography>
);

const Leaders = ({ game }: { game: Game }) => {
  const leaders = game.leaders;
  if (!leaders) return null;
  return (
    <Box>
      <SectionTitle>Leaders</SectionTitle>
      <Box sx={{ display: "grid", gridTemplateColumns: "auto 1fr", columnGap: 1.5, rowGap: 0.75, fontSize: "0.82rem" }}>
        {LEADER_FORMATS.flatMap(({ key, label, line }) =>
          (["away", "home"] as const).map((side) => {
            const player = leaders[side][key];
            if (!player) return null;
            const abbr = (side === "home" ? game.home_team : game.away_team).abbr;
            return (
              <Box key={`${key}-${side}`} sx={{ display: "contents" }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, color: "text.secondary" }}>
                  <TeamLogo abbr={abbr} size={16} />
                  {label}
                </Box>
                <Box sx={{ minWidth: 0 }}>
                  <b>{player.name}</b>{" "}
                  <Box component="span" sx={{ color: "text.secondary" }}>{line(player.stats)}</Box>
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
      <Box sx={{ display: "grid", gridTemplateColumns: "auto auto 1fr auto", columnGap: 1, rowGap: 0.75, fontSize: "0.8rem", alignItems: "start" }}>
        {plays.map((play, i) => {
          const abbr = play.team_id === game.home_team.id ? game.home_team.abbr : game.away_team.abbr;
          return (
            <Box key={i} sx={{ display: "contents" }}>
              <Box sx={{ color: "text.secondary", whiteSpace: "nowrap" }}>
                {play.quarter > 4 ? "OT" : `Q${play.quarter}`} {play.clock ?? ""}
              </Box>
              <TeamLogo abbr={abbr} size={16} />
              <Box sx={{ minWidth: 0 }}>{play.description}</Box>
              <Box sx={{ whiteSpace: "nowrap", fontVariantNumeric: "tabular-nums", color: "text.secondary" }}>
                {play.away_score}–{play.home_score}
              </Box>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
};

const BoxScore = ({ game, details }: { game: Game; details: GameDetailsData }) => {
  const box = details.box_score;
  if (!box) return null;
  const rows = BOX_ROWS.filter(({ value }) => value(box.away) != null || value(box.home) != null);
  return (
    <Box>
      <SectionTitle>Team stats</SectionTitle>
      <Box sx={{ display: "grid", gridTemplateColumns: "1fr auto auto", columnGap: 2, rowGap: 0.5, fontSize: "0.82rem", fontVariantNumeric: "tabular-nums" }}>
        <span />
        <Box sx={{ color: "text.secondary", fontWeight: 600, textAlign: "right" }}>{game.away_team.abbr}</Box>
        <Box sx={{ color: "text.secondary", fontWeight: 600, textAlign: "right" }}>{game.home_team.abbr}</Box>
        {rows.map(({ label, value }) => (
          <Box key={label} sx={{ display: "contents" }}>
            <Box sx={{ color: "text.secondary" }}>{label}</Box>
            <Box sx={{ textAlign: "right" }}>{value(box.away) ?? "–"}</Box>
            <Box sx={{ textAlign: "right" }}>{value(box.home) ?? "–"}</Box>
          </Box>
        ))}
      </Box>
    </Box>
  );
};

// Opened from a card: leaders and scoring plays come with the games feed;
// team stats are fetched from the per-game details key on first open.
export const GameDetails = ({ game }: { game: Game }) => {
  const { season } = useCurrentWeek();
  const [details, setDetails] = useState<GameDetailsData | null>(null);
  const [state, setState] = useState<"loading" | "done" | "missing">("loading");

  useEffect(() => {
    let cancelled = false;
    setState("loading");
    fetchGameDetails(season, game.game_id)
      .then((data) => {
        if (cancelled) return;
        setDetails(data);
        setState("done");
      })
      .catch(() => !cancelled && setState("missing"));
    return () => {
      cancelled = true;
    };
  }, [season, game.game_id]);

  const nothing = !game.leaders && !game.scoring_plays?.length && state !== "loading" && !details?.box_score;
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5, pt: 1 }}>
      {nothing && (
        <Typography variant="caption" sx={{ color: "text.secondary" }}>
          No stats for this game yet.
        </Typography>
      )}
      <Leaders game={game} />
      <ScoringPlays game={game} />
      {state === "loading" && <CircularProgress size={18} />}
      {details && <BoxScore game={game} details={details} />}
    </Box>
  );
};
