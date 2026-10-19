import IconButton from "@mui/material/IconButton";
import { useState } from "react";
import { Button } from "../../ui/Button";
import { Icon } from "../../ui/Icon";
import styles from "./PickYourselfHint.module.css";

const DISMISSED_KEY = "pickYourselfHintDismissed";

const readDismissed = () => {
  try {
    return localStorage.getItem(DISMISSED_KEY) === "1";
  } catch {
    return false;
  }
};

// Shown on User Picks until a player is chosen: picking yourself is what
// lights up your row, the header summary, the leader cards' "you" row and
// the Scoreboard's "Your picks" strip. Dismissible for anyone just browsing.
export default function PickYourselfHint({
  onChoose,
}: {
  onChoose: () => void;
}) {
  const [dismissed, setDismissed] = useState(readDismissed);
  if (dismissed) return null;

  const dismiss = () => {
    setDismissed(true);
    try {
      localStorage.setItem(DISMISSED_KEY, "1");
    } catch {
      // Private mode etc.: it just comes back next visit.
    }
  };

  return (
    <div className={styles.hint}>
      <Icon name="PersonSearch" size="small" className={styles.icon} />
      <p className={styles.text}>
        Pick your name to highlight your row and picks on every tab.
      </p>
      <div className={styles.actions}>
        <Button variant="outlined" size="small" onClick={onChoose}>
          Choose your name
        </Button>
        <IconButton
          aria-label="Dismiss"
          onClick={dismiss}
          sx={{ width: 36, height: 36 }}
        >
          <Icon name="Close" size="small" />
        </IconButton>
      </div>
    </div>
  );
}
