import { GameStatus, RankedUser } from "../types";
import { HALVES } from "../utils/testPeriods";
import { GetUserByWeek } from "./GetUserByWeek";
import { ApiGame } from "./weekGames";

type ApiUser = {
  user_id: number;
  name: string;
  weekly_score?: number;
  trending_score?: number;
  cumulative_score?: number;
  place?: number;
  // Shorthand for periods.second_half.score.
  second_half_score?: number | null;
  first_half_score?: number | null;
  has_submitted_picks?: boolean;
  picks?: {
    game_id: number;
    team_id: number;
    is_correct: boolean | null;
    trending_status?: string;
  }[];
};

const apiStanding = (score: number | null) => ({
  score,
  place: 99, // the API's own rank, which GetUserByWeek replaces
  in_money: false,
  last_place_eligible: score == null ? null : true,
  in_money_last_place: false,
});

const user = ({ second_half_score, first_half_score, ...u }: ApiUser) => ({
  weekly_score: 0,
  trending_score: 0,
  cumulative_score: 0,
  place: 99,
  picks: [],
  ...u,
  periods: {
    overall: apiStanding(u.cumulative_score ?? 0),
    first_half: apiStanding(first_half_score ?? u.cumulative_score ?? 0),
    second_half: apiStanding(second_half_score ?? null),
  },
});

