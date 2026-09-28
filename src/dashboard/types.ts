export interface UserId {
  id: string;
  name: string;
}

export interface UserPick {
  game_id: number;
  team: string;
  is_correct: boolean | null;
  trending_status?: string;
  game_status: GameStatus;
  visible: boolean;
}

export interface RankedUser {
  id: string;
  name: string;
  weekly_score: number;
  trending_score: number;
  cumulative_score: number;
  second_half_score: number | null;
  place: number;
  second_half_place: number | null;
  picks: UserPick[];
}

export enum GameStatus {
  Final = "FINAL",
  Inprogress = "IN_PROGRESS",
  Scheduled = "SCHEDULED",
  Halftime = "HALFTIME",
  Delayed = "DELAYED",
}

export interface GameLive {
  quarter?: number;
  time_remaining?: string;
  possession?: Possession;
  // Numeric down/distance -- down is -1 on a try/kickoff (distance 0, no text)
  down?: number;
  distance?: number;
  down_distance_text?: string;
  is_red_zone?: boolean;
  home_timeouts?: number;
  away_timeouts?: number;
  // Yards from the HOME team's goal line (0-100), regardless of possession.
  // May hold a stale spot between possessions -- only trust it while
  // possession_text is set.
  yard_line?: number;
  possession_text?: string; // the spot as printed, "TB 38"
  last_play?: { text: string | null; type: string | null };
  drive_text?: string; // "10 plays, 17 yards, 5:10"
  // Where the current drive began, same home-goal-line frame as yard_line.
  // Both null when ESPN has no drive; can briefly still be the previous
  // drive's right after a change of possession, until the first snap.
  drive_start?: { yard_line: number | null; text: string | null };
  win_probability?: { home: number | null; away: number | null };
  // Actual conditions right now, same shape as the kickoff forecast; null
  // for domes/retractables.
  weather?: Forecast | null;
}

// Scoreboard feed additions (2026-09-27). All optional: the games key only
// carries them once the data repo's pipeline deploy is running.
export interface LinescoreSide {
  q1: number | null;
  q2: number | null;
  q3: number | null;
  q4: number | null;
  ot: number | null;
}

export interface Linescore {
  home: LinescoreSide;
  away: LinescoreSide;
}

// One player's line -- `stats` keys vary by group (passing/rushing/...) and
// the source can add keys without notice, so it's an open record.
// Compound values stay strings: comp_att "38/52", sacks "2-8".
export interface PlayerLine {
  name: string;
  sports_io_player_id?: number;
  image?: string | null;
  stats: Record<string, number | string | null>;
}

export interface TeamLeaders {
  passing: PlayerLine | null;
  rushing: PlayerLine | null;
  receiving: PlayerLine | null;
}

export interface GameLeaders {
  home: TeamLeaders;
  away: TeamLeaders;
}

// Chronological -- sort by array position, never by clock (null on ~15%).
export interface ScoringPlay {
  quarter: number; // 5 = OT
  clock: string | null;
  team_id: number;
  type: string; // TD, FG, SF/Safety, 2PTC -- plus rare odd values
  description: string;
  player_name: string | null;
  home_score: number; // score after this play
  away_score: number;
}

// `game:{season}:{game_id}:details` -- fetched only when a game is opened.
export interface TeamBoxScore {
  first_downs_total?: number;
  third_down_conversions?: number;
  third_down_attempts?: number;
  fourth_down_conversions?: number;
  fourth_down_attempts?: number;
  redzone_made?: number;
  redzone_attempts?: number;
  plays_total?: number;
  yards_total?: number;
  yards_per_play?: number;
  passing_yards?: number;
  rushing_yards?: number;
  penalties?: number;
  penalty_yards?: number;
  // this team's giveaways
  total_turnovers?: number;
  sacks_given_up?: number;
  time_of_possession_sec?: number;
  [key: string]: number | undefined;
}

