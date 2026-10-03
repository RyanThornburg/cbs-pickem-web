import { RankedUser } from "../types";
import {
  readCachedLeaderboard,
  writeCachedLeaderboard,
} from "./leaderboardCache";

const users = [{ id: "35", name: "Scott Miller" }] as RankedUser[];

describe("leaderboardCache", () => {
  beforeEach(() => localStorage.clear());

  it("reads back the week it saved", () => {
    writeCachedLeaderboard({ season: 2026, week: 4, at: 1, users });
    expect(readCachedLeaderboard(2026, 4)?.users).toEqual(users);
    expect(readCachedLeaderboard(2026, 3)).toBeUndefined();
  });

  it("keeps only the three most recent weeks", () => {
    for (const week of [1, 2, 3, 4]) {
      writeCachedLeaderboard({ season: 2026, week, at: week, users });
    }
    expect(readCachedLeaderboard(2026, 1)).toBeUndefined();
    expect(readCachedLeaderboard(2026, 4)?.at).toBe(4);
  });

  it("replaces a week instead of duplicating it", () => {
    writeCachedLeaderboard({ season: 2026, week: 4, at: 1, users });
    writeCachedLeaderboard({ season: 2026, week: 4, at: 2, users });
    expect(readCachedLeaderboard(2026, 4)?.at).toBe(2);
    expect(JSON.parse(localStorage.getItem("leaderboardCache")!)).toHaveLength(
      1
    );
  });

  it("ignores an empty week and unreadable storage", () => {
    writeCachedLeaderboard({ season: 2026, week: 4, at: 1, users: [] });
    expect(readCachedLeaderboard(2026, 4)).toBeUndefined();
    localStorage.setItem("leaderboardCache", "{not json");
    expect(readCachedLeaderboard(2026, 4)).toBeUndefined();
  });
});
