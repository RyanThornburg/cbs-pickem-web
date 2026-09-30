import { GameStatus } from "../types";
import { GameWithOdds, GetGamesTabData } from "./GetGamesTabData";
import { ApiGame } from "./weekGames";

const game = (
  game_id: number,
  game_time: string,
  overrides: Partial<ApiGame> = {}
): ApiGame => ({
  game_id,
  status: "SCHEDULED",
  game_time,
  home_team: { id: 10 + game_id, abbr: `H${game_id}` },
  away_team: { id: 20 + game_id, abbr: `A${game_id}` },
  ...overrides,
});

const side = (home_point: number | null, away_point: number | null) => ({
  home_point,
  home_price: -110,
  away_point,
  away_price: -110,
  captured_at: "2026-09-27T12:00:00Z",
});

const load = (games: ApiGame[], odds: unknown[]): Promise<GameWithOdds[]> => {
  global.fetch = vi.fn((path: string) => {
    const body = path.endsWith("/odds")
      ? { week: 3, updated_at: "now", games: odds }
      : { week: 3, updated_at: "now", games };
    return Promise.resolve({
      ok: true,
      status: 200,
      json: () => Promise.resolve(body),
    });
  }) as unknown as typeof fetch;

  return new Promise((resolve) => {
    const stop = GetGamesTabData(2026, 3, (result) => {
      stop();
      resolve(result);
    });
  });
};

describe("GetGamesTabData", () => {
  const realFetch = global.fetch;
  afterEach(() => {
    global.fetch = realFetch;
  });

  it("joins odds onto games by id and sorts by kickoff", async () => {
    const games = await load(
      [game(1, "2026-09-27T20:25:00Z"), game(2, "2026-09-27T17:00:00Z")],
      [
        {
          game_id: 1,
          cbs_spread: -3,
          market_spread: {
            book_count: 5,
            open: -2.5,
            open_agreement: 0.8,
            close: -3.5,
            close_agreement: 1,
          },
          books: [
            {
              bookmaker: "draftkings",
              spread: side(-3.5, 3.5),
              total: side(44.5, 44.5),
            },
          ],
        },
      ]
    );
    expect(games.map((g) => g.game_id)).toEqual([2, 1]);

    const [noOdds, withOdds] = games;
    expect(noOdds).toMatchObject({
      market_spread: null,
      books: [],
      cbs_spread: undefined,
      status: GameStatus.Scheduled,
    });
    expect(withOdds.market_spread).toEqual({
      book_count: 5,
      open: -2.5,
      open_agreement: 0.8,
      close: -3.5,
      close_agreement: 1,
    });
    expect(withOdds.game_time).toBe(Date.parse("2026-09-27T20:25:00Z"));
  });

  it("keeps a book that's missing a whole market, leaving that market undefined", async () => {
    const [g] = await load(
      [game(1, "2026-09-27T17:00:00Z")],
      [
        {
          game_id: 1,
          market_spread: null,
          books: [
            {
              bookmaker: "betmgm",
              moneyline: side(null, null),
              total: side(47, 47),
            },
          ],
        },
      ]
    );
    expect(g.books).toHaveLength(1);
    expect(g.books[0].bookmaker).toBe("betmgm");
    expect(g.books[0].spread).toBeUndefined();
    expect(g.books[0].total).toMatchObject({ home_point: 47, away_point: 47 });
    expect(g.books[0].moneyline).toMatchObject({ home_point: null });
  });

  it("uses the odds key's cbs_spread over the game's, and grades the cover against it", async () => {
    // Home wins by 3. On the game's own -2.5 home covers; on the odds key's -3.5 away does.
    const final = {
      status: "FINAL",
      home_score: 24,
      away_score: 21,
      cbs_spread: -2.5,
    };
    const [g] = await load(
      [game(1, "2026-09-27T17:00:00Z", final)],
      [{ game_id: 1, cbs_spread: -3.5, market_spread: null }]
    );
    expect(g.cbs_spread).toBe(-3.5);
    expect(g.coveringTeamId).toBe(21);
  });

  it("falls back to the game's cbs_spread, and reads a push as no cover", async () => {
    const [covered, push] = await load(
      [
        game(1, "2026-09-27T17:00:00Z", {
          status: "FINAL",
          home_score: 24,
          away_score: 21,
          cbs_spread: -2.5,
        }),
        game(2, "2026-09-27T18:00:00Z", {
          status: "FINAL",
          home_score: 24,
          away_score: 21,
          cbs_spread: -3,
        }),
      ],
      []
    );
    expect(covered.cbs_spread).toBe(-2.5);
    expect(covered.coveringTeamId).toBe(11);
    expect(push.coveringTeamId).toBeNull();
  });

  it("has no cover before there's a score", async () => {
    const [g] = await load(
      [game(1, "2026-09-27T17:00:00Z", { cbs_spread: -3 })],
      []
    );
    expect(g.coveringTeamId).toBeNull();
  });
});

describe("GetGamesTabData without odds", () => {
  const realFetch = global.fetch;
  afterEach(() => {
    global.fetch = realFetch;
  });

  it("still returns the games when the odds key 404s", async () => {
    global.fetch = vi.fn((path: string) =>
      Promise.resolve(
        path.endsWith("/odds")
          ? { ok: false, status: 404, json: () => Promise.resolve({}) }
          : {
              ok: true,
              status: 200,
              json: () =>
                Promise.resolve({
                  week: 3,
                  updated_at: "now",
                  games: [game(1, "2026-09-27T17:00:00Z", { cbs_spread: -3 })],
                }),
            }
      )
    ) as unknown as typeof fetch;
    console.warn = vi.fn();

    const [games, oddsAvailable] = await new Promise<[GameWithOdds[], boolean]>(
      (resolve) => {
        const stop = GetGamesTabData(2026, 3, (result, hasOdds) => {
          stop();
          resolve([result, hasOdds]);
        });
      }
    );
    expect(oddsAvailable).toBe(false);
    expect(games).toHaveLength(1);
    expect(games[0].cbs_spread).toBe(-3);
    expect(games[0].market_spread).toBeNull();
    expect(games[0].books).toEqual([]);
  });
});
