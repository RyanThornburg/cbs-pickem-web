import { ReactNode, useEffect, useState } from "react";
import { Alert, AlertColor, Button, Stack, Typography } from "@mui/material";
import { alpha, Theme } from "@mui/material/styles";
import Grid from "@mui/material/Grid";
import LogoutIcon from "@mui/icons-material/Logout";
import {
  AdminUnauthorizedError,
  GetAdminStatus,
} from "../../data/GetAdminStatus";
import {
  AdminLiveTask,
  AdminMappingGap,
  AdminOddsTask,
  AdminStatus,
  AdminSystemEvent,
  AdminWatchedTask,
} from "../../types";
import {
  activeEventCount,
  deadlineSweepHealth,
  everyMinuteHealth,
  formatAgo,
  formatEt,
  HEALTH_LABEL,
  HEARTBEAT_STALE_MS,
  isEventActive,
  isFailing,
  summarizeHealth,
  TaskHealth,
  taskHealth,
} from "./adminUtils";
import EventsCard, { LastSeenCell } from "./EventsCard";
import TabIntro from "../TabIntro";
import TaskCard from "./TaskCard";

type WatchedKey =
  | "housekeeping"
  | "cbs_picks_quiet_poll"
  | "pregame_weather_capture"
  | "user_profiles_write"
  | "recap_write";

type LiveKey =
  | "sports_io_live_poll"
  | "cbs_live_poll"
  | "game_snapshot_capture"
  | "live_game_stats_capture"
  | "live_player_stats_capture";

type EveryMinuteKey = "scoring_plays_refresh" | "win_probability_capture";

// Tasks added to meta:admin later can be missing from an older payload;
// they render as "Never run" rather than crashing the page.
const NOT_RUN = { last_at: null, last_success_at: null };

// Run on their own cadence whether or not games are live (Odds and the Sunday
// deadline sweep also sit in this group, rendered separately).
const ALWAYS_TASKS: { key: WatchedKey; name: string }[] = [
  { key: "pregame_weather_capture", name: "Pregame weather" },
  { key: "user_profiles_write", name: "User profiles" },
  { key: "recap_write", name: "Week recap" },
];

// Also always on, but with no data-side stale flag: they tick every minute
// and only call their API when there's something new, so the page judges
// staleness itself (EVERY_MINUTE_STALE_MS).
const EVERY_MINUTE_TASKS: { key: EveryMinuteKey; name: string }[] = [
  { key: "scoring_plays_refresh", name: "Scoring plays" },
  { key: "win_probability_capture", name: "Win probability (finals)" },
];

// Skipped while any game is in its live window -- their data-side stale
// limits already allow for a long Sunday without a run.
const QUIET_TASKS: { key: WatchedKey; name: string }[] = [
  { key: "housekeeping", name: "Housekeeping" },
  { key: "cbs_picks_quiet_poll", name: "CBS quiet picks poll" },
];

const LIVE_TASKS: { key: LiveKey; name: string }[] = [
  { key: "sports_io_live_poll", name: "Sports IO live poll" },
  { key: "cbs_live_poll", name: "CBS live poll" },
  { key: "game_snapshot_capture", name: "Game snapshots" },
  { key: "live_game_stats_capture", name: "Live game stats" },
  { key: "live_player_stats_capture", name: "Live player stats" },
];

// Odds is stale (data-side) only when neither capture has succeeded in 12h,
// but either capture attempting-without-succeeding is still worth flagging.
const oddsHealth = (odds: AdminOddsTask): TaskHealth => {
  if (!odds.baseline_last_at && !odds.prekickoff_last_at) return "never";
  if (
    isFailing(odds.baseline_last_at, odds.baseline_last_success_at) ||
    isFailing(odds.prekickoff_last_at, odds.prekickoff_last_success_at)
  ) {
    return "failing";
  }
  return odds.stale ? "stale" : "fresh";
};

const watchedHealth = (task: AdminWatchedTask) =>
  taskHealth(task.last_at, task.last_success_at, task.stale);

const liveHealth = (task: AdminLiveTask) =>
  taskHealth(task.last_at, task.last_success_at, undefined);

type CardKey = "odds" | "deadline" | WatchedKey | EveryMinuteKey | LiveKey;

