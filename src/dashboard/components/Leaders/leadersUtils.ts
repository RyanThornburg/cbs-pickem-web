import { PayPeriod, RankedUser } from "../../types";
import { OVERALL_KEY } from "../../utils/payPeriods";
import { rowPeriods } from "../UsersTable/usersTableUtils";

export interface RaceLeader {
  id: string;
  name: string;
  // Graded points, then picks covering right now (the table's "28 +1").
  score: number;
  covering: number;
}

export interface RaceYou {
  // Rank on the displayed score (see GetUserByWeek); "T8" when shared.
  placeLabel: string;
  place: number;
  score: number;
  covering: number;
  inMoney: boolean;
  // Points behind the paid line (tying it is enough); 0 when in.
  ptsOut: number;
  // Points ahead of the best player outside the money, when in it. Null
  // when no one is outside it.
  ptsClear: number | null;
}

export interface RaceSummary {
  key: string;
  paid: number;
  // False until someone has a point in this period (the 2nd half's first
  // week, before any pick settles or covers): everyone is tied for 1st at
  // 0, so there's no leader, paid line or gap worth showing.
  started: boolean;
  leaders: RaceLeader[];
  // The displayed score of the last paid place: what it takes to be paid
  // if the period ended now.
  paidLine: number;
  // Players in the paid places, counting everyone tied at the cutoff (can
  // run past `paid`).
  inMoney: number;
  you: RaceYou | null;
}

const gradedScore = (user: RankedUser, key: string) =>
  key === OVERALL_KEY ? user.cumulative_score : (user.periods[key]?.score ?? 0);

// One prize's race for the strip at the top of User Picks: who leads, the
// score the last paid place has, and where the selected player stands
// against it. Places and scores are the displayed ones (graded plus
// covering now), the same the table, its paid lines and the header's money
// lines use, so every number agrees. Users with no place in the period
// (before it starts) are left out.
export const raceSummary = (
  users: RankedUser[],
  period: PayPeriod,
  periods: PayPeriod[],
  week: number,
  selectedId?: string
): RaceSummary => {
  const ranked = users.flatMap((user) => {
    const standing = rowPeriods(user, periods, week)[period.key];
    return standing?.place != null
      ? [{ user, place: standing.place, total: standing.score }]
      : [];
  });
  const counts = new Map<number, number>();
  ranked.forEach((r) => counts.set(r.place, (counts.get(r.place) ?? 0) + 1));

  const paid = period.paid_places;
  const inRows = ranked.filter((r) => r.place <= paid);
  const outRows = ranked.filter((r) => r.place > paid);
  const paidLine = inRows.length ? Math.min(...inRows.map((r) => r.total)) : 0;
  const bestOut = outRows.length
    ? Math.max(...outRows.map((r) => r.total))
    : null;

  const leaders = ranked
    .filter((r) => r.place === 1)
    .sort((a, b) =>
      a.user.name.localeCompare(b.user.name, undefined, {
        sensitivity: "base",
      })
    )
    .map(({ user }) => ({
      id: user.id,
      name: user.name,
      score: gradedScore(user, period.key),
      covering: user.trending_score,
    }));

  const mine = selectedId
    ? ranked.find((r) => r.user.id === selectedId)
    : undefined;
  const you: RaceYou | null = mine
    ? {
        place: mine.place,
        placeLabel: `${(counts.get(mine.place) ?? 0) > 1 ? "T" : ""}${mine.place}`,
        score: gradedScore(mine.user, period.key),
        covering: mine.user.trending_score,
        inMoney: mine.place <= paid,
        ptsOut: mine.place <= paid ? 0 : Math.max(0, paidLine - mine.total),
        ptsClear:
          mine.place <= paid && bestOut !== null ? mine.total - bestOut : null,
      }
    : null;

  return {
    key: period.key,
    paid,
    started: ranked.some((r) => r.total > 0),
    leaders,
    paidLine,
    inMoney: inRows.length,
    you,
  };
};

// "Patrick Madden" → "P. Madden", for a second name beside the first.
export const shortName = (name: string): string => {
  const parts = name.trim().split(/\s+/);
  return parts.length > 1
    ? `${parts[0][0].toUpperCase()}. ${parts.slice(1).join(" ")}`
    : name;
};
