import { GameStatus, UserPick } from "../../types";
import { getWeeklyForm } from "./usersTableUtils";

const pick = (
  is_correct: boolean | null,
  trending_status?: string
): UserPick => ({
  game_id: 1,
  team: "BAL",
  is_correct,
  trending_status,
  game_status: GameStatus.Scheduled,
  visible: true,
});

describe("getWeeklyForm", () => {
  it("returns neutral, too early, when nothing is decided yet", () => {
    const result = getWeeklyForm([pick(null, "NONE"), pick(null), pick(null)]);
    expect(result).toMatchObject({ form: "neutral", tooEarly: true, decided: 0, total: 3 });
  });

  it("stays neutral below the minimum even if every decided pick won", () => {
    const result = getWeeklyForm([pick(true), pick(true), pick(null, "NONE")]);
    expect(result).toMatchObject({ form: "neutral", tooEarly: true, won: 2 });
  });

  it("counts live covering / not covering picks toward the call", () => {
    const hot = getWeeklyForm([pick(true), pick(null, "CORRECT"), pick(null, "CORRECT"), pick(null, "NONE")]);
    expect(hot).toMatchObject({ form: "hot", tooEarly: false, won: 1, covering: 2, decided: 3 });

    const cold = getWeeklyForm([pick(false), pick(null, "INCORRECT"), pick(null, "INCORRECT"), pick(true)]);
    expect(cold).toMatchObject({ form: "cold", lost: 1, notCovering: 2, won: 1, decided: 4 });
  });

  it("prefers the final result over a stale trending_status", () => {
    const result = getWeeklyForm([pick(false, "CORRECT"), pick(false), pick(false)]);
    expect(result).toMatchObject({ form: "cold", lost: 3, covering: 0 });
  });
});
