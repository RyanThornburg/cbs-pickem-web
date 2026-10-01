import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutlineOutlined";
import { META_RETRY_INTERVAL_MS, MetaStatus } from "./CurrentWeekContext";
import { StandingsSkeleton } from "./UsersTable/StandingsStatus";

// The page body until /api/meta first arrives: every tab needs the season
// and week from it. Skeleton rows while it loads, then a retrying error, so
// the header and tabs are never sitting over a blank page.
export default function AppShellStatus({
  metaStatus,
  onRetry,
}: {
  metaStatus: Exclude<MetaStatus, "ready">;
  onRetry: () => void;
}) {
  if (metaStatus === "failed") {
    return (
      <Box
        role="alert"
        sx={{
          display: "flex",
          alignItems: "center",
          flexWrap: "wrap",
          columnGap: 1.5,
          rowGap: 1,
          mt: 2,
          p: 2,
          border: 1,
          borderColor: "divider",
          borderRadius: 2,
          textAlign: "left",
        }}
      >
        <ErrorOutlineIcon aria-hidden sx={{ color: "text.secondary" }} />
        <Box sx={{ flex: "1 1 14rem", minWidth: 0 }}>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            Can't reach the pool data right now.
          </Typography>
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            {`Trying again every ${META_RETRY_INTERVAL_MS / 1000} seconds.`}
          </Typography>
        </Box>
        <Button variant="outlined" size="small" onClick={onRetry}>
          Try now
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ mt: 2 }}>
      <StandingsSkeleton label="Loading the pool" />
    </Box>
  );
}
