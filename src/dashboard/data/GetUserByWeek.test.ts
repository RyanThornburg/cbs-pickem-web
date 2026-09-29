import { GameStatus, RankedUser } from "../types";
import { GetUserByWeek } from "./GetUserByWeek";
import { ApiGame } from "./weekGames";

type ApiUser = {
  user_id: number;
  name: string;
  weekly_score?: number;
  trending_score?: number;
  cumulative_score?: number;
  place?: number;
  second_half_score?: number | null;
  second_half_place?: number | null;
  has_submitted_picks?: boolean;
  picks?: { game_id: number; team_id: number; is_correct: boolean | null; trending_status?: string }[];
};

const user = (u: ApiUser) => ({
  weekly_score: 0,
  trending_score: 0,
  cumulative_score: 0,
  place: 99,
  second_half_score: null,
  second_half_place: null,
  picks: [],
  ...u,
});

const game = (game_id: number, status: string, game_time: string, homeId: number, awayId: number): ApiGame => ({
  game_id,
  status,
  game_time,
  home_team: { id: homeId, abbr: `H${homeId}` },
  away_team: { id: awayId, abbr: `A${awayId}` },
});

// Week 3 of 2026: game 1 kicks off first, game 2 later that day.
const STARTED = [
  game(1, "FINAL", "2026-09-27T17:00:00Z", 10, 11),
  game(2, "SCHEDULED", "2026-09-27T20:25:00Z", 12, 13),
];
const NOT_STARTED = STARTED.map((g) => ({ ...g, status: "SCHEDULED" }));

// Serves the leaderboard and games endpoints, runs one poll tick, and
// resolves with what the callback received.
const load = (users: ReturnType<typeof user>[], games: ApiGame[] = STARTED): Promise<RankedUser[]> => {
  global.fetch = jest.fn((path: string) => {
    const body = path.endsWith("/leaderboard")
      ? { week: 3, second_half_start_week: 10, users }
      : { week: 3, updated_at: "2026-09-27T21:00:00Z", games };
    return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(body) });
  }) as unknown as typeof fetch;

  return new Promise((resolve) => {
    const stop = GetUserByWeek(2026, 3, (result) => {
      stop?.();
      resolve(result);
    });
  });
};

const places = (users: RankedUser[]) => Object.fromEntries(users.map((u) => [u.name, u.place]));

describe("GetUserByWeek", () => {
  const realFetch = global.fetch;
  afterEach(() => {
    global.fetch = realFetch;
  });

  describe("ranking", () => {
    it("ranks on cumulative + trending, not the API's cumulative-only place", async () => {
      const users = await load([
        user({ user_id: 1, name: "Ann", cumulative_score: 10, trending_score: 0, place: 1 }),
        user({ user_id: 2, name: "Bob", cumulative_score: 9, trending_score: 2, place: 2 }),
      ]);
      expect(places(users)).toEqual({ Bob: 1, Ann: 2 });
      expect(users.map((u) => u.name)).toEqual(["Bob", "Ann"]);
    });

    it("gives ties the same rank and skips the next rank", async () => {
      const users = await load([
        user({ user_id: 1, name: "Ann", cumulative_score: 10 }),
        user({ user_id: 2, name: "Bob", cumulative_score: 9, trending_score: 1 }),
        user({ user_id: 3, name: "Cal", cumulative_score: 8 }),
        user({ user_id: 4, name: "Dee", cumulative_score: 7 }),
      ]);
      expect(places(users)).toEqual({ Ann: 1, Bob: 1, Cal: 3, Dee: 4 });
    });

    it("breaks ties in display order by second-half place, then name", async () => {
      const users = await load([
        user({ user_id: 1, name: "zed", cumulative_score: 5 }),
        user({ user_id: 2, name: "Amy", cumulative_score: 5 }),
        user({ user_id: 3, name: "Bea", cumulative_score: 5, second_half_score: 3 }),
        user({ user_id: 4, name: "Cy", cumulative_score: 5, second_half_score: 4 }),
      ]);
      // Users without a second-half score sort first (null counts as 0),
      // then by name, ignoring case.
      expect(users.map((u) => u.name)).toEqual(["Amy", "zed", "Cy", "Bea"]);
    });

    it("re-ranks the second half the same way, leaving it null without a second-half score", async () => {
      const users = await load([
        user({ user_id: 1, name: "Ann", second_half_score: 4, trending_score: 0 }),
        user({ user_id: 2, name: "Bob", second_half_score: 3, trending_score: 1 }),
        user({ user_id: 3, name: "Cal", second_half_score: 2 }),
        user({ user_id: 4, name: "Dee", second_half_score: null }),
      ]);
      const secondHalf = Object.fromEntries(users.map((u) => [u.name, u.second_half_place]));
      expect(secondHalf).toEqual({ Ann: 1, Bob: 1, Cal: 3, Dee: null });
    });
  });

  describe("picks", () => {
    it("joins each pick to its team once the week's first game has kicked off", async () => {
      const [ann] = await load([
        user({
          user_id: 1,
          name: "Ann",
          picks: [
            { game_id: 1, team_id: 11, is_correct: true },
            { game_id: 2, team_id: 12, is_correct: null, trending_status: "covering" },
          ],
        }),
      ]);
      expect(ann.picks).toEqual([
        { game_id: 1, team: "A11", is_correct: true, trending_status: undefined, game_status: GameStatus.Final, visible: true },
        { game_id: 2, team: "H12", is_correct: null, trending_status: "covering", game_status: GameStatus.Scheduled, visible: true },
      ]);
    });

    it("hides every pick until the first kickoff, padding to 5 TBDs for a submitted sheet", async () => {
      const [ann] = await load(
        [user({ user_id: 1, name: "Ann", has_submitted_picks: true, picks: [{ game_id: 1, team_id: 11, is_correct: null }] })],
        NOT_STARTED
      );
      expect(ann.picks).toHaveLength(5);
      expect(ann.picks.every((p) => !p.visible && p.team === "")).toBe(true);
      // Placeholder ids are negative so they can't collide with real games.
      expect(new Set(ann.picks.map((p) => p.game_id)).size).toBe(5);
      expect(ann.picks.every((p) => p.game_id < 0)).toBe(true);
    });

    it("tops up a submitted sheet whose picks haven't all joined yet", async () => {
      const [ann] = await load([
        user({ user_id: 1, name: "Ann", has_submitted_picks: true, picks: [{ game_id: 1, team_id: 10, is_correct: false }] }),
      ]);
      expect(ann.picks).toHaveLength(5);
      expect(ann.picks[0]).toMatchObject({ team: "H10", visible: true });
      expect(ann.picks.slice(1).every((p) => !p.visible)).toBe(true);
    });

    it("shows nothing for someone who hasn't submitted", async () => {
      const [ann] = await load([user({ user_id: 1, name: "Ann", has_submitted_picks: false })]);
      expect(ann.picks).toEqual([]);
    });

    it("keeps real picks without padding when has_submitted_picks is missing", async () => {
      const [ann] = await load([
        user({ user_id: 1, name: "Ann", picks: [{ game_id: 1, team_id: 11, is_correct: true }] }),
      ]);
      expect(ann.picks).toHaveLength(1);
      expect(ann.picks[0]).toMatchObject({ team: "A11", visible: true });
    });
  });

  it("returns an empty list without fetching before season and week are known", () => {
    global.fetch = jest.fn() as unknown as typeof fetch;
    const callback = jest.fn();
    GetUserByWeek(0, 3, callback);
    expect(callback).toHaveBeenCalledWith([]);
    expect(global.fetch).not.toHaveBeenCalled();
  });
});