// Every card's health in one place, so the cards and the banner's summary
// can't disagree.
const cardHealths = (
  status: AdminStatus,
  now: number
): Record<CardKey, TaskHealth> => {
  const { last_run } = status;
  const watched = (key: WatchedKey) =>
    watchedHealth(last_run[key] ?? { ...NOT_RUN, stale: false });
  const everyMinute = (key: EveryMinuteKey) => {
    const task = last_run[key] ?? NOT_RUN;
    return everyMinuteHealth(task.last_at, task.last_success_at, now);
  };
  const live = (key: LiveKey) => liveHealth(last_run[key] ?? NOT_RUN);
  return {
    odds: oddsHealth(last_run.odds),
    deadline: deadlineSweepHealth(last_run.deadline_last_synced_sunday, now),
    housekeeping: watched("housekeeping"),
    cbs_picks_quiet_poll: watched("cbs_picks_quiet_poll"),
    pregame_weather_capture: watched("pregame_weather_capture"),
    user_profiles_write: watched("user_profiles_write"),
    recap_write: watched("recap_write"),
    scoring_plays_refresh: everyMinute("scoring_plays_refresh"),
    win_probability_capture: everyMinute("win_probability_capture"),
    sports_io_live_poll: live("sports_io_live_poll"),
    cbs_live_poll: live("cbs_live_poll"),
    game_snapshot_capture: live("game_snapshot_capture"),
    live_game_stats_capture: live("live_game_stats_capture"),
    live_player_stats_capture: live("live_player_stats_capture"),
  };
};

const plural = (count: number, word: string) =>
  `${count} ${word}${count === 1 ? "" : "s"}`;

// "All 14 tasks OK", or what's wrong, worst first: "1 Failing · 2 Stale ·
// 1 active event".
const summaryText = (
  healths: TaskHealth[],
  activeEvents: number
): { severity: AlertColor; text: string } => {
  const { severity, problems } = summarizeHealth(healths);
  const parts = problems.map(
    ({ health, count }) => `${count} ${HEALTH_LABEL[health]}`
  );
  if (activeEvents > 0) parts.push(plural(activeEvents, "active event"));
  if (parts.length === 0) {
    return { severity: "success", text: `All ${healths.length} tasks OK.` };
  }
  return { severity: severity ?? "warning", text: parts.join(" · ") };
};

const TaskSection = ({
  title,
  caption,
  children,
}: {
  title: string;
  caption: string;
  children: ReactNode;
}) => (
  <section>
    <Typography
      variant="subtitle1"
      sx={{
        fontWeight: 600,
      }}
    >
      {title}
    </Typography>
    <Typography
      variant="caption"
      sx={{
        color: "text.secondary",
      }}
    >
      {caption}
    </Typography>
    <Grid container spacing={2} sx={{ mt: 1 }}>
      {children}
    </Grid>
  </section>
);

// The shared theme paints every Alert orange (a leftover from the MUI
// template), which would make a healthy heartbeat and a dead one look alike --
// re-color by severity here rather than changing Alerts app-wide.
const severitySx = (severity: AlertColor) => ({
  backgroundColor: (theme: Theme) => alpha(theme.palette[severity].main, 0.12),
  borderColor: (theme: Theme) => alpha(theme.palette[severity].main, 0.4),
  "& .MuiAlert-icon": { color: `${severity}.main` },
});

const CARD_SIZE = { xs: 12, sm: 6, md: 4, lg: 2.4 };

