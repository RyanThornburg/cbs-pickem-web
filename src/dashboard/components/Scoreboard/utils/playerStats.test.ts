import { PlayerLine } from "../../../types";
import { PLAYER_STAT_GROUPS, availableGroups, statCell } from "./playerStats";

const line = (name: string, stats: PlayerLine["stats"]): PlayerLine => ({
  name,
  stats,
});
const groupById = (id: string) => PLAYER_STAT_GROUPS.find((g) => g.id === id)!;

describe("player stat groups", () => {
  it("sorts defense by tackles and folds in interceptions by name", () => {
    const rows = groupById("defense").rows({
      defensive: [line("A", { tackles: 3 }), line("B", { tackles: 9 })],
      interceptions: [
        line("A", { total_interceptions: 1 }),
        line("C", { total_interceptions: 2 }),
      ],
    });
    expect(rows.map((r) => [r.name, r.stats.int])).toEqual([
      ["B", 0],
      ["A", 1],
      ["C", 2],
    ]);
  });

  it("puts kick returns before punt returns, labelled", () => {
    const rows = groupById("returns").rows({
      punt_returns: [line("P", { total: 2 })],
      kick_returns: [line("K", { total: 3 })],
    });
    expect(rows.map((r) => `${r.stats.kind} ${r.name}`)).toEqual([
      "Kick K",
      "Punt P",
    ]);
  });

  it("offers only the groups with players, in the fixed order", () => {
    const ids = availableGroups({
      away: { rushing: [line("R", {})], kicking: [] },
      home: { passing: [line("Q", {})] },
    }).map((g) => g.id);
    expect(ids).toEqual(["passing", "rushing"]);
    expect(availableGroups({ away: {}, home: {} })).toEqual([]);
  });

  it("shows missing values as a dash", () => {
    expect(statCell(null)).toBe("–");
    expect(statCell(undefined)).toBe("–");
    expect(statCell("24/33")).toBe("24/33");
    expect(statCell(0)).toBe("0");
  });
});
