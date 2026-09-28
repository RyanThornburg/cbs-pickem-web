import { Game, GameStatus, Possession } from "../../../types";
import {
  getBallSpot,
  getCover,
  getGameHighlight,
  getPickState,
  groupGames,
  highlightBorder,
  sideLine,
  swingToFlip,
  userPickSide,
} from "./scoreboardUtils";

const game = (overrides: Partial<Game> = {}): Game => ({
  game_id: 1,
  home_team: { id: 10, abbr: "TB" },
  away_team: { id: 20, abbr: "MIN" },
  status: GameStatus.Inprogress,
  home_score: 0,
  away_score: 0,
  game_time: 0,
  cbs_spread: -3.5, // TB favored by 3.5
  picks: { home: [{ id: "1", name: "Home Picker" }], away: [] },
  ...overrides,
});

describe("getCover / swingToFlip", () => {
  it("has no cover before kickoff", () => {
    expect(getCover(game({ status: GameStatus.Scheduled }))).toBeNull();
  });

  it("uses the home line: home + spread - away", () => {
    expect(getCover(game({ home_score: 7, away_score: 0 }))).toMatchObject({
      side: "home",
      by: 3.5,
    });
    expect(getCover(game({ home_score: 3, away_score: 0 }))).toMatchObject({
      side: "away",
      by: 0.5,
    });
    expect(
      getCover(game({ cbs_spread: -3, home_score: 3, away_score: 0 }))
    ).toMatchObject({ side: null });
  });

  it("needs one extra point to flip a whole-number margin (push first)", () => {
    expect(swingToFlip(2.5)).toBe(3);
    expect(swingToFlip(3)).toBe(4);
  });
});

describe("getGameHighlight / highlightBorder", () => {
  const live = (quarter: number, time_remaining: string, is_red_zone = false) => ({
    quarter,
    time_remaining,
    is_red_zone,
  });

  it("is not close before the 3rd quarter", () => {
    const h = getGameHighlight(
      game({ home_score: 7, away_score: 7, live: live(2, "5:00") })
    );
    expect(h.close).toBe(false);
  });

  it("is close in the 2nd half within one score, ending late in the 4th", () => {
    const close = getGameHighlight(
      game({ home_score: 10, away_score: 7, live: live(3, "8:00") })
    );
    expect(close).toMatchObject({ close: true, ending: false });

    const ending = getGameHighlight(
      game({ home_score: 10, away_score: 7, live: live(4, "4:59") })
    );
    expect(ending).toMatchObject({ close: true, ending: true });
  });

  it("is not close when the cover is more than one score away", () => {
    const h = getGameHighlight(
      game({ home_score: 28, away_score: 7, live: live(4, "2:00") })
    );
    expect(h.close).toBe(false);
  });

  it("lets close win the border over red zone", () => {
    const h = getGameHighlight(
      game({ home_score: 10, away_score: 7, live: live(4, "8:00", true) })
    );
    expect(h).toMatchObject({ close: true, redZone: true });
    expect(highlightBorder(h)).toBe("close");
    expect(
      highlightBorder({ close: false, ending: false, redZone: true })
    ).toBe("redZone");
  });

  it("never highlights halftime", () => {
    const h = getGameHighlight(
      game({ status: GameStatus.Halftime, live: live(2, "0:00", true) })
    );
    expect(highlightBorder(h)).toBeNull();
  });
});

describe("pick state", () => {
  it("finds the user's side", () => {
    expect(userPickSide(game(), "1")).toBe("home");
    expect(userPickSide(game(), "2")).toBeNull();
    expect(userPickSide(game(), undefined)).toBeNull();
  });

  it("is covering/not covering live, won/lost once final", () => {
    const g = { home_score: 7, away_score: 0 };
    expect(getPickState(game(g), "home")).toBe("covering");
    expect(getPickState(game(g), "away")).toBe("notCovering");
    expect(getPickState(game({ ...g, status: GameStatus.Final }), "away")).toBe("lost");
    expect(getPickState(game({ status: GameStatus.Scheduled }), "home")).toBe("notStarted");
  });

  it("formats each side's line", () => {
    expect(sideLine(game(), "home")).toBe("−3.5");
    expect(sideLine(game(), "away")).toBe("+3.5");
    expect(sideLine(game({ cbs_spread: 0 }), "home")).toBe("PK");
  });
});