export default function AdminPanel() {
  const [status, setStatus] = useState<AdminStatus | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [now, setNow] = useState(() => Date.now());

  // Mounted only while the Admin tab is open (see MainGrid), so nothing polls
  // admin data in the background on the public tabs.
  useEffect(
    () =>
      GetAdminStatus((data) => {
        setStatus(data);
        setError(null);
      }, setError),
    []
  );

  // Keeps the "Nm ago" labels and heartbeat check current between polls.
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 15_000);
    return () => clearInterval(id);
  }, []);

  const unauthorized = error instanceof AdminUnauthorizedError;
  const heartbeatAge = status
    ? now - new Date(status.updated_at).getTime()
    : null;
  const heartbeatDead =
    heartbeatAge !== null && heartbeatAge > HEARTBEAT_STALE_MS;
  const health = status ? cardHealths(status, now) : null;
  const activeEvents = status ? activeEventCount(status.system_events, now) : 0;
  const summary = health
    ? summaryText(Object.values(health), activeEvents)
    : null;

  return (
    <>
      <TabIntro
        title="Admin"
        meta="Pipeline status"
        actions={
          // Full navigation, not a router link: /logout is a Worker
          // redirect to Access's own logout endpoint, which clears the
          // session.
          <Button
            href="/logout"
            variant="outlined"
            size="small"
            startIcon={<LogoutIcon />}
          >
            Log out
          </Button>
        }
      />
      <Stack spacing={3} sx={{ textAlign: "left" }}>
        {unauthorized && (
          <Alert
            severity="warning"
            sx={severitySx("warning")}
            action={
              // Full page load so it goes back through the Access login.
              <Button color="inherit" size="small" href="/admin">
                Sign in
              </Button>
            }
          >
            Your admin session has expired or you're not signed in.
          </Alert>
        )}
        {error && !unauthorized && (
          <Alert severity="error" sx={severitySx("error")}>
            Couldn't load admin status ({error.message}). Retrying every minute.
          </Alert>
        )}

        {status && health && (
          <>
            {heartbeatDead ? (
              <Alert severity="error" sx={severitySx("error")}>
                Pipeline heartbeat is {formatAgo(status.updated_at, now)} (
                {formatEt(status.updated_at)}). meta:admin normally updates
                every minute, so the pipeline isn't running: the machine is off,
                the cron has stopped, or it crashes on startup. Everything below
                is out of date too, so it's greyed out.
              </Alert>
            ) : (
              summary && (
                <Alert
                  severity={summary.severity}
                  sx={severitySx(summary.severity)}
                >
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {summary.text}
                  </Typography>
                  Pipeline heartbeat {formatAgo(status.updated_at, now)} (
                  {formatEt(status.updated_at)}).
                  <Typography
                    variant="caption"
                    sx={{
                      display: "block",
                      color: "text.secondary",
                    }}
                  >
                    Rewritten every minute. If this goes stale, the pipeline
                    isn't running. A single failing task doesn't stop it: those
                    show up below as a Failing card and in System events.
                  </Typography>
                </Alert>
              )
            )}

            <TaskSection
              title="Always"
              caption="Run on their own cadence whether or not games are live. Stale means the last success is past the data repo's per-task limit; for the every-minute tasks, no run in 10 minutes."
            >
              <Grid size={CARD_SIZE}>
                {/* One card, one data-side stale flag for both lines: the
                  pre-kickoff capture keeps it fresh while the baseline is
                  paused for live games. */}
                <TaskCard
                  name="Odds"
                  health={health.odds}
                  dimmed={heartbeatDead}
                  now={now}
                  runs={[
                    {
                      label: "Pre-kickoff",
                      lastAt: status.last_run.odds.prekickoff_last_at,
                      lastSuccessAt:
                        status.last_run.odds.prekickoff_last_success_at,
                    },
                    {
                      label: "Baseline (pauses during games)",
                      lastAt: status.last_run.odds.baseline_last_at,
                      lastSuccessAt:
                        status.last_run.odds.baseline_last_success_at,
                    },
                  ]}
                />
              </Grid>
              {ALWAYS_TASKS.map(({ key, name }) => {
                const task = status.last_run[key] ?? {
                  ...NOT_RUN,
                  stale: false,
                };
                return (
                  <Grid key={key} size={CARD_SIZE}>
                    <TaskCard
                      name={name}
                      health={health[key]}
                      dimmed={heartbeatDead}
                      now={now}
                      runs={[
                        {
                          lastAt: task.last_at,
                          lastSuccessAt: task.last_success_at,
                        },
                      ]}
                    />
                  </Grid>
                );
              })}
              {EVERY_MINUTE_TASKS.map(({ key, name }) => {
                const task = status.last_run[key] ?? NOT_RUN;
                return (
                  <Grid key={key} size={CARD_SIZE}>
                    <TaskCard
                      name={name}
                      health={health[key]}
                      dimmed={heartbeatDead}
                      now={now}
                      note="Every minute"
                      runs={[
                        {
                          lastAt: task.last_at,
                          lastSuccessAt: task.last_success_at,
                        },
                      ]}
                    />
                  </Grid>
                );
              })}
              <Grid size={CARD_SIZE}>
                <TaskCard
                  name="Sunday deadline sweep"
                  health={health.deadline}
                  dimmed={heartbeatDead}
                  now={now}
                  runs={[]}
                  detail={
                    // Bare date, not a timestamp -- shown as-is rather than
                    // run through the UTC->ET formatting.
                    <>
                      <Typography variant="body2">
                        Ran for Sun{" "}
                        {status.last_run.deadline_last_synced_sunday ?? "never"}
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{
                          color: "text.secondary",
                        }}
                      >
                        Once per week, first tick after Sun 1 PM ET
                      </Typography>
                    </>
                  }
                />
              </Grid>
            </TaskSection>

            <TaskSection
              title="Quiet only"
              caption="Paused while any game is live, so hours without a run on a Sunday is normal. Stale limits already allow for that."
            >
              {QUIET_TASKS.map(({ key, name }) => {
                const task = status.last_run[key] ?? {
                  ...NOT_RUN,
                  stale: false,
                };
                return (
                  <Grid key={key} size={CARD_SIZE}>
                    <TaskCard
                      name={name}
                      health={health[key]}
                      dimmed={heartbeatDead}
                      now={now}
                      runs={[
                        {
                          lastAt: task.last_at,
                          lastSuccessAt: task.last_success_at,
                        },
                      ]}
                    />
                  </Grid>
                );
              })}
            </TaskSection>

            <TaskSection
              title="Live only"
              caption="Only run during a game's live window, so an old timestamp is normal most of the week."
            >
              {LIVE_TASKS.map(({ key, name }) => {
                const task = status.last_run[key] ?? NOT_RUN;
                return (
                  <Grid key={key} size={CARD_SIZE}>
                    <TaskCard
                      name={name}
                      health={health[key]}
                      dimmed={heartbeatDead}
                      now={now}
                      runs={[
                        {
                          lastAt: task.last_at,
                          lastSuccessAt: task.last_success_at,
                        },
                      ]}
                    />
                  </Grid>
                );
              })}
            </TaskSection>

            <Grid container spacing={2}>
              <Grid size={12}>
                <EventsCard<AdminSystemEvent>
                  title="System events"
                  description="Caught failures, one row per source + message. These never age out. Active means seen in the last 24h."
                  distinctCount={status.system_events.distinct_count}
                  totalOccurrences={status.system_events.total_occurrences}
                  activeCount={activeEvents}
                  rows={status.system_events.recent}
                  rowKey={(row) => `${row.source}|${row.message}`}
                  emptyText="No recorded failures."
                  columns={[
                    { header: "Source", render: (row) => row.source },
                    {
                      header: "Message",
                      wide: true,
                      render: (row) => (
                        <Typography
                          variant="body2"
                          sx={{
                            fontFamily: "monospace",
                            wordBreak: "break-word",
                          }}
                        >
                          {row.message}
                        </Typography>
                      ),
                    },
                    {
                      header: "Last seen",
                      render: (row) => (
                        <LastSeenCell
                          iso={row.last_seen_at}
                          now={now}
                          active={isEventActive(row, now)}
                        />
                      ),
                    },
                    {
                      header: "Count",
                      align: "right",
                      render: (row) => row.occurrences,
                    },
                  ]}
                />
              </Grid>
              <Grid size={12}>
                <EventsCard<AdminMappingGap>
                  title="Mapping gaps"
                  description="Source values a loader couldn't match to a D1 row. These never raise an error, so they only show up here."
                  distinctCount={status.mapping_gaps.distinct_count}
                  totalOccurrences={status.mapping_gaps.total_occurrences}
                  rows={status.mapping_gaps.recent}
                  rowKey={(row) =>
                    `${row.source}|${row.entity_type}|${row.raw_value}`
                  }
                  emptyText="No unmapped values."
                  columns={[
                    {
                      header: "Source",
                      render: (row) => `${row.source} · ${row.entity_type}`,
                    },
                    {
                      header: "Value",
                      wide: true,
                      render: (row) => (
                        <>
                          <Typography
                            variant="body2"
                            sx={{
                              fontFamily: "monospace",
                              wordBreak: "break-word",
                            }}
                          >
                            {row.raw_value}
                          </Typography>
                          <Typography
                            variant="caption"
                            sx={{
                              color: "text.secondary",
                            }}
                          >
                            {row.context}
                          </Typography>
                        </>
                      ),
                    },
                    {
                      header: "Last seen",
                      render: (row) => (
                        <LastSeenCell iso={row.last_seen_at} now={now} />
                      ),
                    },
                    {
                      header: "Count",
                      align: "right",
                      render: (row) => row.occurrences,
                    },
                  ]}
                />
              </Grid>
            </Grid>
          </>
        )}
      </Stack>
    </>
  );
}
