import { Fragment, ReactNode, useEffect, useState } from "react";
import {
  Alert,
  AlertColor,
  Button,
  Link,
  Stack,
  Typography,
} from "@mui/material";
import { alpha, Theme } from "@mui/material/styles";
import Grid from "@mui/material/Grid";
import LogoutIcon from "@mui/icons-material/Logout";
import RefreshIcon from "@mui/icons-material/Refresh";
import {
  AdminUnauthorizedError,
  GetAdminStatus,
} from "../../data/GetAdminStatus";
import { GetGameDataByWeek } from "../../data/GetGameDataByWeek";
import {
  AdminMappingGap,
  AdminStatus,
  AdminSystemEvent,
  AdminWatchedTask,
  Game,
  GameStatus,
} from "../../types";
import { useCurrentWeek } from "../CurrentWeekContext";
import TabIntro from "../TabIntro";
import TabSkeleton from "../TabSkeleton";
import {
  activeEventCount,
  deadlineSweepHealth,
  everyMinuteHealth,
  formatAgo,
  formatEt,
  formatShortDate,
  HEALTH_LABEL,
  HEARTBEAT_STALE_MS,
  isEventActive,
  isFailing,
  liveTaskHealth,
  onChangeHealth,
  summarizeHealth,
  TaskHealth,
  taskHealth,
} from "./adminUtils";
import EventsCard, { LastSeenCell } from "./EventsCard";
import TaskCard, { TaskRun } from "./TaskCard";

type SectionKey = "always" | "quiet" | "live" | "changes" | "other";

// How a task's health is judged: the data repo's stale flag ("watched"), the
// page's own 10-minute rule ("everyMinute"), idle unless a game is live
// ("live"), or only failures count ("onChange").
type Kind = "watched" | "everyMinute" | "live" | "onChange";

type TaskSpec = {
  key: string;
  name: string;
  section: SectionKey;
  kind: Kind;
  note?: string;
};

// Every task the page knows, in display order. Odds and the Sunday deadline
// sweep have their own shapes and are added separately (both under Always).
const TASKS: TaskSpec[] = [
  {
    key: "pregame_weather_capture",
    name: "Pregame weather",
    section: "always",
    kind: "watched",
  },
  {
    key: "user_profiles_write",
    name: "User profiles",
    section: "always",
    kind: "watched",
  },
  {
    key: "recap_write",
    name: "Week recap",
    section: "always",
    kind: "watched",
  },
  // Tick every minute and only call their API when there's something new,
  // with no data-side stale flag (EVERY_MINUTE_STALE_MS).
  {
    key: "scoring_plays_refresh",
    name: "Scoring plays",
    section: "always",
    kind: "everyMinute",
    note: "Every minute",
  },
  {
    key: "win_probability_capture",
    name: "Win probability (finals)",
    section: "always",
    kind: "everyMinute",
    note: "Every minute",
  },
  // Skipped while any game is live; their data-side stale limits already
  // allow for a long Sunday without a run.
  {
    key: "housekeeping",
    name: "Housekeeping",
    section: "quiet",
    kind: "watched",
  },
  {
    key: "cbs_picks_quiet_poll",
    name: "CBS quiet picks poll",
    section: "quiet",
    kind: "watched",
  },
  {
    key: "sports_io_live_poll",
    name: "Sports IO live poll",
    section: "live",
    kind: "live",
  },
  {
    key: "cbs_live_poll",
    name: "CBS live poll",
    section: "live",
    kind: "live",
  },
  {
    key: "game_snapshot_capture",
    name: "Game snapshots",
    section: "live",
    kind: "live",
  },
  {
    key: "live_game_stats_capture",
    name: "Live game stats",
    section: "live",
    kind: "live",
  },
  {
    key: "live_player_stats_capture",
    name: "Live player stats",
    section: "live",
    kind: "live",
  },
  {
    key: "standings_refresh",
    name: "NFL standings",
    section: "changes",
    kind: "onChange",
  },
  {
    key: "team_profiles_write",
    name: "Team profiles",
    section: "changes",
    kind: "onChange",
  },
];

const KNOWN_KEYS = new Set([
  "odds",
  "deadline_last_synced_sunday",
  ...TASKS.map((t) => t.key),
]);