export interface GameDetails {
  game_id: number;
  updated_at: string;
  box_score: { home: TeamBoxScore; away: TeamBoxScore } | null;
  players: {
    home: Record<string, PlayerLine[]>;
    away: Record<string, PlayerLine[]>;
  } | null;
  win_probability: unknown[] | null;
}

export interface Game {
  game_id: number;
  home_team: Team;
  away_team: Team;
  status: GameStatus;
  home_score: number;
  away_score: number;
  game_time: number;
  cbs_spread?: number;
  tv_network?: string;
  gametracker_url?: string;
  stadium?: Stadium;
  neutral_site?: boolean;
  forecast?: Forecast | null;
  picks: {
    home: UserId[];
    away: UserId[];
  };
  live?: GameLive;
  status_desc?: string;
  linescore?: Linescore | null;
  leaders?: GameLeaders | null;
  scoring_plays?: ScoringPlay[];
}

export interface TeamRecord {
  wins: number;
  losses: number;
  ties: number;
}

export interface Team {
  id: number;
  abbr: string;
  name?: string; // "Steelers"
  record?: TeamRecord;
}

export interface Stadium {
  name: string;
  city: string;
  state?: string;
  country: string;
  latitude?: number;
  longitude?: number;
  roof_type: "Open" | "Dome" | "Retractable";
  surface_type?: string;
}

export interface Forecast {
  temp_f: number;
  feels_like_f: number;
  condition: string;
  icon?: string;
  precip_type: string;
  wind_speed_mph: number;
  wind_gust_mph: number;
  wind_direction?: string;
  precipitation_pct: number;
  visibility_mi: number;
  // Replaced the old single `weather_alert: string | null` (2026-09-27).
  weather_alerts?: WeatherAlert[];
  // Present on every forecast, but only populated once the game is inside
  // the hourly-forecast window -- until then every field is null and
  // `hours` is []. Treat an empty `hours` as "no during-game data", not zeros.
  during_game?: DuringGameForecast | null;
  source?: string | null;
  captured_at?: string;
}

// Only `title` is populated so far -- the rest have been null on every
// alert seen live.
export interface WeatherAlert {
  title: string;
  severity: string | null;
  starts: string | null;
  expires: string | null;
  uri: string | null;
}

export interface DuringGameForecast {
  precipitation_pct_max: number | null;
  // Defaults to "rain" even when every hour is 0% -- read precip off the
  // pct/condition, not this.
  precip_type: string | null;
  wind_gust_mph_max: number | null;
  temp_f_low: number | null;
  temp_f_high: number | null;
  snow_accumulation_in: number | null;
  hours: HourlyForecast[];
}

export interface HourlyForecast {
  time: string;
  temp_f: number;
  feels_like_f: number;
  condition: string;
  icon?: string | null;
  precip_type: string | null;
  precipitation_pct: number;
  wind_speed_mph: number;
  wind_gust_mph: number;
  wind_direction?: string;
}

export interface MarketSpread {
  book_count: number;
  open: number;
  open_agreement: number;
  close: number;
  close_agreement: number;
}

// One side of a book's line: for spread/moneyline home/away means the team.
// For total there's no team side -- odds_snapshots just reuses the same
// home/away columns, confirmed: home_point/home_price is the Over line and
// price, away_point/away_price is the Under.
export interface BookMarketSide {
  home_point: number | null;
  home_price: number | null;
  away_point: number | null;
  away_price: number | null;
  captured_at: string;
}

export interface Book {
  bookmaker: string;
  moneyline?: BookMarketSide;
  spread?: BookMarketSide;
  total?: BookMarketSide;
}

export interface GameOdds {
  game_id: number;
  home_team: Team;
  away_team: Team;
  game_time?: number;
  cbs_spread?: number;
  market_spread: MarketSpread | null;
  books?: Book[];
}

export enum Possession {
  Away = "AWAY",
  Home = "HOME",
}