describe("getBallSpot", () => {
  it("places yard_line (from the home goal) on an away-left field", () => {
    const spot = getBallSpot(
      game({
        live: {
          possession: Possession.Away,
          yard_line: 38,
          possession_text: "TB 38",
          down: 4,
          distance: 16,
        },
      })
    );
    // TB 38 is 38 yds from TB's (home) goal = 62% from the away end zone
    expect(spot).toEqual({
      ballPct: 62,
      firstDownPct: 78,
      label: "TB 38",
      driveStartPct: null,
      driveStartLabel: null,
    });
  });

  it("places drive_start on the same scale as the ball", () => {
    const spot = getBallSpot(
      game({
        home_team: { id: 10, abbr: "DEN" },
        away_team: { id: 20, abbr: "LAR" },
        live: {
          possession: Possession.Away,
          yard_line: 5,
          possession_text: "DEN 5",
          drive_start: { yard_line: 63, text: "LAR 37" },
        },
      })
    );
    // LAR (away, left) drove from its own 37 (37%) to the DEN 5 (95%)
    expect(spot).toMatchObject({ ballPct: 95, driveStartPct: 37, driveStartLabel: "LAR 37" });
  });

  it("hides the ball when there's no current spot", () => {
    expect(
      getBallSpot(game({ live: { yard_line: 38, possession_text: undefined } }))
    ).toBeNull();
  });

  it("falls back to down_distance_text before the feed has yard_line", () => {
    const spot = getBallSpot(
      game({
        live: {
          possession: Possession.Away,
          down: 4,
          distance: 7,
          down_distance_text: "4th & 7 at MIN 37",
        },
      })
    );
    expect(spot).toMatchObject({ ballPct: 37, firstDownPct: 44, label: "MIN 37", driveStartPct: null });
  });
});

describe("groupGames", () => {
  it("orders live, upcoming, final -- each by kickoff", () => {
    const games = [
      game({ game_id: 1, status: GameStatus.Final, game_time: 1 }),
      game({ game_id: 2, status: GameStatus.Scheduled, game_time: 5 }),
      game({ game_id: 3, status: GameStatus.Halftime, game_time: 3 }),
      game({ game_id: 4, status: GameStatus.Inprogress, game_time: 2 }),
      game({ game_id: 5, status: GameStatus.Scheduled, game_time: 4 }),
    ];
    expect(
      groupGames(games).map(({ group, games }) => [group, games.map((g) => g.game_id)])
    ).toEqual([
      ["Live", [4, 3]],
      ["Upcoming", [5, 2]],
      ["Final", [1]],
    ]);
  });

  it("pins the user's games on top in the same order, without repeating them", () => {
    const mine = () => ({ home: [{ id: "7", name: "Me" }], away: [] });
    const games = [
      game({ game_id: 1, status: GameStatus.Final, game_time: 1, picks: mine() }),
      game({ game_id: 2, status: GameStatus.Scheduled, game_time: 5 }),
      game({ game_id: 3, status: GameStatus.Halftime, game_time: 3 }),
      game({ game_id: 4, status: GameStatus.Inprogress, game_time: 2, picks: mine() }),
      game({ game_id: 5, status: GameStatus.Scheduled, game_time: 4, picks: mine() }),
    ];
    expect(
      groupGames(games, "7").map(({ group, games }) => [group, games.map((g) => g.game_id)])
    ).toEqual([
      ["Your picks", [4, 5, 1]],
      ["Live", [3]],
      ["Upcoming", [2]],
    ]);
  });

  it("leaves the standard order alone when the user has no picks", () => {
    const games = [game({ game_id: 1, status: GameStatus.Final, picks: { home: [], away: [] } })];
    expect(groupGames(games, "7").map(({ group }) => group)).toEqual(["Final"]);
  });
});