const LIVE_STATUSES: GameStatus[] = [
  GameStatus.Inprogress,
  GameStatus.Halftime,
  GameStatus.Delayed,
];

// Tasks added to meta:admin later can be missing from an older payload;
// they render as "Never run" rather than crashing the page.
const NOT_RUN = { last_at: null, last_success_at: null };

type TaskTimes = { last_at: string | null; last_success_at: string | null };

// Any last_run entry with the attempt/success shape. Unknown keys qualify
// too, so a task the data repo adds later shows up under Other instead of
// going unwatched.
const asTask = (value: unknown): (TaskTimes & { stale?: boolean }) | null =>
  value && typeof value === "object" && "last_at" in value
    ? (value as AdminWatchedTask)
    : null;

type CardModel = {
  id: string;
  name: string;
  section: SectionKey;
  health: TaskHealth;
  runs: TaskRun[];
  note?: string;
  // system_events source for this task, if it writes there.
  source?: string;
  detail?: ReactNode;
};

const healthOf = (
  kind: Kind,
  task: TaskTimes & { stale?: boolean },
  liveSince: number | null,
  now: number
): TaskHealth => {
  switch (kind) {
    case "watched":
      return taskHealth(
        task.last_at,
        task.last_success_at,
        task.stale ?? false
      );
    case "everyMinute":
      return everyMinuteHealth(task.last_at, task.last_success_at, now);
    case "live":
      return liveTaskHealth(task.last_at, task.last_success_at, liveSince, now);
    case "onChange":
      return onChangeHealth(task.last_at, task.last_success_at);
  }
};

// Every card and its health in one place, so the cards and the banner's
// summary can't disagree.
const buildCards = (
  status: AdminStatus,
  liveSince: number | null,
  now: number
): CardModel[] => {
  const lastRun = status.last_run as unknown as Record<string, unknown>;
  const { odds } = status.last_run;
  // Odds is stale (data-side) only when neither capture has succeeded in
  // 12h, but either capture attempting-without-succeeding is worth flagging.
  const oddsHealth: TaskHealth =
    !odds.baseline_last_at && !odds.prekickoff_last_at
      ? "never"
      : isFailing(odds.baseline_last_at, odds.baseline_last_success_at) ||
          isFailing(odds.prekickoff_last_at, odds.prekickoff_last_success_at)
        ? "failing"
        : odds.stale
          ? "stale"
          : "fresh";
  const sunday = status.last_run.deadline_last_synced_sunday;

  const cards: CardModel[] = [
    // One card, one data-side stale flag for both lines: the pre-kickoff
    // capture keeps it fresh while the baseline is paused for live games.
    {
      id: "odds",
      name: "Odds",
      section: "always",
      health: oddsHealth,
      source: "odds_capture",
      runs: [
        {
          label: "Pre-kickoff",
          lastAt: odds.prekickoff_last_at,
          lastSuccessAt: odds.prekickoff_last_success_at,
        },
        {
          label: "Baseline (pauses during games)",
          lastAt: odds.baseline_last_at,
          lastSuccessAt: odds.baseline_last_success_at,
        },
      ],
    },
    ...TASKS.map((spec) => {
      const task = asTask(lastRun[spec.key]) ?? NOT_RUN;
      return {
        id: spec.key,
        name: spec.name,
        section: spec.section,
        note: spec.note,
        source: spec.key,
        health: healthOf(spec.kind, task, liveSince, now),
        runs: [{ lastAt: task.last_at, lastSuccessAt: task.last_success_at }],
      };
    }),
    {
      id: "deadline",
      name: "Sunday deadline sweep",
      section: "always",
      health: deadlineSweepHealth(sunday, now),
      runs: [],
      // Bare date, not a timestamp -- not run through the UTC->ET formatting.
      detail: (
        <>
          <Typography variant="body2">
            {sunday ? `Ran for Sun ${formatShortDate(sunday)}` : "Never run"}
          </Typography>
          <Typography variant="caption" sx={{ color: "text.secondary" }}>
            Sundays after 1 PM ET
          </Typography>
        </>
      ),
    },
  ];

  Object.entries(lastRun).forEach(([key, value]) => {
    const task = asTask(value);
    if (KNOWN_KEYS.has(key) || !task) return;
    cards.push({
      id: key,
      name: key,
      section: "other",
      source: key,
      health:
        task.stale === undefined
          ? onChangeHealth(task.last_at, task.last_success_at)
          : taskHealth(task.last_at, task.last_success_at, task.stale),
      runs: [{ lastAt: task.last_at, lastSuccessAt: task.last_success_at }],
    });
  });
  return cards;
};

