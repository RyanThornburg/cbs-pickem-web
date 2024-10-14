export interface TeamPicked {
    count:   number;
    cover:   boolean;
    is_game: boolean;
    team:    string;
}

export interface User {
    id:             string;
    period_score:   number;
    picks:          Pick[];
    rank:           number;
    score:          number;
    trending_score: number;
    user:           string;
}

export interface Pick {
    game_id?:     number;
    game_status?: GameStatus;
    pick_status?: PickStatus;
    team?:        string;
    team_id?:     number;
    visible:      boolean;
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