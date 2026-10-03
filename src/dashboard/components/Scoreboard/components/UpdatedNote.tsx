import Box from "@mui/material/Box";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutlineOutlined";
import { formatUpdated } from "../../../utils/updatedTime";

// The Scoreboard's freshness line on the tab intro, at every width: while a
// game is live, when the scores were last fetched; after a failed refresh,
// that the scores on screen are from then (User Picks' wording). Nothing on
// a quiet day, when the time would only be noise.
export function UpdatedNote({
  updatedAt,
  refreshFailed,
  live,
}: {
  updatedAt: Date | null;
  refreshFailed: boolean;
  live: boolean;
}) {
  if (!updatedAt || !(live || refreshFailed)) return null;
  return (
    <Box
      component="span"
      role="status"
      sx={{
        display: "inline-flex",
        alignItems: "center",
        gap: 0.5,
        fontSize: "0.75rem",
        color: "text.secondary",
      }}
    >
      {refreshFailed && (
        <ErrorOutlineIcon aria-hidden sx={{ fontSize: "0.9rem" }} />
      )}
      {refreshFailed
        ? `Couldn't refresh. Showing ${formatUpdated(updatedAt)}, trying again every minute.`
        : `Updated ${formatUpdated(updatedAt)}`}
    </Box>
  );
}
