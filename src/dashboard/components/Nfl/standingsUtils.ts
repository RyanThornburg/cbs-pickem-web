import {
  AtsSplit,
  NflStandings,
  PickRecord,
  StandingsTeam,
  TeamProfile,
  WinLoss,
} from "../../types";
import { teamSlug } from "./nflView";

export interface PlacedTeam {
  row: StandingsTeam;
  conference: string;
  division: string;
}

// Every team with its conference and division, AFC then NFC, each division
// best first (the key's own order).
export const flattenStandings = (standings: NflStandings): PlacedTeam[] =>
  standings.conferences.flatMap((conference) =>
    conference.divisions.flatMap((division) =>
      division.teams.map((row) => ({
        row,
        conference: conference.abbr,
        division: division.name,
      }))
    )
  );

export const findTeamBySlug = (
  standings: NflStandings,
  slug: string
): PlacedTeam | undefined =>
  flattenStandings(standings).find(
    ({ row }) => teamSlug(row.team.abbr) === slug.toLowerCase()
  );

// Each team's pool record (picking them), from the standings key, or from
// the team's own key for a standings key written before it carried `pool`.
export const poolRecordsById = (
  standings: NflStandings | undefined,
  profiles: Record<number, TeamProfile>
): Map<number, PickRecord> => {
  const byId = new Map<number, PickRecord>();
  if (!standings) return byId;
  flattenStandings(standings).forEach(({ row }) => {
    const picked = row.pool?.picked ?? profiles[row.team.id]?.pool.picked;
    if (picked) byId.set(row.team.id, picked);
  });
  return byId;
};

// 3-1, or 3-1-1 with a tie.
export const formatWinLoss = (record: WinLoss): string =>
  `${record.wins}-${record.losses}${record.ties ? `-${record.ties}` : ""}`;

export const formatAts = (ats: AtsSplit): string =>
  `${ats.covers}-${ats.losses}`;

// A record with nothing graded yet reads "–", not "0-0".
export const formatPickRecord = (
  record: PickRecord | undefined
): string | null =>
  record && record.wins + record.losses > 0
    ? `${record.wins}-${record.losses}`
    : null;

// +23, −9, 0 (a real minus sign).
export const formatDiff = (diff: number): string =>
  diff > 0 ? `+${diff}` : diff < 0 ? `−${Math.abs(diff)}` : "0";

// The selected player's first name heads their standings column; the
// legend under the table spells out the full name.
export const firstName = (name: string): string =>
  name.trim().split(/\s+/)[0] ?? name;

// Conference standings: teams sorted by seed, grouped by playoff status.
// Seeds 1-4 are division winners, 5-7 are wild card, 8-16 are out.
export const PLAYOFF_CUTOFF = 7;
export const DIVISION_WINNER_CUTOFF = 4;

export interface ConferenceStanding {
  row: StandingsTeam;
  division: string;
}

// All teams in one conference, sorted by seed. Teams without a seed go last,
// sorted by win_pct descending.
export const conferenceTeams = (
  standings: NflStandings,
  conferenceAbbr: string
): ConferenceStanding[] => {
  const conf = standings.conferences.find((c) => c.abbr === conferenceAbbr);
  if (!conf) return [];
  const teams: ConferenceStanding[] = conf.divisions.flatMap((d) =>
    d.teams.map((row) => ({ row, division: d.name }))
  );
  return teams.sort((a, b) => {
    const sa = a.row.seed ?? 99;
    const sb = b.row.seed ?? 99;
    if (sa !== sb) return sa - sb;
    return (b.row.win_pct ?? -1) - (a.row.win_pct ?? -1);
  });
};

// True when at least one team in the standings has a seed.
export const hasSeeds = (standings: NflStandings): boolean =>
  standings.conferences.some((c) =>
    c.divisions.some((d) => d.teams.some((t) => t.seed != null))
  );

// Short division name: "AFC East" → "East".
export const shortDivision = (name: string): string =>
  name.split(/\s+/).pop() ?? name;

// Format games behind: 0 → "–", 2.5 → "2.5", 3 → "3".
export const formatGB = (gb: number | null): string => {
  if (gb == null) return "–";
  if (gb === 0) return "–";
  return Number.isInteger(gb) ? String(gb) : gb.toFixed(1);
};

export type StandingsSortKey = "record" | "diff" | "ats" | "pool" | "player";

const pctOf = (wins: number, losses: number): number | null =>
  wins + losses > 0 ? wins / (wins + losses) : null;

// Value to sort a team by, high first. Nothing to compare (no games, no
// picks) sorts last. Ties break on volume, so 3-0 sits above 1-0.
export const sortValue = (
  row: StandingsTeam,
  key: StandingsSortKey,
  pool: PickRecord | undefined,
  player: PickRecord | undefined
): number => {
  const rate = (wins: number, losses: number) => {
    const pct = pctOf(wins, losses);
    return pct === null ? -1 : pct + (wins + losses) / 1000;
  };
  switch (key) {
    case "record":
      return row.win_pct === null ? -1 : row.win_pct + row.point_diff / 10000;
    case "diff":
      return row.point_diff;
    case "ats":
      return rate(row.ats.covers, row.ats.losses);
    case "pool":
      return pool ? rate(pool.wins, pool.losses) : -1;
    case "player":
      return player ? rate(player.wins, player.losses) : -1;
  }
};
