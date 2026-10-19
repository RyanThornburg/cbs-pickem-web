// Made-up /api/admin/* answers for snap.mjs: the real ones sit behind
// Cloudflare Access and carry every member's email. Times are relative to
// the frozen clock, so the cards read the same every run. One failing task,
// one stale task and a few events, so those states are covered too.

const ago = (now, minutes) =>
  new Date(now.getTime() - minutes * 60_000).toISOString();

export function adminStatus(now) {
  const ok = (minutes) => ({
    last_at: ago(now, minutes),
    last_success_at: ago(now, minutes),
    stale: false,
  });
  const live = (minutes) => ({
    last_at: ago(now, minutes),
    last_success_at: ago(now, minutes),
  });
  return {
    updated_at: ago(now, 1),
    last_run: {
      odds: {
        baseline_last_at: ago(now, 40),
        baseline_last_success_at: ago(now, 40),
        prekickoff_last_at: ago(now, 2),
        prekickoff_last_success_at: ago(now, 2),
        stale: false,
      },
      housekeeping: ok(55),
      cbs_picks_quiet_poll: ok(12),
      pregame_weather_capture: {
        last_at: ago(now, 3),
        last_success_at: ago(now, 95),
        stale: false,
      },
      user_profiles_write: { ...ok(26 * 60), stale: true },
      recap_write: ok(8),
      sports_io_live_poll: live(1),
      cbs_live_poll: live(1),
      game_snapshot_capture: live(2),
      live_game_stats_capture: live(2),
      live_player_stats_capture: live(3),
      scoring_plays_refresh: live(1),
      win_probability_capture: live(1),
      standings_refresh: live(180),
      team_profiles_write: live(181),
      deadline_last_synced_sunday: "2026-10-18",
    },
    mapping_gaps: {
      distinct_count: 1,
      total_occurrences: 4,
      recent: [
        {
          source: "sports_io",
          entity_type: "team",
          raw_value: "WSH",
          context: "week 7 schedule",
          first_seen_at: ago(now, 3 * 24 * 60),
          last_seen_at: ago(now, 300),
          occurrences: 4,
        },
      ],
    },
    system_events: {
      distinct_count: 2,
      total_occurrences: 9,
      active_count: 1,
      recent: [
        {
          source: "pregame_weather_capture",
          message: "Weather API responded with 503",
          first_seen_at: ago(now, 95),
          last_seen_at: ago(now, 3),
          occurrences: 7,
          active: true,
        },
        {
          source: "cbs_live_poll",
          message: "Timed out after 10s",
          first_seen_at: ago(now, 6 * 24 * 60),
          last_seen_at: ago(now, 5 * 24 * 60),
          occurrences: 2,
          active: false,
        },
      ],
    },
  };
}

const NAMES = [
  "Avery Stone",
  "Blake Rivera",
  "Casey Monroe",
  "Devon Hart",
  "Emerson Cole",
  "Finley Park",
  "Gray Ellison",
  "Harper Quinn",
];

export function adminRoster(season, now) {
  return {
    season,
    entry_fee: 50,
    users_updated_at: ago(now, 6 * 60),
    updated_at: ago(now, 2 * 24 * 60),
    users: NAMES.map((name, i) => ({
      user_id: 900 + i,
      name,
      email: i === 5 ? null : `${name.split(" ")[0].toLowerCase()}@example.com`,
      payment:
        i % 3 === 0
          ? null
          : {
              paid_amount: i === 4 ? 25 : 50,
              paid_at: "2026-09-0" + ((i % 8) + 1),
              method: ["venmo", "paypal", "cash_app", "cash", "other"][i % 5],
              note: i === 2 ? "Paid at the draft" : null,
            },
    })),
  };
}