export interface TeamPickCount {
  id: number;
  abbr: string;
  name: string;
  game_id: number;
  pick_count: number;
  opponent_pick_count: number;
  pct_of_game_pickers: number;
}

export interface ColdTeam {
  id: number;
  abbr: string;
  name: string;
  game_id: number;
}

export interface OneSidedGame {
  game_id: number;
  home_team: Team;
  away_team: Team;
  home_picks: number;
  away_picks: number;
  consensus_side: "home" | "away";
  consensus_pct: number;
}

export interface AllAlonePick {
  game_id: number;
  user_id: number;
  name: string;
  picked_team_id: number;
  abbr: string;
  opposing_count: number;
}

export interface LineMover {
  game_id: number;
  home_team: Team;
  away_team: Team;
  open: number;
  close: number;
  movement: number;
  book_count: number;
}

export interface WeekTrends {
  week: number;
  updated_at: string;
  pick_popularity: TeamPickCount[];
  cold_teams: ColdTeam[];
  one_sided_games: OneSidedGame[];
  all_alone_picks: AllAlonePick[];
  spread_movers: LineMover[];
}

export interface TeamPickTotal {
  id: number;
  abbr: string;
  name: string;
  total_picks: number;
  pct_of_all_picks: number;
}

export interface ColdTeamSeason {
  id: number;
  abbr: string;
  name: string;
}

export interface TeamAtsRecord {
  id: number;
  abbr: string;
  name: string;
  covers: number;
  pushes: number;
  losses: number;
  cover_pct: number;
}

export interface SeasonAllAlonePick extends AllAlonePick {
  week_number: number;
}

// Pool-wide version of a user's personal TrapTeam (types.ts) -- same
// trap_score = pct_of_all_picks * (1 - cover_pct) formula, unscoped to one
// user. Added 2026-09-23 as "public_enemy"/"enemy_score", renamed to
// "trap_team"/"trap_score" the same day.
export interface GroupTrapTeam {
  id: number;
  abbr: string;
  name: string;
  total_picks: number;
  pct_of_all_picks: number;
  cover_pct: number;
  trap_score: number;
}

// Per team, everyone who picked it ("believers") vs everyone who picked
// their opponent instead ("faders"), each with their own ATS accuracy on
// that split. Replaced the per-user head_to_head field 2026-09-23 -- this is
// team-centric ("who's actually right when people disagree"), not a
// user-vs-user pairing.
export interface TeamBelieversFaders {
  id: number;
  abbr: string;
  name: string;
  believers: { pick_count: number; accuracy: number };
  faders: { pick_count: number; accuracy: number };
}

export interface SeasonTrends {
  season: number;
  updated_at: string;
  team_pick_totals: TeamPickTotal[];
  cold_teams_season: ColdTeamSeason[];
  team_ats_record: TeamAtsRecord[];
  trap_team: GroupTrapTeam[];
  team_believers_faders: TeamBelieversFaders[];
  all_alone_picks_season: SeasonAllAlonePick[];
}

export interface TeamRef {
  id: number;
  abbr: string;
  name: string;
}

export interface SeasonHistoryEntry {
  season: number;
  incomplete: boolean;
  rank: number;
  score: number;
  first_half_rank: number | null;
  first_half_score: number | null;
  second_half_rank: number | null;
  second_half_score: number | null;
}

export interface CareerTrend {
  last_season: { season: number; rank: number; score: number } | null;
  prior_season: { season: number; rank: number; score: number } | null;
  rank_change: number | null;
  // "improving" = rank went down (better) from prior_season to last_season,
  // "declining" = rank went up (worse), "same" = tied. Both season fields
  // are past, closed seasons -- this says nothing about current_rank.
  direction: "improving" | "declining" | "same" | string;
}

export interface UserCareer {
  years_played: number;
  titles: number;
  best_finish: number;
  best_finish_years: number[];
  season_history: SeasonHistoryEntry[];
  trend: CareerTrend | null;
}