const game = (
  game_id: number,
  status: string,
  game_time: string,
  homeId: number,
  awayId: number
): ApiGame => ({
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
const load = (
  users: ReturnType<typeof user>[],
  games: ApiGame[] = STARTED,
  // The leaderboard's own week, which decides the periods being played.
  week = 3
): Promise<RankedUser[]> => {
  global.fetch = vi.fn((path: string) => {
    const body = path.endsWith("/leaderboard")
      ? { week, periods: HALVES, users }
      : { week: 3, updated_at: "2026-09-27T21:00:00Z", games };
    return Promise.resolve({
      ok: true,
      status: 200,
      json: () => Promise.resolve(body),
    });
  }) as unknown as typeof fetch;

  return new Promise((resolve) => {
    const stop = GetUserByWeek(2026, 3, (result) => {
      stop?.();
      resolve(result);
    });
  });
};

const places = (users: RankedUser[]) =>
  Object.fromEntries(users.map((u) => [u.name, u.place]));

describe("GetUserByWeek", () => {
  afterEach(() => vi.useRealTimers());
  const realFetch = global.fetch;
  afterEach(() => {
    global.fetch = realFetch;
  });

  describe("ranking", () => {
    it("ranks on cumulative + trending, not the API's cumulative-only place", async () => {
      const users = await load([
        user({
          user_id: 1,
          name: "Ann",
          cumulative_score: 10,
          trending_score: 0,
          place: 1,
        }),
        user({
          user_id: 2,
          name: "Bob",
          cumulative_score: 9,
          trending_score: 2,
          place: 2,
        }),
      ]);
      expect(places(users)).toEqual({ Bob: 1, Ann: 2 });
      expect(users.map((u) => u.name)).toEqual(["Bob", "Ann"]);
    });

    it("gives ties the same rank and skips the next rank", async () => {
      const users = await load([
        user({ user_id: 1, name: "Ann", cumulative_score: 10 }),
        user({
          user_id: 2,
          name: "Bob",
          cumulative_score: 9,
          trending_score: 1,
        }),
        user({ user_id: 3, name: "Cal", cumulative_score: 8 }),
        user({ user_id: 4, name: "Dee", cumulative_score: 7 }),
      ]);
      expect(places(users)).toEqual({ Ann: 1, Bob: 1, Cal: 3, Dee: 4 });
    });

    it("breaks ties in display order by second-half place, then name", async () => {
      const users = await load(
        [
          user({ user_id: 1, name: "zed", cumulative_score: 5 }),
          user({ user_id: 2, name: "Amy", cumulative_score: 5 }),
          user({
            user_id: 3,
            name: "Bea",
            cumulative_score: 5,
            second_half_score: 3,
          }),
          user({
            user_id: 4,
            name: "Cy",
            cumulative_score: 5,
            second_half_score: 4,
          }),
        ],
        STARTED,
        12
      );
      // Users without a second-half score sort first (null counts as 0),
      // then by name, ignoring case.
      expect(users.map((u) => u.name)).toEqual(["Amy", "zed", "Cy", "Bea"]);
    });

    it("re-ranks the second half the same way, leaving it null without a second-half score", async () => {
      const users = await load(
        [
          user({
            user_id: 1,
            name: "Ann",
            second_half_score: 4,
            trending_score: 0,
          }),
          user({
            user_id: 2,
            name: "Bob",
            second_half_score: 3,
            trending_score: 1,
          }),
          user({ user_id: 3, name: "Cal", second_half_score: 2 }),
          user({ user_id: 4, name: "Dee", second_half_score: null }),
        ],
        STARTED,
        12
      );
      const secondHalf = Object.fromEntries(
        users.map((u) => [u.name, u.periods.second_half.place])
      );
      expect(secondHalf).toEqual({ Ann: 1, Bob: 1, Cal: 3, Dee: null });
      expect(users.find((u) => u.name === "Ann")?.periods.second_half).toEqual({
        score: 4,
        place: 1,
        in_money: true,
        last_place_eligible: true,
        in_money_last_place: false,
      });
    });

    it("leaves the live bonus out of a period that's already over", async () => {
      // Week 12: Bob's covering pick counts toward overall and the 2nd half,
      // not the finished 1st half.
      const users = await load(
        [
          user({
            user_id: 1,
            name: "Ann",
            cumulative_score: 20,
            first_half_score: 12,
            second_half_score: 8,
          }),
          user({
            user_id: 2,
            name: "Bob",
            cumulative_score: 19,
            first_half_score: 11,
            second_half_score: 8,
            trending_score: 1,
          }),
        ],
        STARTED,
        12
      );
      const bob = users.find((u) => u.name === "Bob")!;
      expect(bob.place).toBe(1);
      expect(bob.periods.second_half.place).toBe(1);
      expect(bob.periods.first_half.place).toBe(2);
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
            {
              game_id: 2,
              team_id: 12,
              is_correct: null,
              trending_status: "covering",
            },
          ],
        }),
      ]);
      expect(ann.picks).toEqual([
        {
          game_id: 1,
          team: "A11",
          is_correct: true,
          trending_status: undefined,
          game_status: GameStatus.Final,
          visible: true,
        },
        {
          game_id: 2,
          team: "H12",
          is_correct: null,
          trending_status: "covering",
          game_status: GameStatus.Scheduled,
          visible: true,
        },
      ]);
    });

    it("hides every pick until the first kickoff, padding to 5 TBDs for a submitted sheet", async () => {
      // Before game 1's kickoff time, not just before its status changes.
      vi.useFakeTimers({ toFake: ["Date"] });
      vi.setSystemTime(new Date("2026-09-27T16:00:00Z"));
      const [ann] = await load(
        [
          user({
            user_id: 1,
            name: "Ann",
            has_submitted_picks: true,
            picks: [{ game_id: 1, team_id: 11, is_correct: null }],
          }),
        ],
        NOT_STARTED
      );
      expect(ann.picks).toHaveLength(5);
      expect(ann.picks.every((p) => !p.visible && p.team === "")).toBe(true);
      // Placeholder ids are negative so they can't collide with real games.
      expect(new Set(ann.picks.map((p) => p.game_id)).size).toBe(5);
      expect(ann.picks.every((p) => p.game_id < 0)).toBe(true);
    });

    it("reveals picks at kickoff time even while the feed still says SCHEDULED", async () => {
      vi.useFakeTimers({ toFake: ["Date"] });
      vi.setSystemTime(new Date("2026-09-27T17:06:00Z"));
      const [ann] = await load(
        [
          user({
            user_id: 1,
            name: "Ann",
            has_submitted_picks: true,
            picks: [{ game_id: 1, team_id: 11, is_correct: null }],
          }),
        ],
        NOT_STARTED
      );
      expect(ann.picks[0]).toMatchObject({ team: "A11", visible: true });
    });

    it("tops up a submitted sheet whose picks haven't all joined yet", async () => {
      const [ann] = await load([
        user({
          user_id: 1,
          name: "Ann",
          has_submitted_picks: true,
          picks: [{ game_id: 1, team_id: 10, is_correct: false }],
        }),
      ]);
      expect(ann.picks).toHaveLength(5);
      expect(ann.picks[0]).toMatchObject({ team: "H10", visible: true });
      expect(ann.picks.slice(1).every((p) => !p.visible)).toBe(true);
    });

    it("shows nothing for someone who hasn't submitted", async () => {
      const [ann] = await load([
        user({ user_id: 1, name: "Ann", has_submitted_picks: false }),
      ]);
      expect(ann.picks).toEqual([]);
    });

    it("keeps real picks without padding when has_submitted_picks is missing", async () => {
      const [ann] = await load([
        user({
          user_id: 1,
          name: "Ann",
          picks: [{ game_id: 1, team_id: 11, is_correct: true }],
        }),
      ]);
      expect(ann.picks).toHaveLength(1);
      expect(ann.picks[0]).toMatchObject({ team: "A11", visible: true });
    });
  });

  it("returns an empty list without fetching before season and week are known", () => {
    global.fetch = vi.fn() as unknown as typeof fetch;
    const callback = vi.fn();
    GetUserByWeek(0, 3, callback);
    expect(callback).toHaveBeenCalledWith([]);
    expect(global.fetch).not.toHaveBeenCalled();
  });
});
