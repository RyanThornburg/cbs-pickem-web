import { RecapItem, WeekRecap } from "../../types";
import {
  coverStreakLabel,
  coverStreaksByTeamId,
  gameTagsById,
  moversByUserId,
  perfectWeekUserIds,
} from "./recapBadges";

const item = (kind: string, data: Record<string, unknown>, headline = kind): RecapItem => ({
  id: kind,
  kind,
  category: "pool",
  scope: "week",
  score: 1,
  headline,
  short: headline,
  sample_size: null,
  data,
});

const week = (overrides: Partial<WeekRecap>): WeekRecap => ({
  version: 3,
  season: 2026,
  week: 3,
  updated_at: "",
  week_complete: true,
  games_final: 16,
  games_total: 16,
  items: [],
  series: { pool_accuracy: [], chaos: [] },
  movers: [],
  cover_streaks: [],
  ...overrides,
});

const team = (id: number, abbr: string) => ({ id, abbr, name: abbr });

describe("recap badge lookups", () => {
  it("handles no recap at all", () => {
    expect(moversByUserId(undefined).size).toBe(0);
    expect(perfectWeekUserIds(undefined).size).toBe(0);
    expect(coverStreaksByTeamId(undefined).size).toBe(0);
    expect(gameTagsById(undefined).size).toBe(0);
  });

  it("maps movers by string user id", () => {
    const t = week({
      movers: [
        { user_id: 26, name: "Nick Elliott", rank_before: 26, rank_after: 16, change: 10 },
        { user_id: 4, name: "Antonio Torres", rank_before: 11, rank_after: 23, change: -12 },
      ],
    });
    const movers = moversByUserId(t);
    expect(movers.get("26")?.change).toBe(10);
    expect(movers.get("4")?.change).toBe(-12);
    expect(movers.has("1")).toBe(false);
  });

  it("finds perfect weeks, including the empty 'nobody went 5-0' case", () => {
    expect(
      perfectWeekUserIds(week({ items: [item("perfect_week", { users: [{ user_id: 35, name: "Scott Miller" }] })] }))
    ).toEqual(new Set(["35"]));
    expect(perfectWeekUserIds(week({ items: [item("perfect_week", { users: [] })] })).size).toBe(0);
  });

  it("maps cover streaks by team id and labels them", () => {
    const streaks = coverStreaksByTeamId(
      week({
        cover_streaks: [
          { team: team(2, "BUF"), streak_type: "cover", length: 3 },
          { team: team(13, "HOU"), streak_type: "miss", length: 4 },
        ],
      })
    );
    expect(coverStreakLabel(streaks.get(2)!)).toBe("Covered 3 straight");
    expect(coverStreakLabel(streaks.get(13)!)).toBe("Missed 4 straight");
  });

  it("tags the upset and the games the winner didn't cover", () => {
    const tags = gameTagsById(
      week({
        items: [
          item("upset_of_week", { game_id: 41 }, "Upset of the week: WAS (+7.5) beat SEA outright."),
          item("spread_mattered", {
            flipped_games: [
              {
                game_id: 43,
                home_team: team(25, "SF"),
                away_team: team(22, "ARI"),
                home_score: 36,
                away_score: 30,
                cbs_spread: -8.5,
                winner: team(25, "SF"),
              },
            ],
          }),
        ],
      })
    );
    expect(tags.get(41)).toEqual([
      { kind: "upset", label: "Upset of the week", detail: "Upset of the week: WAS (+7.5) beat SEA outright." },
    ]);
    expect(tags.get(43)).toEqual([
      { kind: "flipped", label: "Won, didn't cover", detail: "SF won by 6 but was favored by 8.5" },
    ]);
  });
});
