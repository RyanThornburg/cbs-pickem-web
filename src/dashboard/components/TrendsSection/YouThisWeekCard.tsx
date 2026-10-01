import { Box, Stack, Typography } from "@mui/material";
import { GameCoverResult } from "../../data/weekGames";
import { ordinal } from "../../helper";
import { AllAlonePick, RankedUser } from "../../types";
import { Big, CardShell, Sub } from "../Recap/WeekRecapCards";
import { getWeeklyForm } from "../UsersTable/usersTableUtils";
import TeamLogo from "./TeamLogo";

export type Props = {
  user: RankedUser;
  // The selected player's all-alone picks this week (usually none).
  alone: AllAlonePick[];
  gameResults: Map<number, GameCoverResult>;
};

// First card on Trends › Week when a player is selected: their week in one
// number, where it leaves them, and any pick nobody else made. Built from
// the leaderboard and trends already loaded, no extra fetch.
export default function YouThisWeekCard({ user, alone, gameResults }: Props) {
  const { won, lost, covering, notCovering } = getWeeklyForm(user.picks);
  const final = won + lost;
  const live = covering + notCovering;

  let big: { value: string; suffix?: string };
  if (final > 0) big = { value: `${won}-${lost}`, suffix: "in final games" };
  else if (live > 0)
    big = { value: `${covering} of ${live}`, suffix: "covering now" };
  else if (user.has_submitted_picks === false)
    big = { value: "No picks", suffix: "yet" };
  else big = { value: "0-0", suffix: "no games played yet" };

  return (
    <CardShell title="You this week" category="users" highlight>
      <Big value={big.value} suffix={big.suffix} />
      {final > 0 && live > 0 && (
        <Sub>
          Plus {covering} covering now, {notCovering} not
        </Sub>
      )}
      {user.place > 0 && <Sub>{ordinal(user.place)} overall</Sub>}
      {alone.map((pick) => {
        const cover = gameResults.get(pick.game_id);
        const covered =
          cover?.isFinal && cover.coveringTeamId === pick.picked_team_id;
        return (
          <Stack
            key={pick.game_id}
            direction="row"
            spacing={0.75}
            sx={{ alignItems: "center" }}
          >
            <TeamLogo abbr={pick.abbr} size={16} />
            <Typography sx={{ fontSize: "0.8125rem" }}>
              Only one on {pick.abbr}
              {cover?.isFinal && (
                <Box
                  component="span"
                  sx={{
                    fontWeight: 600,
                    // Darker red than error.main so it holds 4.5:1 on the lime tint.
                    color: covered ? "success.main" : "#c62828",
                  }}
                >
                  {covered ? " · covered" : " · didn't cover"}
                </Box>
              )}
            </Typography>
          </Stack>
        );
      })}
    </CardShell>
  );
}
