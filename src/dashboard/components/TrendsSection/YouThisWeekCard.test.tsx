import { render, screen } from "@testing-library/react";
import { GameCoverResult } from "../../data/weekGames";
import { RankedUser } from "../../types";
import YouThisWeekCard from "./YouThisWeekCard";

// Picks for games that haven't started are hidden, so they're just absent.
const user = { picks: [], place: 4 } as unknown as RankedUser;
const results = (...finals: boolean[]) =>
  new Map<number, GameCoverResult>(
    finals.map((isFinal, i) => [i, { isFinal, coveringTeamId: null }])
  );

describe("YouThisWeekCard", () => {
  it("says no games have been played before any game is final", () => {
    render(
      <YouThisWeekCard user={user} alone={[]} gameResults={results(false)} />
    );
    expect(screen.getByText("no games played yet")).toBeInTheDocument();
  });

  it("says the player's own picks haven't started once others are final", () => {
    render(
      <YouThisWeekCard
        user={user}
        alone={[]}
        gameResults={results(true, false)}
      />
    );
    expect(
      screen.getByText("your picks haven't kicked off yet")
    ).toBeInTheDocument();
  });
});
