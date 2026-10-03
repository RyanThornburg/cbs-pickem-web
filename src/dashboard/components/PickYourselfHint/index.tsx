import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import CloseIcon from "@mui/icons-material/Close";
import PersonSearchIcon from "@mui/icons-material/PersonSearch";
import { useState } from "react";

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
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        flexWrap: { xs: "wrap", sm: "nowrap" },
        gap: 1,
        mb: 1.5,
        pl: 1.5,
        pr: 0.5,
        py: 1,
        border: 1,
        borderColor: "divider",
        borderRadius: 2,
        bgcolor: "background.paper",
        textAlign: "left",
      }}
    >
      <PersonSearchIcon
        aria-hidden
        sx={{ color: "text.secondary", fontSize: "1.25rem" }}
      />
      <Typography
        variant="body2"
        sx={{ flex: "1 1 12rem", minWidth: 0, color: "text.primary" }}
      >
        Pick your name to highlight your row and picks on every tab.
      </Typography>
      <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, ml: "auto" }}>
        <Button variant="outlined" size="small" onClick={onChoose}>
          Choose your name
        </Button>
        <IconButton
          aria-label="Dismiss"
          onClick={dismiss}
          sx={{ width: 36, height: 36 }}
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>
    </Box>
  );
}
