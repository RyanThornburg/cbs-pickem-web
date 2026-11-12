import { fetchJson } from "../../api/pickemApi";
import { GameStatus, PayPeriod } from "../types";
import { OVERALL_KEY } from "../utils/payPeriods";
import { fetchWeekGames } from "./weekGames";

// Admin › Payouts: every prize whose last week is over, with what the data
// says each winner is owed. One-shot reads of the public leaderboard and
// games keys; the amounts themselves are only shown on the admin page.

export interface PrizeWinner {
  user_id: number;
  name: string;
  place: number;
  tied: boolean;
  // Dollars and cents, from the data's `payout` (ties already split). Null
  // when the key doesn't carry it.
  owed: number | null;
}

export interface FinishedPrize {
  period: PayPeriod;
  winners: PrizeWinner[];
}

interface ApiPrizeUser {
  user_id: number;
  name: string;
  periods?: Record<
    string,
    { place?: number | null; payout?: number | null } | undefined
  >;
}

interface ApiPrizeLeaderboard {
  periods?: PayPeriod[];
  users: ApiPrizeUser[];
}

// The paid places in one finished period, as the data ranked them on the
// period's last week (final, so no live bonus to re-rank on). Everyone tied
// at the cutoff is paid; the data splits the money between them.
export const prizeWinners = (
  users: ApiPrizeUser[],
  period: PayPeriod
): PrizeWinner[] => {
  const placeOf = (u: ApiPrizeUser) => u.periods?.[period.key]?.place ?? null;
  const counts = new Map<number, number>();
  users.forEach((u) => {
    const place = placeOf(u);
    if (place != null) counts.set(place, (counts.get(place) ?? 0) + 1);
  });
  return users
    .filter((u) => {
      const place = placeOf(u);
      return place != null && place <= period.paid_places;
    })
    .map((u) => {
      const place = placeOf(u)!;
      const payout = u.periods?.[period.key]?.payout;
      return {
        user_id: u.user_id,
        name: u.name,
        place,
        tied: (counts.get(place) ?? 0) > 1,
        owed: typeof payout === "number" ? payout : null,
      };
    })
    .sort(
      (a, b) =>
        a.place - b.place ||
        a.name.localeCompare(b.name, undefined, { sensitivity: "base" })
    );
};

const getLeaderboard = (season: number, week: number) =>
  fetchJson<ApiPrizeLeaderboard>(`/api/weeks/${season}/${week}/leaderboard`);

// A period is payable once the data marks it `final` on the current week's
// leaderboard (every week final and every pick graded; the flag stays true
// on later weeks' keys, while an older end-week key may predate the field).
// Where the flag is missing, fall back to our own rule: the current week is
// past its last week, or on it with every game final (which can run a
// minute or two ahead of CBS's grading).
export const GetFinishedPrizes = async (
  season: number,
  currentWeek: number,
  periods: PayPeriod[]
): Promise<FinishedPrize[]> => {
  const candidates = periods.filter(
    (p) => p.end_week != null && p.end_week <= currentWeek
  );
  if (!candidates.length) return [];
  const current = await getLeaderboard(season, currentWeek).catch(() => null);
  const flagOf = (p: PayPeriod) =>
    current?.periods?.find((c) => c.key === p.key)?.final;
  const lastWeekDone =
    candidates.some(
      (p) => p.end_week === currentWeek && flagOf(p) === undefined
    ) &&
    (await fetchWeekGames(season, currentWeek).then(
      ({ games }) =>
        games.length > 0 && games.every((g) => g.status === GameStatus.Final),
      () => false
    ));
  const finished = candidates.filter((p) => {
    const flag = flagOf(p);
    return flag ?? (p.end_week! < currentWeek || lastWeekDone);
  });
  const weeks = [...new Set(finished.map((p) => p.end_week!))];
  const boards = new Map(
    await Promise.all(
      weeks.map(
        async (week) =>
          [
            week,
            week === currentWeek && current
              ? current
              : await getLeaderboard(season, week),
          ] as const
      )
    )
  );
  return (
    finished
      .map((period) => {
        const board = boards.get(period.end_week!)!;
        // The key's own copy of the period, which carries the payouts.
        const own = board.periods?.find((p) => p.key === period.key) ?? period;
        return { period: own, winners: prizeWinners(board.users, own) };
      })
      // In the order they finish, overall last on the season's final week.
      .sort(
        (a, b) =>
          a.period.end_week! - b.period.end_week! ||
          Number(a.period.key === OVERALL_KEY) -
            Number(b.period.key === OVERALL_KEY)
      )
  );
};
