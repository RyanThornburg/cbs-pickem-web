import { PlayerLine } from "../../../types";

// The box score panel's player stats: which groups to offer, each group's
// columns, and the rows for one team. The details key's `players` holds
// ESPN-style groups per team; defense folds in interceptions, and kick and
// punt returns share one group.

export type PlayerStatGroupId =
  | "passing"
  | "rushing"
  | "receiving"
  | "defense"
  | "kicking"
  | "punting"
  | "returns";

type Players = Record<string, PlayerLine[]>;

export interface PlayerStatGroup {
  id: PlayerStatGroupId;
  label: string;
  // Header and stats key per column, after the name.
  columns: { label: string; key: string; title?: string }[];
  // Rows shown before "Show all" (defense lists 20-odd players a side).
  top?: number;
  rows: (players: Players | undefined) => PlayerLine[];
}

const group = (players: Players | undefined, key: string) =>
  players?.[key] ?? [];

export const PLAYER_STAT_GROUPS: PlayerStatGroup[] = [
  {
    id: "passing",
    label: "Passing",
    columns: [
      { label: "C/ATT", key: "comp_att", title: "Completions/attempts" },
      { label: "YDS", key: "yards" },
      { label: "AVG", key: "average", title: "Yards per attempt" },
      { label: "TD", key: "passing_touch_downs" },
      { label: "INT", key: "interceptions" },
      { label: "SACKS", key: "sacks", title: "Sacks-yards lost" },
      { label: "RTG", key: "rating", title: "Passer rating" },
    ],
    rows: (p) => group(p, "passing"),
  },
  {
    id: "rushing",
    label: "Rushing",
    columns: [
      { label: "CAR", key: "total_rushes", title: "Carries" },
      { label: "YDS", key: "yards" },
      { label: "AVG", key: "average", title: "Yards per carry" },
      { label: "TD", key: "rushing_touch_downs" },
      { label: "LONG", key: "longest_rush" },
    ],
    rows: (p) => group(p, "rushing"),
  },
  {
    id: "receiving",
    label: "Receiving",
    columns: [
      { label: "REC", key: "total_receptions", title: "Receptions" },
      { label: "TGTS", key: "targets", title: "Targets" },
      { label: "YDS", key: "yards" },
      { label: "AVG", key: "average", title: "Yards per catch" },
      { label: "TD", key: "receiving_touch_downs" },
      { label: "LONG", key: "longest_reception" },
    ],
    rows: (p) => group(p, "receiving"),
  },
  {
    id: "defense",
    label: "Defense",
    top: 5,
    columns: [
      { label: "TOT", key: "tackles", title: "Total tackles" },
      { label: "SOLO", key: "unassisted_tackles", title: "Solo tackles" },
      { label: "SACKS", key: "sacks" },
      { label: "TFL", key: "tfl", title: "Tackles for loss" },
      { label: "PD", key: "passes_defended", title: "Passes defended" },
      { label: "QB HTS", key: "qb_hts", title: "QB hits" },
      { label: "INT", key: "int", title: "Interceptions" },
      { label: "FF", key: "ff", title: "Forced fumbles" },
    ],
    // Most tackles first; interceptions come from their own group, joined
    // by name (a player with an interception and no tackle still shows).
    rows: (p) => {
      const ints = new Map(
        group(p, "interceptions").map((line) => [
          line.name,
          line.stats.total_interceptions ?? 0,
        ])
      );
      const rows: PlayerLine[] = group(p, "defensive").map((line) => ({
        ...line,
        stats: { ...line.stats, int: ints.get(line.name) ?? 0 },
      }));
      for (const [name, count] of ints) {
        if (!rows.some((row) => row.name === name)) {
          rows.push({ name, stats: { int: count } });
        }
      }
      return rows.sort(
        (a, b) => Number(b.stats.tackles ?? 0) - Number(a.stats.tackles ?? 0)
      );
    },
  },
  {
    id: "kicking",
    label: "Kicking",
    columns: [
      { label: "FG", key: "field_goals", title: "Field goals made/attempted" },
      { label: "PCT", key: "pct" },
      { label: "LONG", key: "long" },
      { label: "XP", key: "extra_point", title: "Extra points made/attempted" },
      { label: "PTS", key: "points" },
    ],
    rows: (p) => group(p, "kicking"),
  },
  {
    id: "punting",
    label: "Punting",
    columns: [
      { label: "NO", key: "total", title: "Punts" },
      { label: "YDS", key: "yards" },
      { label: "AVG", key: "average" },
      { label: "IN 20", key: "in20", title: "Inside the 20" },
      { label: "TB", key: "touchbacks", title: "Touchbacks" },
      { label: "LONG", key: "lg" },
    ],
    rows: (p) => group(p, "punting"),
  },
  {
    id: "returns",
    label: "Returns",
    columns: [
      { label: "", key: "kind" },
      { label: "NO", key: "total", title: "Returns" },
      { label: "YDS", key: "yards" },
      { label: "AVG", key: "average" },
      { label: "LONG", key: "lg" },
      { label: "TD", key: "td" },
    ],
    rows: (p) => [
      ...group(p, "kick_returns").map((line) => ({
        ...line,
        stats: { ...line.stats, kind: "Kick" },
      })),
      ...group(p, "punt_returns").map((line) => ({
        ...line,
        stats: { ...line.stats, kind: "Punt" },
      })),
    ],
  },
];

// The groups with at least one player on either team, in the fixed order.
export const availableGroups = (players: {
  home: Players;
  away: Players;
}): PlayerStatGroup[] =>
  PLAYER_STAT_GROUPS.filter(
    (g) => g.rows(players.away).length > 0 || g.rows(players.home).length > 0
  );

// A stat cell: the value as the feed sends it ("24/33", 268, 8.1), "–" when
// missing.
export const statCell = (value: number | string | null | undefined): string =>
  value == null || value === "" ? "–" : String(value);
