import { byeTeams } from "./weekGames";

const matchup = (away: string, home: string) => ({
  away_team: { abbr: away },
  home_team: { abbr: home },
});

describe("byeTeams", () => {
  it("lists the teams without a game, alphabetically", () => {
    const games = [
      matchup("PIT", "CLE"),
      matchup("IND", "WAS"),
      matchup("NE", "BUF"),
      matchup("NYJ", "CHI"),
      matchup("JAC", "CIN"),
      matchup("ARI", "NYG"),
      matchup("LAR", "PHI"),
      matchup("DAL", "BAL"),
      matchup("TB", "NO"),
      matchup("SEA", "SF"),
      matchup("KC", "LAC"),
      matchup("DEN", "LV"),
      matchup("MIN", "GB"),
      matchup("HOU", "TEN"),
    ];
    expect(byeTeams(games)).toEqual(["ATL", "CAR", "DET", "MIA"]);
  });

  it("matches the feed's aliases (JAX, WSH, LA)", () => {
    const games = [matchup("JAX", "WSH"), matchup("LA", "SF")];
    const byes = byeTeams(games);
    expect(byes).not.toContain("JAC");
    expect(byes).not.toContain("WAS");
    expect(byes).not.toContain("LAR");
    expect(byes).toHaveLength(28);
  });

  it("is empty when no games are loaded", () => {
    expect(byeTeams([])).toEqual([]);
  });
});
