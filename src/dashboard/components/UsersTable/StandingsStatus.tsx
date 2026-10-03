import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Skeleton from "@mui/material/Skeleton";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutlineOutlined";
import { LeaderboardStatus } from "../useWeekData";
import { formatUpdated } from "../../utils/updatedTime";
import LoadError from "../shared/LoadError";

// Deep trophy gold for text: 5.1:1 on white (DESIGN.md's #a87f12 was 3.7:1).
export const MONEY_GOLD = "#8a6a0f";

// Shown above the table only when the last refresh failed (or the page
// opened on this browser's saved copy and couldn't refresh it). A good
// refresh shows its time in the desktop table's header row instead, and
// nowhere on phones, so it never takes a row of its own.
export function RefreshFailedLine({
  leaderboardStatus,
  onRetry,
}: {
  leaderboardStatus: LeaderboardStatus;
  onRetry: () => void;
}) {
  const { updatedAt, failed } = leaderboardStatus;
  if (!failed || !updatedAt) return null;
  return (
    <Box
      role="status"
      sx={{
        display: "flex",
        alignItems: "center",
        flexWrap: "wrap",
        columnGap: 1,
        mb: 1,
        px: { xs: 0.5, sm: 2 },
        color: "text.secondary",
        fontSize: "0.75rem",
        textAlign: "left",
      }}
    >
      <Box component="span" sx={{ display: "inline-flex", gap: 0.5 }}>
        <ErrorOutlineIcon aria-hidden sx={{ fontSize: "0.9rem", mt: "1px" }} />
        {`Couldn't refresh. Showing ${formatUpdated(updatedAt)}, trying again every minute.`}
      </Box>
      <Button size="small" onClick={onRetry} sx={{ minHeight: 32 }}>
        Try now
      </Button>
    </Box>
  );
}

// What User Picks shows before there's a table: skeleton rows while the
// week loads, a retrying error when it can't, and an empty note when the
// week loaded with nobody in it. Never a blank tab.
export function StandingsPlaceholder({
  week,
  leaderboardStatus,
  onRetry,
}: {
  week: number;
  leaderboardStatus: LeaderboardStatus;
  onRetry: () => void;
}) {
  const { updatedAt, failed } = leaderboardStatus;

  if (failed) {
    return (
      <LoadError
        title={`Couldn't load the week ${week} standings.`}
        detail="Trying again every minute."
        onRetry={onRetry}
      />
    );
  }
  if (updatedAt) {
    return <LoadError title={`No standings for week ${week} yet.`} />;
  }

  return <StandingsSkeleton label={`Loading the week ${week} standings`} />;
}

// Placeholder standings rows, also the app's body while meta first loads
// (AppShellStatus), so User Picks looks the same through both loads.
export function StandingsSkeleton({
  label,
  animate = true,
}: {
  label: string;
  animate?: boolean;
}) {
  const animation = animate ? "pulse" : false;
  return (
    // Still and faded when nothing is loading, so they hold the page's
    // shape without reading as "loading".
    <Box
      role="status"
      aria-busy={animate}
      aria-label={label}
      sx={{ opacity: animate ? 1 : 0.45 }}
    >
      {Array.from({ length: 8 }, (_, i) => (
        <Box
          key={i}
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1.5,
            py: 1,
            px: { xs: 0.5, sm: 2 },
            borderBottom: 1,
            borderColor: "divider",
          }}
        >
          <Skeleton animation={animation} variant="text" width={20} />
          <Skeleton
            animation={animation}
            variant="circular"
            width={26}
            height={26}
          />
          <Skeleton
            animation={animation}
            variant="text"
            sx={{ flex: "0 1 10rem" }}
          />
          <Skeleton
            animation={animation}
            variant="rounded"
            height={24}
            sx={{ flex: "1 1 auto", maxWidth: 380, ml: "auto" }}
          />
        </Box>
      ))}
    </Box>
  );
}