// One side of a pick-bias split (home/away/favorite/underdog): how often the
// user picks that side, season-wide. Used to carry current_streak/
// longest_streak (consecutive picks), but the data repo dropped those
// 2026-09-23 -- ordered by kickoff time, not actual pick order (CBS exposes
// no per-pick timestamp), and didn't reset at week boundaries the way
// hot_streak/team_pick_streak deliberately do. pct needs no ordering and is
// what's actually reliable here.
export interface PickBiasSide {
  pct: number;
  picks: number;
}

export interface PickBias {
  home: PickBiasSide;
  away: PickBiasSide;
  favorite: PickBiasSide;
  underdog: PickBiasSide;
}

export interface HotStreak {
  threshold_pct: number;
  current_streak: number;
  longest_streak: number;
}

export interface TeamPickStreak {
  current: { team: TeamRef; weeks: number } | null;
  longest: { team: TeamRef; weeks: number } | null;
  most_picked_team: { team: TeamRef; count: number } | null;
}

export interface ContrarianStats {
  contrarian_picks: number;
  contrarian_accuracy_pct: number | null;
  chalk_picks: number;
  chalk_accuracy_pct: number | null;
}

// current_season's matchup/records fields form a 2x2, reworked 2026-09-23:
//   picks FOR this team only   x   either side of the matchup
//   bad:  trap_team                blind_spot_team
//   good: lucky_team               sweet_spot_team
// The old pure-rate nemesis_team/lucky_team pair (a team picked twice and
// lost twice ranked the same as one picked ten times and lost eight) was
// dropped the same day a real example showed it could rank a 3-loss team
// above a 7-loss team just because the 3-loss team's *rate* happened worse
// on a smaller sample -- volume-weighting fixes that.

// Shared shape for trap_team/lucky_team -- "picks for this team only",
// weighted by pct_of_picks so a habit that's actually costly/rewarding
// outranks a small-sample blip. See SpotTeam for the either-side-of-the-
// matchup counterpart (blind_spot_team/sweet_spot_team).
export interface VolumeWeightedTeam {
  team: TeamRef;
  wins: number;
  losses: number;
  win_pct: number;
  pct_of_picks: number;
}

// "The team you keep picking that keeps burning you" --
// trap_score = pct_of_picks * (1 - win_pct). Added 2026-09-23 as
// "public_enemy"/"enemy_score", renamed to "trap_team"/"trap_score" the same
// day. Guarded: null unless win_pct < 0.5 (an exact .500 team reports null
// for both trap_team and lucky_team, not both at once -- a same-day bug fix,
// since a naive "score is nonzero" check doesn't exclude .500). Has a
// pool-wide counterpart on season:{season}:trends (same shape, unscoped to
// one user).
export interface TrapTeam extends VolumeWeightedTeam {
  trap_score: number;
}

// The volume-weighted flip side of trap_team --
// lucky_score = pct_of_picks * win_pct. Guarded: null unless win_pct > 0.5.
export interface LuckyTeam extends VolumeWeightedTeam {
  lucky_score: number;
}

// Combined accuracy on a team's games regardless of which side was picked --
// picking team P and fading P's opponent are the same real bet (P covers
// exactly when O doesn't), so every graded pick counts toward both teams'
// tallies at once. Different question from trap_team/lucky_team ("stop
// picking FOR this team") -- this is "stop picking this team's games AT ALL,
// either way." blind_spot_team requires accuracy < 0.5, sweet_spot_team
// requires accuracy > 0.5. Added 2026-09-23.
export interface SpotTeam {
  team: TeamRef;
  picks: number;
  accuracy: number;
}

export interface WeekScore {
  week_number: number;
  score: number;
}

export interface ClutchStats {
  money_week_accuracy_pct: number | null;
  season_accuracy_pct: number | null;
  money_weeks_counted: number;
}

