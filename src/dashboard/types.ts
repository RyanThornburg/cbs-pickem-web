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
  down_distance_text?: string;
  is_red_zone?: boolean;
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
  forecast?: Forecast | null;
  picks: {
    home: UserId[];
    away: UserId[];
  };
  live?: GameLive;
}

export interface TeamRecord {
  wins: number;
  losses: number;
  ties: number;
}

export interface Team {
  id: number;
  abbr: string;
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
  weather_alert: string | null;
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

export interface SeasonTrends {
  season: number;
  updated_at: string;
  team_pick_totals: TeamPickTotal[];
  cold_teams_season: ColdTeamSeason[];
  team_ats_record: TeamAtsRecord[];
  all_alone_picks_season: SeasonAllAlonePick[];
}
