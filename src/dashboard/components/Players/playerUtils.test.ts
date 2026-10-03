import { GameStatus, RankedUser, UserPickRecords } from "../../types";
import {
  finishPoints,
  playerWeeks,
  seasonRecord,
  teamGamesRecord,
  toneOf,
} from "./playerUtils";

const rec = (wins: number, losses: number) => ({
  picks: wins + losses,
  wins,
  losses,
  win_pct: wins + losses ? wins / (wins + losses) : null,
});

const user = (id: string, place: number): RankedUser => ({
  id,
  name: id,
  weekly_score: 0,
  trending_score: 0,
  cumulative_score: 0,
  place,
  periods: {},
  picks: [
    {
      game_id: 1,
      team: "BUF",
      is_correct: true,
      game_status: GameStatus.Final,
      visible: true,
    },
  ],
});

describe("player page helpers", () => {
  it("totals the season from home and away", () => {
    const records: UserPickRecords = {
      home: rec(4, 2),
      away: rec(5, 4),
      favorite: rec(5, 4),
      underdog: rec(4, 2),
      teams: [],
    };
    expect(seasonRecord(records)).toEqual({ wins: 9, losses: 6 });
    expect(seasonRecord(null)).toBeNull();
    expect(
      seasonRecord({ ...records, home: rec(0, 0), away: rec(0, 0) })
    ).toBeNull();
  });

  it("only tones a record with enough graded picks", () => {
    expect(toneOf(1, 0)).toBe("neutral");
    expect(toneOf(3, 0)).toBe("good");
    expect(toneOf(3, 2)).toBe("good");
    expect(toneOf(2, 3)).toBe("bad");
    expect(toneOf(2, 2)).toBe("neutral");
  });

  it("adds a team's picked and against records", () => {
    expect(
      teamGamesRecord({
        team: { id: 1, abbr: "BUF", name: "Bills" },
        picked: rec(2, 0),
        against: rec(0, 1),
      })
    ).toEqual({ wins: 2, losses: 1 });
    expect(teamGamesRecord(undefined)).toEqual({ wins: 0, losses: 0 });
  });

  it("lists the player's weeks newest first, skipping weeks they missed", () => {
    const weeks = new Map([
      [1, [user("7", 3)]],
      [3, [user("7", 1), user("8", 2)]],
      [2, [user("8", 4)]],
    ]);
    expect(playerWeeks(weeks, "7").map((w) => [w.week, w.user.place])).toEqual([
      [3, 1],
      [1, 3],
    ]);
  });

  it("puts this season's place after the closed seasons", () => {
    const history = [2025, 2024, 2026].map((season) => ({
      season,
      incomplete: false,
      rank: season - 2020,
      score: 50,
    }));
    expect(finishPoints(history, 2026, 9)).toEqual([
      { season: 2024, rank: 4, current: false },
      { season: 2025, rank: 5, current: false },
      { season: 2026, rank: 9, current: true },
    ]);
    expect(finishPoints([], 2026, undefined)).toEqual([]);
  });
});
