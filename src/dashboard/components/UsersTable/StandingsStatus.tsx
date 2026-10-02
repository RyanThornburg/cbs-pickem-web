import Box from "@mui/material/Box";
import Skeleton from "@mui/material/Skeleton";
import Typography from "@mui/material/Typography";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutlineOutlined";
import { LeaderboardStatus } from "../useWeekData";

// Deep trophy gold for text: 5.1:1 on white (DESIGN.md's #a87f12 was 3.7:1).
export const MONEY_GOLD = "#8a6a0f";

export const timeFormat = new Intl.DateTimeFormat(undefined, {
  hour: "numeric",
  minute: "2-digit",
});

// Shown above the table only when the last refresh failed. A good refresh
// shows its time in the desktop table's header row instead, and nowhere on
// phones, so it never takes a row of its own.
export function RefreshFailedLine({
  leaderboardStatus,
}: {
  leaderboardStatus: LeaderboardStatus;
}) {
  const { updatedAt, failed } = leaderboardStatus;
  if (!failed || !updatedAt) return null;
  return (
    <Typography
      variant="caption"
      role="status"
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 0.5,
        mb: 1,
        px: { xs: 0.5, sm: 2 },
        color: "text.secondary",
        textAlign: "left",
      }}
    >
      <ErrorOutlineIcon aria-hidden sx={{ fontSize: "0.9rem" }} />
      {`Couldn't refresh. Showing ${timeFormat.format(updatedAt)}, trying again every minute.`}
    </Typography>
  );
}

// What User Picks shows before there's a table: skeleton rows while the
// week loads, a retrying error when it can't, and an empty note when the
// week loaded with nobody in it. Never a blank tab.
export function StandingsPlaceholder({
  week,
  leaderboardStatus,
}: {
  week: number;
  leaderboardStatus: LeaderboardStatus;
}) {
  const { updatedAt, failed } = leaderboardStatus;

  if (failed || updatedAt) {
    return (
      <Box
        role="status"
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1,
          p: 2,
          border: 1,
          borderColor: "divider",
          borderRadius: 2,
          textAlign: "left",
        }}
      >
        {failed && (
          <ErrorOutlineIcon aria-hidden sx={{ color: "text.secondary" }} />
        )}
        <Typography variant="body2">
          {failed
            ? `Couldn't load the week ${week} standings. Trying again every minute.`
            : `No standings for week ${week} yet.`}
        </Typography>
      </Box>
    );
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
