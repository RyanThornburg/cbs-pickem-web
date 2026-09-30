import { RankedUser } from "../../types";
import { leaderList } from "./leadersUtils";

const user = (
  id: string,
  place: number,
  cumulative: number,
  trending = 0,
  secondHalf: [number, number] | null = null
): RankedUser => ({
  id,
  name: `User ${id}`,
  weekly_score: 0,
  trending_score: trending,
  cumulative_score: cumulative,
  second_half_score: secondHalf ? secondHalf[1] : null,
  place,
  second_half_place: secondHalf ? secondHalf[0] : null,
  picks: [],
});

describe("leaderList", () => {
  // Places as GetUserByWeek ranks them: on cumulative + trending.
  const users = [
    user("a", 1, 47, 0, [3, 6]),
    user("b", 1, 45, 2, [1, 8]),
    user("c", 3, 46, 0, [2, 7]),
    user("d", 4, 44, 1, [3, 5]),
    user("e", 5, 44, 0, [6, 4]),
    user("f", 5, 43, 1, [7, 3]),
    user("g", 7, 40, 0, [8, 2]),
  ];

  it("takes the paid places, including everyone tied at the cutoff", () => {
    const { rows } = leaderList(users, "overall", 5);
    expect(rows.map((r) => r.id)).toEqual(["a", "b", "c", "d", "e", "f"]);
    expect(rows.map((r) => r.placeLabel)).toEqual([
      "T1",
      "T1",
      "3",
      "4",
      "T5",
      "T5",
    ]);
  });

  it("splits score from picks covering now", () => {
    const { rows } = leaderList(users, "overall", 5);
    const b = rows.find((r) => r.id === "b")!;
    expect([b.score, b.covering]).toEqual([45, 2]);
    const d = rows.find((r) => r.id === "d")!;
    expect([d.score, d.covering]).toEqual([44, 1]);
  });

  it("ranks the second half on its own score", () => {
    const { rows } = leaderList(users, "second_half", 3);
    expect(rows.map((r) => [r.id, r.placeLabel, r.score])).toEqual([
      ["b", "1", 8],
      ["c", "2", 7],
      ["a", "T3", 6],
      ["d", "T3", 5],
    ]);
  });

  it("adds the selected user's row only when they're outside the list", () => {
    expect(leaderList(users, "overall", 5, "g").youRow?.placeLabel).toBe("7");
    expect(leaderList(users, "overall", 5, "c").youRow).toBeNull();
    expect(leaderList(users, "overall", 5, "nobody").youRow).toBeNull();
    expect(leaderList(users, "overall", 5).youRow).toBeNull();
  });

  it("leaves out users with no second-half rank", () => {
    const early = [user("a", 1, 10), user("b", 2, 9)];
    expect(leaderList(early, "second_half", 3).rows).toEqual([]);
    expect(leaderList(early, "second_half", 3, "a").youRow).toBeNull();
  });
});
