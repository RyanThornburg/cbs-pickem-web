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
  deadlineSweepHealth,
  EVENT_ACTIVE_MS,
  formatAgo,
  formatEt,
  HEARTBEAT_STALE_MS,
  isFailing,
  TaskHealth,
  taskHealth,
} from "./adminUtils";
import EventsCard, { LastSeenCell } from "./EventsCard";
import TaskCard from "./TaskCard";

type WatchedKey =
  | "housekeeping"
  | "cbs_picks_quiet_poll"
  | "pregame_weather_capture"
  | "user_profiles_write";

type LiveKey =
  | "sports_io_live_poll"
  | "cbs_live_poll"
  | "game_snapshot_capture"
  | "live_game_stats_capture";

// Run on their own cadence whether or not games are live (Odds and the Sunday
// deadline sweep also sit in this group, rendered separately).
const ALWAYS_TASKS: { key: WatchedKey; name: string }[] = [
  { key: "pregame_weather_capture", name: "Pregame weather" },
  { key: "user_profiles_write", name: "User profiles" },
];

// Skipped while any game is in its live window -- their data-side stale
// limits already allow for a long Sunday without a run.
const QUIET_TASKS: { key: WatchedKey; name: string }[] = [
  { key: "housekeeping", name: "Housekeeping" },
  { key: "cbs_picks_quiet_poll", name: "CBS quiet picks poll" },
];

// Only sports_io_live_poll records attempts and successes separately; for the
// rest last_success_at is a copy of last_at, and a failure aborts the whole
// tick (so it shows as a stale heartbeat, not a failing card).
const LIVE_TASKS: { key: LiveKey; name: string; tracksFailures: boolean }[] = [
  {
    key: "sports_io_live_poll",
    name: "Sports IO live poll",
    tracksFailures: true,
  },
  { key: "cbs_live_poll", name: "CBS live poll", tracksFailures: false },
  {
    key: "game_snapshot_capture",
    name: "Game snapshots",
    tracksFailures: false,
  },
  {
    key: "live_game_stats_capture",
    name: "Live game stats",
    tracksFailures: false,
  },
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

const liveHealth = (task: AdminLiveTask, tracksFailures: boolean) =>
  taskHealth(task.last_at, task.last_success_at, undefined, tracksFailures);

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

  return (
    <Stack spacing={3} sx={{ textAlign: "left" }}>
      <Stack
        direction="row"
        spacing={2}
        sx={{
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Typography variant="h6">Pipeline status</Typography>
        {/* Full navigation, not a router link: /logout is a Worker redirect
            to Access's own logout endpoint, which clears the session. */}
        <Button
          href="/logout"
          variant="outlined"
          size="small"
          startIcon={<LogoutIcon />}
        >
          Log out
        </Button>
      </Stack>

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

      {status && heartbeatAge !== null && (
        <>
          {heartbeatAge > HEARTBEAT_STALE_MS ? (
            <Alert severity="error" sx={severitySx("error")}>
              Pipeline heartbeat is {formatAgo(status.updated_at, now)} (
              {formatEt(status.updated_at)}). meta:admin normally updates every
              minute -- cron or the orchestrator has likely stopped (or is
              crashing), so everything below is out of date too. Check
              logs/error.log.
            </Alert>
          ) : (
            <Alert severity="success" sx={severitySx("success")}>
              Pipeline heartbeat {formatAgo(status.updated_at, now)} (
              {formatEt(status.updated_at)}).
              <Typography
                variant="caption"
                sx={{
                  display: "block",
                  color: "text.secondary",
                }}
              >
                Rewritten every minute. If this goes stale, the orchestrator is
                crashing or not running -- most task failures abort the tick and
                only show up here. Check logs/error.log.
              </Typography>
            </Alert>
          )}

          <TaskSection
            title="Always"
            caption="Run on their own cadence whether or not games are live. Stale means the last success is past the data repo's per-task limit."
          >
            <Grid size={CARD_SIZE}>
              {/* One card, one data-side stale flag for both lines: the
                  pre-kickoff capture keeps it fresh while the baseline is
                  paused for live games. */}
              <TaskCard
                name="Odds"
                health={oddsHealth(status.last_run.odds)}
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
              const task = status.last_run[key];
              return (
                <Grid key={key} size={CARD_SIZE}>
                  <TaskCard
                    name={name}
                    health={watchedHealth(task)}
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
            <Grid size={CARD_SIZE}>
              <TaskCard
                name="Sunday deadline sweep"
                health={deadlineSweepHealth(
                  status.last_run.deadline_last_synced_sunday,
                  now
                )}
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
              const task = status.last_run[key];
              return (
                <Grid key={key} size={CARD_SIZE}>
                  <TaskCard
                    name={name}
                    health={watchedHealth(task)}
                    now={now}
                    note="Pauses during games"
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
            caption={
              "Only run during a game's live window, so an old timestamp is normal most of the week. \"Ran\" means the data can't tell a success from an attempt."
            }
          >
            {LIVE_TASKS.map(({ key, name, tracksFailures }) => {
              const task = status.last_run[key];
              return (
                <Grid key={key} size={CARD_SIZE}>
                  <TaskCard
                    name={name}
                    health={liveHealth(task, tracksFailures)}
                    now={now}
                    runs={[
                      {
                        lastAt: task.last_at,
                        lastSuccessAt: task.last_success_at,
                        tracksFailures,
                      },
                    ]}
                  />
                </Grid>
              );
            })}
          </TaskSection>

          <Grid container spacing={2}>
            <Grid size={{ xs: 12, lg: 6 }}>
              <EventsCard<AdminSystemEvent>
                title="System events"
                description="Caught failures, one row per source + message. These never age out -- Active means seen in the last 24h."
                distinctCount={status.system_events.distinct_count}
                totalOccurrences={status.system_events.total_occurrences}
                rows={status.system_events.recent}
                rowKey={(row) => `${row.source}|${row.message}`}
                emptyText="No recorded failures."
                columns={[
                  { header: "Source", render: (row) => row.source },
                  {
                    header: "Message",
                    minWidth: 240,
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
                        activeWithinMs={EVENT_ACTIVE_MS}
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
            <Grid size={{ xs: 12, lg: 6 }}>
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
                    minWidth: 160,
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
  );
}
