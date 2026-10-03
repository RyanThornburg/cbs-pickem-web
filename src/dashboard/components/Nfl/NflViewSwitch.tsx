import Box from "@mui/material/Box";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import { visuallyHidden } from "../../helper";
import { NflView } from "./nflView";

const LABELS: Record<NflView, string> = {
  games: "Games",
  live: "Live",
  standings: "Standings",
};

// Games | Live | Standings, on the intro row of each NFL view. Live carries
// the red dot the Scoreboard tab used to while a game is on.
export default function NflViewSwitch({
  view,
  onChange,
  hasLiveGame,
}: {
  view: NflView;
  onChange: (view: NflView) => void;
  hasLiveGame: boolean;
}) {
  return (
    <ToggleButtonGroup
      size="small"
      exclusive
      value={view}
      onChange={(_, next: NflView | null) => next && onChange(next)}
      aria-label="NFL view"
    >
      {(Object.keys(LABELS) as NflView[]).map((value) => (
        <ToggleButton key={value} value={value}>
          {LABELS[value]}
          {value === "live" && hasLiveGame && (
            <>
              <Box
                component="span"
                aria-hidden
                sx={{
                  ml: 0.75,
                  width: 7,
                  height: 7,
                  borderRadius: "50%",
                  bgcolor: "error.main",
                }}
              />
              <Box component="span" sx={visuallyHidden}>
                , games in progress
              </Box>
            </>
          )}
        </ToggleButton>
      ))}
    </ToggleButtonGroup>
  );
}
