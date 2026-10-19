import { createContext, useContext } from "react";
import { SegmentedControl } from "../../ui/SegmentedControl";
import uiStyles from "../../ui/ui.module.css";
import { NflView } from "./nflView";
import styles from "./NflViewSwitch.module.css";

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
    <SegmentedControl
      value={view}
      onChange={onChange}
      label="NFL view"
      segments={(Object.keys(LABELS) as NflView[]).map((value) => ({
        value,
        children: (
          <>
            {LABELS[value]}
            {value === "live" && hasLiveGame && (
              <>
                <span aria-hidden className={styles.liveDot} />
                <span className={uiStyles.visuallyHidden}>
                  , games in progress
                </span>
              </>
            )}
          </>
        ),
      }))}
    />
  );
}
