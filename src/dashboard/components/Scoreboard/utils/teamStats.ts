import { TeamBoxScore } from "../../../types";

// Fixed away/home bar colors, the same in every game. Team colors were tried
// first, but some matchups can't be told apart (ARI/SF are both red, BAL
// purple vs DAL navy), and logos + position already say which side is whose.
// Blue/orange stays distinct for color-blind viewers and clear of the
// green/red the app uses for covering.
export const STAT_BAR_COLORS = { away: "#1f77d0", home: "#f28c28" } as const;

const formatSeconds = (sec: number) =>
  `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, "0")}`;

// A conversion rate for bar sizing; 0/0 counts as 0 so a team with no
// attempts doesn't out-bar one that converted.
const rate = (made?: number, att?: number) =>
  made == null || att == null ? undefined : att > 0 ? made / att : 0;

interface StatDef {
  label: string;
  main: (b: TeamBoxScore) => string | number | undefined;
  // secondary number shown muted in parentheses, e.g. sack yards
  sub?: (b: TeamBoxScore) => string | number | undefined;
  // what the bar is sized by
  weight: (b: TeamBoxScore) => number | undefined;
  // giveaways/penalties: the team with FEWER gets the longer bar
  lowerIsBetter?: boolean;
}

const pair = (made?: number, att?: number) =>
  made == null || att == null ? undefined : `${made}-${att}`;

export const TEAM_STAT_DEFS: StatDef[] = [
  {
    label: "1st Downs",
    main: (b) => b.first_downs_total,
    weight: (b) => b.first_downs_total,
  },
  {
    label: "3rd Down Efficiency",
    main: (b) => pair(b.third_down_conversions, b.third_down_attempts),
    weight: (b) => rate(b.third_down_conversions, b.third_down_attempts),
  },
  {
    label: "4th Down Efficiency",
    main: (b) => pair(b.fourth_down_conversions, b.fourth_down_attempts),
    weight: (b) => rate(b.fourth_down_conversions, b.fourth_down_attempts),
  },
  {
    label: "Red Zone",
    main: (b) => pair(b.redzone_made, b.redzone_attempts),
    weight: (b) => rate(b.redzone_made, b.redzone_attempts),
  },
  {
    label: "Rushing Yards",
    main: (b) => b.rushing_yards,
    weight: (b) => b.rushing_yards,
  },
  {
    label: "Passing Yards",
    main: (b) => b.passing_yards,
    weight: (b) => b.passing_yards,
  },
  {
    label: "Total Yards",
    main: (b) => b.yards_total,
    weight: (b) => b.yards_total,
  },
  {
    label: "Sacks Allowed (Yards)",
    main: (b) => b.sacks_given_up,
    sub: (b) => b.sack_yards_lost,
    weight: (b) => b.sacks_given_up,
    lowerIsBetter: true,
  },
  {
    label: "Interceptions Thrown",
    main: (b) => b.interceptions_thrown,
    weight: (b) => b.interceptions_thrown,
    lowerIsBetter: true,
  },
  {
    label: "Fumbles Lost",
    main: (b) => b.fumbles_lost,
    weight: (b) => b.fumbles_lost,
    lowerIsBetter: true,
  },
  {
    // Fewer punts = more drives that didn't stall
    label: "Punts (Avg)",
    main: (b) => b.punts,
    sub: (b) => b.punt_average?.toFixed(1),
    weight: (b) => b.punts,
    lowerIsBetter: true,
  },
  {
    label: "Penalties (Yards)",
    main: (b) => b.penalties,
    sub: (b) => b.penalty_yards,
    weight: (b) => b.penalties,
    lowerIsBetter: true,
  },
  {
    label: "Possession",
    main: (b) =>
      b.time_of_possession_sec == null
        ? undefined
        : formatSeconds(b.time_of_possession_sec),
    weight: (b) => b.time_of_possession_sec,
  },
];

export interface TeamStatRow {
  label: string;
  away: { main: string | number; sub?: string | number };
  home: { main: string | number; sub?: string | number };
  // away's share of the bar, 0-1 (home gets the rest)
  awayShare: number;
}

// Bar split for one stat. Lower-is-better stats compare the other way round,
// so fewer giveaways = longer bar. Both zero = an even split.
export const barShare = (
  away: number,
  home: number,
  lowerIsBetter = false
): number => {
  const [a, h] = lowerIsBetter
    ? [Math.max(0, home), Math.max(0, away)]
    : [Math.max(0, away), Math.max(0, home)];
  return a + h === 0 ? 0.5 : a / (a + h);
};

// Rows with a value for both teams, in display order.
export const teamStatRows = (
  away: TeamBoxScore,
  home: TeamBoxScore
): TeamStatRow[] =>
  TEAM_STAT_DEFS.flatMap((def) => {
    const [am, hm, aw, hw] = [
      def.main(away),
      def.main(home),
      def.weight(away),
      def.weight(home),
    ];
    if (am == null || hm == null || aw == null || hw == null) return [];
    return [
      {
        label: def.label,
        away: { main: am, sub: def.sub?.(away) },
        home: { main: hm, sub: def.sub?.(home) },
        awayShare: barShare(aw, hw, def.lowerIsBetter),
      },
    ];
  });
