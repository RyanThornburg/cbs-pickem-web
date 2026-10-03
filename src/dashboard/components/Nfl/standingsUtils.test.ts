import { NflStandings, StandingsTeam } from "../../types";
import {
  findTeamBySlug,
  firstName,
  flattenStandings,
  formatDiff,
  formatPickRecord,
  formatWinLoss,
  poolRecordsById,
  sortValue,
} from "./standingsUtils";
import { TeamProfile } from "../../types";

const row = (
  abbr: string,
  overrides: Partial<StandingsTeam> = {}
): StandingsTeam => ({
  rank: 1,
  team: { id: abbr.length, abbr, name: abbr },
  wins: 2,
  losses: 1,
  ties: 0,
  win_pct: 0.667,
  points_for: 60,
  points_against: 50,
  point_diff: 10,
  home: { wins: 1, losses: 0, ties: 0 },
  road: { wins: 1, losses: 1, ties: 0 },
  division_record: { wins: 0, losses: 0, ties: 0 },
  conference_record: { wins: 1, losses: 1, ties: 0 },
  streak: "W1",
  ats: { covers: 2, losses: 1, cover_pct: 0.667 },
  ...overrides,
});

const standings: NflStandings = {
  season: 2026,
  updated_at: "2026-10-02T04:49:06Z",
  conferences: [
    {
      name: "American Football Conference",
      abbr: "AFC",
      divisions: [
        {
          name: "AFC South",
          teams: [
            row("JAX"),
            row("IND", { team: { id: 30, abbr: "IND", name: "IND" } }),
          ],
        },
      ],
    },
    {
      name: "National Football Conference",
      abbr: "NFC",
      divisions: [{ name: "NFC West", teams: [row("LA")] }],
    },
  ],
};

describe("standings helpers", () => {
  it("flattens in conference and division order", () => {
    expect(
      flattenStandings(standings).map(
        (t) => `${t.conference} ${t.division} ${t.row.team.abbr}`
      )
    ).toEqual(["AFC AFC South JAX", "AFC AFC South IND", "NFC NFC West LA"]);
  });

  it("finds a team by its URL slug, aliases included", () => {
    expect(findTeamBySlug(standings, "jac")?.row.team.abbr).toBe("JAX");
    expect(findTeamBySlug(standings, "LAR")?.row.team.abbr).toBe("LA");
    expect(findTeamBySlug(standings, "nope")).toBeUndefined();
  });

  it("formats records", () => {
    expect(formatWinLoss({ wins: 3, losses: 1, ties: 0 })).toBe("3-1");
    expect(formatWinLoss({ wins: 3, losses: 1, ties: 1 })).toBe("3-1-1");
    expect(formatDiff(23)).toBe("+23");
    expect(formatDiff(-9)).toBe("−9");
    expect(formatDiff(0)).toBe("0");
    expect(
      formatPickRecord({ picks: 2, wins: 0, losses: 0, win_pct: null })
    ).toBeNull();
    expect(
      formatPickRecord({ picks: 3, wins: 2, losses: 1, win_pct: 0.667 })
    ).toBe("2-1");
    expect(firstName("bill morlok")).toBe("bill");
    expect(firstName("Ryan Thornburg")).toBe("Ryan");
  });

  it("takes the pool record from standings, else the team's key", () => {
    const rec = (wins: number) => ({
      picks: wins,
      wins,
      losses: 0,
      win_pct: 1,
    });
    const withPool: NflStandings = {
      ...standings,
      conferences: standings.conferences.map((c) => ({
        ...c,
        divisions: c.divisions.map((d) => ({
          ...d,
          teams: d.teams.map((t) =>
            t.team.abbr === "JAX"
              ? { ...t, pool: { picked: rec(5), against: rec(0) } }
              : t
          ),
        })),
      })),
    };
    const ind = withPool.conferences[0].divisions[0].teams[1].team.id;
    const profiles = {
      [ind]: { pool: { picked: rec(2) } } as unknown as TeamProfile,
    };
    const byId = poolRecordsById(withPool, profiles);
    expect(byId.get(3)?.wins).toBe(5); // JAX, from standings
    expect(byId.get(ind)?.wins).toBe(2); // IND, from its team key
    expect(byId.has(2)).toBe(false); // LA, neither
    expect(poolRecordsById(undefined, profiles).size).toBe(0);
  });

  it("sorts by rate, then volume, with nothing to compare last", () => {
    const threeOh = row("A", { ats: { covers: 3, losses: 0, cover_pct: 1 } });
    const oneOh = row("B", { ats: { covers: 1, losses: 0, cover_pct: 1 } });
    const none = row("C", { ats: { covers: 0, losses: 0, cover_pct: null } });
    const sorted = [none, oneOh, threeOh].sort(
      (a, b) =>
        sortValue(b, "ats", undefined, undefined) -
        sortValue(a, "ats", undefined, undefined)
    );
    expect(sorted.map((t) => t.team.abbr)).toEqual(["A", "B", "C"]);
    expect(sortValue(threeOh, "player", undefined, undefined)).toBe(-1);
  });
});
