import Box from "@mui/material/Box";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import { createContext, useContext } from "react";
import { visuallyHidden } from "../../helper";
import { NflView } from "./nflView";

const LABELS: Record<NflView, string> = {
  games: "Games",
  live: "Live",
  standings: "Standings",
};

export interface NflViewState {
  // The view shown, or the one just tapped while it renders.
  view: NflView | null;
  onChange: (view: NflView) => void;
  hasLiveGame: boolean;
}

// MainGrid provides the switch's state through context rather than props,
// so a view change re-renders the switches and not the (memoized) views
// they sit in.
export const NflViewContext = createContext<NflViewState>({
  view: null,
  onChange: () => {},
  hasLiveGame: false,
});

// Games | Live | Standings, on the intro row of each NFL view. Live carries
// the red dot the Scoreboard tab used to while a game is on.
export default function NflViewSwitch() {
  const { view, onChange, hasLiveGame } = useContext(NflViewContext);
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