const anchorId = (id: string) => `admin-task-${id}`;

// "All 16 tasks OK", or what's wrong, worst first, naming each task with a
// link to its card: "Failing: Pregame weather · Stale: User profiles".
const Summary = ({
  cards,
  activeEvents,
}: {
  cards: CardModel[];
  activeEvents: number;
}) => {
  const { problems } = summarizeHealth(cards.map((c) => c.health));
  if (problems.length === 0 && activeEvents === 0) {
    return <>All {cards.length} tasks OK.</>;
  }
  const parts: ReactNode[] = problems.map(({ health }) => (
    <Fragment key={health}>
      {HEALTH_LABEL[health]}:{" "}
      {cards
        .filter((c) => c.health === health)
        .map((c, i) => (
          <Fragment key={c.id}>
            {i > 0 && ", "}
            <Link href={`#${anchorId(c.id)}`} color="inherit">
              {c.name}
            </Link>
          </Fragment>
        ))}
    </Fragment>
  ));
  if (activeEvents > 0) {
    parts.push(
      <Link key="events" href="#admin-events" color="inherit">
        {activeEvents} active event{activeEvents === 1 ? "" : "s"}
      </Link>
    );
  }
  return (
    <>
      {parts.map((part, i) => (
        <Fragment key={i}>
          {i > 0 && " · "}
          {part}
        </Fragment>
      ))}
    </>
  );
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
    <Typography component="h3" variant="subtitle1" sx={{ fontWeight: 600 }}>
      {title}
    </Typography>
    <Typography variant="caption" sx={{ color: "text.secondary" }}>
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

// Earliest kickoff among the current week's live games (ms), or null.
const liveSinceOf = (games: Game[]): number | null => {
  const kickoffs = games
    .filter((g) => LIVE_STATUSES.includes(g.status))
    .map((g) => g.game_time)
    .filter(Number.isFinite);
  return kickoffs.length ? Math.min(...kickoffs) : null;
};

export default function AdminPanel() {
  const { season, currentWeek } = useCurrentWeek();
  const [status, setStatus] = useState<AdminStatus | null>(null);
  const [fetchedAt, setFetchedAt] = useState<number | null>(null);
  const [error, setError] = useState<Error | null>(null);
  // When the current run of failed fetches started, for the error banner.
  const [failingSince, setFailingSince] = useState<number | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [now, setNow] = useState(() => Date.now());
  const [liveSince, setLiveSince] = useState<number | null>(null);

  // Mounted only while the Admin tab is open (see MainGrid), so nothing polls
  // admin data in the background on the public tabs. Refresh restarts it.
  useEffect(
    () =>
      GetAdminStatus(
        (data) => {
          setStatus(data);
          setFetchedAt(Date.now());
          setError(null);
          setFailingSince(null);
        },
        (err) => {
          setError(err);
          setFailingSince((since) => since ?? Date.now());
        }
      ),
    [attempt]
  );

  // The current week's games, only to know whether live-only tasks should
  // be running right now (always the current week, whatever ?week= says).
  useEffect(
    () =>
      GetGameDataByWeek(season, currentWeek, (games) =>
        setLiveSince(liveSinceOf(games))
      ),
    [season, currentWeek]
  );

  // Keeps the "Nm ago" labels and heartbeat check current between polls.
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 15_000);
    return () => clearInterval(id);
  }, []);

  const unauthorized = error instanceof AdminUnauthorizedError;
  // A failing fetch makes everything shown out of date, but says nothing
  // about the pipeline, so the dead-heartbeat diagnosis waits for fresh data.
  const heartbeatAge = status
    ? now - new Date(status.updated_at).getTime()
    : null;
  const heartbeatDead =
    !error && heartbeatAge !== null && heartbeatAge > HEARTBEAT_STALE_MS;
  const dimmed = heartbeatDead || error !== null;
  const cards = status ? buildCards(status, liveSince, now) : [];
  const activeEvents = status ? activeEventCount(status.system_events, now) : 0;
  const summarySeverity: AlertColor =
    summarizeHealth(cards.map((c) => c.health)).severity ??
    (activeEvents > 0 ? "warning" : "success");
  // The newest active event per source, shown on that task's card.
  const eventBySource = new Map<string, string>();
  status?.system_events.recent
    .filter((e) => isEventActive(e, now))
    .forEach((e) => {
      if (!eventBySource.has(e.source)) eventBySource.set(e.source, e.message);
    });

  const section = (key: SectionKey) =>
    cards
      .filter((c) => c.section === key)
      .map((c) => (
        <Grid key={c.id} size={CARD_SIZE}>
          <TaskCard
            id={anchorId(c.id)}
            name={c.name}
            health={c.health}
            dimmed={dimmed}
            now={now}
            note={c.note}
            runs={c.runs}
            detail={c.detail}
            event={c.source ? eventBySource.get(c.source) : undefined}
            eventsHref="#admin-events"
          />
        </Grid>
      ));
  const otherCards = section("other");

  return (
    <>
      <TabIntro
        title="Admin"
        meta={
          fetchedAt
            ? `Pipeline status · checked ${formatAgo(new Date(fetchedAt).toISOString(), now)}`
            : "Pipeline status"
        }
        actions={
          <Stack direction="row" spacing={1}>
            <Button
              variant="outlined"
              size="small"
              startIcon={<RefreshIcon />}
              onClick={() => setAttempt((n) => n + 1)}
            >
              Refresh
            </Button>
            {/* Full navigation, not a router link: /logout is a Worker
                redirect to Access's own logout endpoint, which clears the
                session. */}
            <Button
              href="/logout"
              variant="outlined"
              size="small"
              startIcon={<LogoutIcon />}
            >
              Log out
            </Button>
          </Stack>
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
            {fetchedAt &&
              ` Showing what was loaded ${formatAgo(new Date(fetchedAt).toISOString(), now)}.`}
          </Alert>
        )}
        {error && !unauthorized && (
          <Alert severity="error" sx={severitySx("error")}>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              Can't reach admin status ({error.message})
              {failingSince &&
                ` since ${formatEt(new Date(failingSince).toISOString())}`}
              .
            </Typography>
            This is the page's own request, not the pipeline.{" "}
            {fetchedAt
              ? `Showing what was loaded ${formatAgo(new Date(fetchedAt).toISOString(), now)}. `
              : ""}
            Retrying every minute.
          </Alert>
        )}

        {!status && !error && (
          <TabSkeleton shape="cards" label="Loading pipeline status" />
        )}

        {status && (
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
              !error && (
                <Alert
                  severity={summarySeverity}
                  sx={severitySx(summarySeverity)}
                >
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    <Summary cards={cards} activeEvents={activeEvents} />
                  </Typography>
                  Pipeline heartbeat {formatAgo(status.updated_at, now)} (
                  {formatEt(status.updated_at)}).
                  <Typography
                    variant="caption"
                    sx={{ display: "block", color: "text.secondary" }}
                  >
                    Rewritten every minute. If it goes stale, the pipeline isn't
                    running.
                  </Typography>
                </Alert>
              )
            )}

            <TaskSection
              title="Always"
              caption="Run whether or not games are live."
            >
              {section("always")}
            </TaskSection>

            <TaskSection
              title="Quiet only"
              caption="Paused while games are live; their stale limits allow for it."
            >
              {section("quiet")}
            </TaskSection>

            <TaskSection
              title={
                liveSince === null ? "Live only" : "Live only · games live now"
              }
              caption={
                liveSince === null
                  ? "Run during games, idle between them."
                  : "Stale after 10 minutes without a run."
              }
            >
              {section("live")}
            </TaskSection>

            <TaskSection
              title="When data changes"
              caption="After a final, or a game's line, score or grades change. Long gaps are normal."
            >
              {section("changes")}
            </TaskSection>

            {otherCards.length > 0 && (
              <TaskSection
                title="Other"
                caption="In meta:admin but new to this page."
              >
                {otherCards}
              </TaskSection>
            )}

            <Grid container spacing={2}>
              <Grid size={12}>
                <EventsCard<AdminSystemEvent>
                  id="admin-events"
                  title="System events"
                  description="Caught failures. Active means seen in the last 24h."
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
                  description="Source values a loader couldn't match to a D1 row. They never raise an error."
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
