export interface TeamPicked {
  count: number;
  cover: boolean;
  is_game: boolean;
  team: string;
}

export interface User {
  id: string;
  period_score: number;
  picks: Pick[];
  rank: number;
  score: number;
  trending_score: number;
  name: string;
}

export interface Pick {
  game_id?: number;
  game_status?: GameStatus;
  pick_status?: PickStatus;
  team?: string;
  team_id?: number;
  visible: boolean;
}

export enum GameStatus {
  Final = "FINAL",
  Inprogress = "INPROGRESS",
  Scheduled = "SCHEDULED",
}

export enum PickStatus {
  Correct = "CORRECT",
  Incorrect = "INCORRECT",
  Missing = "MISSING",
  None = "NONE",
}

export interface WeekCover {
  correct: number;
  total: number;
  week: string;
  result: number;
}

export interface Game {
  away_team: Team;
  away_team_picks?: UserId[];
  away_team_score?: number;
  cbs_event_id: number;
  cover_team?: Team;
  game_link?: string;
  game_period?: number;
  game_str: string;
  home_team: Team;
  home_team_cover?: boolean;
  home_team_picks?: UserId[];
  home_team_score?: number;
  home_team_spread?: number;
  id: string;
  is_locked: boolean;
  possession?: Possession;
  sort_str: string;
  starts_at: number;
  status: GameStatus;
  time_remaining?: string;
  tv_info?: string;
}

export interface Team {
  cbs_team_id: number;
  id: string;
  short_name: string;
}

export interface UserId {
  id: string;
  name: string;
}

export enum Possession {
  Away = "AWAY",
  Home = "HOME",
}
