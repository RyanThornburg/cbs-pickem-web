import { RankedUser, UserSeasonTrends } from "../../types";
import { toUsersTableRow } from "./usersTableColumns";

const user = (overrides: Partial<RankedUser> = {}): RankedUser =>
  ({
    id: "29",
    name: "Patrick Madden",
    place: 1,
    second_half_place: null,
    cumulative_score: 9,
    trending_score: 2,
    weekly_score: 3,
    second_half_score: null,
    picks: [],
    ...overrides,
  }) as RankedUser;

const trends = (
  lastSeason: { season: number; rank: number } | null,
  streak = 2
): Record<string, UserSeasonTrends> => ({
  "29": {
    career: {
      trend: lastSeason && { last_season: { ...lastSeason, score: 60 } },
    },
    current_season: {
      hot_streak: {
        current_streak: streak,
        threshold_pct: 0.8,
        longest_streak: streak,
      },
    },
  } as unknown as UserSeasonTrends,
});

describe("toUsersTableRow", () => {
  it("adds trending points to every displayed score", () => {
    const row = toUsersTableRow(user({ second_half_score: 4 }), {});
    expect(row).toMatchObject({
      score: 11,
      weekly_score: 5,
      second_half_score: 6,
    });
    expect(toUsersTableRow(user(), {}).second_half_score).toBe(2);
  });

  it("shows the season hot streak unless the browsed week isn't the current one", () => {
    expect(toUsersTableRow(user(), trends(null, 3)).streakWeeks).toBe(3);
    expect(
      toUsersTableRow(user(), trends(null, 3), { showStreak: true }).streakWeeks
    ).toBe(3);
    expect(
      toUsersTableRow(user(), trends(null, 3), { showStreak: false })
        .streakWeeks
    ).toBe(0);
    expect(toUsersTableRow(user(), {}).streakWeeks).toBe(0);
  });

  it("marks the defending champion only for a 1st place last season", () => {
    expect(
      toUsersTableRow(user(), trends({ season: 2025, rank: 1 }))
        .defendingChampionSeason
    ).toBe(2025);
    expect(
      toUsersTableRow(user(), trends({ season: 2025, rank: 2 }))
        .defendingChampionSeason
    ).toBeNull();
    expect(
      toUsersTableRow(user(), trends(null)).defendingChampionSeason
    ).toBeNull();
    expect(toUsersTableRow(user(), {}).defendingChampionSeason).toBeNull();
  });

  it("carries this week's mover and 5-0 badges", () => {
    const move = {
      user_id: 29,
      name: "Patrick Madden",
      rank_before: 14,
      rank_after: 1,
      change: 13,
    };
    expect(
      toUsersTableRow(user(), {}, { move, perfectWeek: true })
    ).toMatchObject({ move, perfectWeek: true });
    expect(toUsersTableRow(user(), {})).toMatchObject({
      move: undefined,
      perfectWeek: false,
    });
  });
});
