import { Fragment, useEffect, useState } from "react";
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
import { TeamLogo } from "../../../shared/TeamLogo";
import { STAT_BAR_COLORS, teamStatRows } from "../../utils/teamStats";
import { GameFlow } from "./GameFlow";
import { PlayerStats } from "./PlayerStats";
import styles from "./GameDetails.module.css";

// The details key is rewritten at most every 15 seconds while a game is
// live (its win probability curve grows with each snapshot), so an open
// panel polls at that pace.
const LIVE_DETAILS_POLL_MS = 15_000;

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
  <span className={styles.sectionTitle}>{children}</span>
);

const Leaders = ({ game }: { game: Game }) => {
  const leaders = game.leaders;
  if (!leaders) return null;
  return (
    <div>
      <SectionTitle>Leaders</SectionTitle>
      <div className={styles.leaders}>
        {LEADER_FORMATS.flatMap(({ key, label, line }) =>
          (["away", "home"] as const).map((side) => {
            const player = leaders[side][key];
            if (!player) return null;
            const abbr = (side === "home" ? game.home_team : game.away_team)
              .abbr;
            return (
              <Fragment key={`${key}-${side}`}>
                <div className={styles.leaderLabel}>
                  <TeamLogo abbr={abbr} size={16} />
                  {label}
                </div>
                <div className={styles.shrink}>
                  <b>{player.name}</b>{" "}
                  <span className={styles.muted}>{line(player.stats)}</span>
                </div>
              </Fragment>
            );
          })
        )}
      </div>
    </div>
  );
};

const ScoringPlays = ({ game }: { game: Game }) => {
  const plays = game.scoring_plays ?? [];
  if (!plays.length) return null;
  // Array order is the real order -- clock is null on ~15% of plays.
  return (
    <div>
      <SectionTitle>Scoring plays</SectionTitle>
      <div className={styles.plays}>
        {plays.map((play, i) => {
          const abbr =
            play.team_id === game.home_team.id
              ? game.home_team.abbr
              : game.away_team.abbr;
          return (
            <Fragment key={i}>
              <div className={styles.playClock}>
                {play.quarter > 4 ? "OT" : `Q${play.quarter}`}{" "}
                {play.clock ?? ""}
              </div>
              <TeamLogo abbr={abbr} size={16} />
              <div className={styles.shrink}>{play.description}</div>
              <div className={styles.playScore}>
                {play.away_score}–{play.home_score}
              </div>
            </Fragment>
          );
        })}
      </div>
    </div>
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
  <div
    className={
      align === "left"
        ? styles.statSide
        : `${styles.statSide} ${styles.statSideRight}`
    }
  >
    {align === "right" && sub != null && (
      <span className={styles.statSub}>({sub})</span>
    )}
    <span className={styles.statMain}>{main}</span>
    {align === "left" && sub != null && (
      <span className={styles.statSub}>({sub})</span>
    )}
  </div>
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
    <div className={styles.keyedLogo}>
      <TeamLogo abbr={abbr} size={22} />
      <div className={styles.keyStripe} style={{ backgroundColor: color }} />
    </div>
  );

  return (
    <div>
      <div className={styles.statsHead}>
        {keyedLogo(game.away_team.abbr, colors.away)}
        <div className={styles.statsTitle}>
          <SectionTitle>Team stats</SectionTitle>
        </div>
        {keyedLogo(game.home_team.abbr, colors.home)}
      </div>
      <div className={styles.statRows}>
        {rows.map((row) => (
          <div key={row.label}>
            <div className={styles.statLine}>
              <StatSide {...row.away} align="left" />
              <div className={styles.statLabel}>{row.label}</div>
              <StatSide {...row.home} align="right" />
            </div>
            <div
              role="img"
              aria-label={`${row.label}: ${game.away_team.abbr} ${row.away.main}, ${game.home_team.abbr} ${row.home.main}`}
              className={styles.bar}
            >
              <div
                className={styles.barPart}
                style={{
                  width: `${row.awayShare * 100}%`,
                  backgroundColor: colors.away,
                }}
              />
              <div
                className={styles.barPart}
                style={{
                  width: `${(1 - row.awayShare) * 100}%`,
                  backgroundColor: colors.home,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
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

  // A live game's stats and win probability keep changing, so refetch them
  // while the panel is open (leaders and scoring plays already update with
  // the scoreboard's own poll). A finished game keeps polling only while its
  // curve is still the live one, until ESPN's final curve replaces it
  // (usually a minute or two); then nothing changes again.
  useEffect(() => {
    let cancelled = false;
    let stop = () => {};
    const load = () =>
      fetchGameDetails(season, game.game_id)
        .then((data) => {
          if (cancelled) return;
          setDetails(data);
          setState("done");
          if (!live && data.win_probability_source !== "live") stop();
        })
        // Keep the last good stats on a failed refresh. A finished game
        // with no key (404) has nothing coming, so it stops.
        .catch(() => {
          if (cancelled) return;
          setState((s) => (s === "done" ? s : "missing"));
          if (!live) stop();
        });
    stop = poll(load, LIVE_DETAILS_POLL_MS);
    return () => {
      cancelled = true;
      stop();
    };
  }, [season, game.game_id, live]);

  const curve = details?.win_probability ?? [];

  const nothing =
    !game.leaders &&
    !game.scoring_plays?.length &&
    state !== "loading" &&
    !details?.box_score;
  return (
    <div
      className={columns ? `${styles.panel} ${styles.columns}` : styles.panel}
    >
      {nothing && (
        <span className={styles.empty}>No stats for this game yet.</span>
      )}
      {curve.length > 1 && (
        <div className={styles.fullWidth}>
          <GameFlow game={game} points={curve} final={!live} />
        </div>
      )}
      <div className={styles.stack}>
        <Leaders game={game} />
        <ScoringPlays game={game} />
      </div>
      <div className={styles.shrink}>
        {state === "loading" && !details && <CircularProgress size={18} />}
        {details && <BoxScore game={game} details={details} />}
      </div>
      {details?.players && (
        <div className={styles.fullWidth}>
          <PlayerStats game={game} players={details.players} />
        </div>
      )}
    </div>
  );
};
