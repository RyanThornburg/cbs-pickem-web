import { RankedUser } from "../../types";

export type LeaderBoard = "overall" | "second_half";

export interface LeaderRow {
  id: string;
  name: string;
  // Rank on the displayed score (see GetUserByWeek); "T1" when shared.
  placeLabel: string;
  place: number;
  // Graded score without the live bonus, then picks covering right now.
  score: number;
  covering: number;
}

export interface LeaderList {
  rows: LeaderRow[];
  // The selected user's row when they're outside `rows`, else null.
  youRow: LeaderRow | null;
}

const placeOf = (user: RankedUser, board: LeaderBoard) =>
  board === "overall" ? user.place : user.second_half_place;

const scoreOf = (user: RankedUser, board: LeaderBoard) =>
  board === "overall" ? user.cumulative_score : (user.second_half_score ?? 0);

// The paid places for one board: everyone ranked within `paid`, so a tie at
// the cutoff shows every tied player (the list can run past `paid`). Users
// with no rank on that board (second half before it starts) are left out.
export const leaderList = (
  users: RankedUser[],
  board: LeaderBoard,
  paid: number,
  selectedId?: string
): LeaderList => {
  const ranked = users.filter((u) => placeOf(u, board) != null);
  const placeCounts = new Map<number, number>();
  ranked.forEach((u) => {
    const p = placeOf(u, board)!;
    placeCounts.set(p, (placeCounts.get(p) ?? 0) + 1);
  });

  const toRow = (u: RankedUser): LeaderRow => {
    const place = placeOf(u, board)!;
    const score = scoreOf(u, board);
    return {
      id: u.id,
      name: u.name,
      place,
      placeLabel: (placeCounts.get(place) ?? 0) > 1 ? `T${place}` : `${place}`,
      score,
      covering: u.trending_score,
    };
  };

  const rows = ranked
    .filter((u) => placeOf(u, board)! <= paid)
    .sort(
      (a, b) =>
        placeOf(a, board)! - placeOf(b, board)! || a.name.localeCompare(b.name)
    )
    .map(toRow);

  const selected = selectedId
    ? ranked.find((u) => u.id === selectedId)
    : undefined;
  const youRow =
    selected && !rows.some((r) => r.id === selected.id)
      ? toRow(selected)
      : null;

  return { rows, youRow };
};