// Population stddev of weekly scores; null until 2+ complete weeks exist.
// Lower means steadier week to week.
export interface ConsistencyStats {
  stddev: number;
  weeks_counted: number;
}

export interface UserSeasonCurrent {
  total_picks: number;
  total_correct: number;
  accuracy_pct: number;
  current_rank: number;
  hot_streak: HotStreak;
  team_pick_streak: TeamPickStreak;
  pick_bias: PickBias;
  contrarian: ContrarianStats;
  trap_team: TrapTeam | null;
  lucky_team: LuckyTeam | null;
  blind_spot_team: SpotTeam | null;
  sweet_spot_team: SpotTeam | null;
  best_week: WeekScore | null;
  worst_week: WeekScore | null;
  consistency: ConsistencyStats | null;
  clutch: ClutchStats;
}

export interface UserSeasonTrends {
  user_id: number;
  name: string;
  season: number;
  career: UserCareer;
  current_season: UserSeasonCurrent;
  updated_at: string;
}

// meta:admin -- pipeline health summary, rewritten by the data repo on every
// orchestration tick (~once a minute), served only to the admin via
// /api/admin/status. Every timestamp is ISO 8601 UTC, null if the task has
// never run (or never succeeded) in that environment.

// Tasks with a data-side `stale` flag (last_success_at vs. a per-task limit).
// Some run regardless of games (pregame weather, user profiles); others pause
// while any game is live (housekeeping, CBS quiet poll) -- their limits are
// loosened to allow for a long Sunday without a run.
export interface AdminWatchedTask {
  last_at: string | null;
  last_success_at: string | null;
  stale: boolean;
}

// Odds tracks two captures; `stale` only when neither has succeeded in 12h.
// Baseline pauses while games are live; pre-kickoff runs every tick.
export interface AdminOddsTask {
  baseline_last_at: string | null;
  baseline_last_success_at: string | null;
  prekickoff_last_at: string | null;
  prekickoff_last_success_at: string | null;
  stale: boolean;
}

// Only run during a game's live window, so an old timestamp is normal most
// of the week -- no stale flag. Only sports_io_live_poll records attempts and
// successes separately; for the rest last_success_at is a copy of last_at.
export interface AdminLiveTask {
  last_at: string | null;
  last_success_at: string | null;
}

export interface AdminLastRun {
  odds: AdminOddsTask;
  housekeeping: AdminWatchedTask;
  cbs_picks_quiet_poll: AdminWatchedTask;
  pregame_weather_capture: AdminWatchedTask;
  user_profiles_write: AdminWatchedTask;
  sports_io_live_poll: AdminLiveTask;
  cbs_live_poll: AdminLiveTask;
  game_snapshot_capture: AdminLiveTask;
  live_game_stats_capture: AdminLiveTask;
  // Bare date ("2026-09-20"), not a timestamp. Runs on the first tick after
  // Sunday 1 PM ET, live games or not.
  deadline_last_synced_sunday: string | null;
}

// An external value a loader couldn't match to a D1 row (team id, week name,
// CBS user...). One row per distinct (source, entity_type, raw_value).
export interface AdminMappingGap {
  source: string;
  entity_type: string;
  raw_value: string;
  context: string;
  first_seen_at: string;
  last_seen_at: string;
  occurrences: number;
}

// A caught failure; one row per distinct (source, message). Never ages out,
// so compare last_seen_at to now to tell whether it's still happening.
export interface AdminSystemEvent {
  source: string;
  message: string;
  first_seen_at: string;
  last_seen_at: string;
  occurrences: number;
}

// `recent` is the 20 most recently seen rows; the counts include everything.
export interface AdminEventSummary<T> {
  distinct_count: number;
  total_occurrences: number;
  recent: T[];
}

export interface AdminStatus {
  updated_at: string;
  last_run: AdminLastRun;
  mapping_gaps: AdminEventSummary<AdminMappingGap>;
  system_events: AdminEventSummary<AdminSystemEvent>;
}
