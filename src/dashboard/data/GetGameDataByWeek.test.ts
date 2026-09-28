import { hasLiveishGame } from "./GetGameDataByWeek";
import { ApiGame } from "./weekGames";

const NOW = Date.parse("2026-09-27T17:00:00Z");
const MIN = 60_000;

const game = (status: string, minutesFromNow: number) =>
  ({
    status,
    game_time: new Date(NOW + minutesFromNow * MIN).toISOString(),
  }) as ApiGame;

describe("hasLiveishGame", () => {
  it("is true for any live status", () => {
    expect(hasLiveishGame([game("IN_PROGRESS", -30)], NOW)).toBe(true);
    expect(hasLiveishGame([game("HALFTIME", -90)], NOW)).toBe(true);
    expect(hasLiveishGame([game("DELAYED", -10)], NOW)).toBe(true);
  });

  it("is false for final games and far-off scheduled games", () => {
    expect(hasLiveishGame([game("FINAL", -200)], NOW)).toBe(false);
    expect(hasLiveishGame([game("SCHEDULED", 60)], NOW)).toBe(false);
    expect(hasLiveishGame([], NOW)).toBe(false);
  });

  it("is true for a scheduled game near kickoff", () => {
    expect(hasLiveishGame([game("SCHEDULED", 4)], NOW)).toBe(true);
    expect(hasLiveishGame([game("SCHEDULED", -2)], NOW)).toBe(true);
  });

  it("stops treating a scheduled game as live well past kickoff", () => {
    expect(hasLiveishGame([game("SCHEDULED", -20)], NOW)).toBe(false);
    expect(hasLiveishGame([game("SCHEDULED", -60 * 24 * 7)], NOW)).toBe(false);
  });
});
