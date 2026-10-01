import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutlineOutlined";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import { META_RETRY_INTERVAL_MS, MetaStatus } from "./CurrentWeekContext";
import TabSkeleton, { TabSkeletonShape } from "./TabSkeleton";

// The page body until /api/meta first arrives: every tab needs the season
// and week from it. A placeholder shaped like the tab while it loads; if it
// fails, a retrying error above still placeholders, with the CBS pool one
// tap away (from the last visit's meta, when there was one).
export default function AppShellStatus({
  metaStatus,
  onRetry,
  shape,
  cbsPoolUrl,
}: {
  metaStatus: Exclude<MetaStatus, "ready">;
  onRetry: () => void;
  shape: TabSkeletonShape;
  cbsPoolUrl: string | null;
}) {
  const failed = metaStatus === "failed";
  return (
    <>
      {failed && (
        <Box
          role="alert"
          sx={{
            display: "flex",
            alignItems: "center",
            flexWrap: "wrap",
            columnGap: 1.5,
            rowGap: 1,
            mb: 2,
            p: 2,
            border: 1,
            borderColor: "divider",
            borderRadius: 2,
            bgcolor: "background.paper",
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
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
            {cbsPoolUrl && (
              <Button
                size="small"
                href={cbsPoolUrl}
                target="_blank"
                rel="noopener noreferrer"
                endIcon={<OpenInNewIcon />}
                sx={{ minHeight: 36 }}
              >
                Pool on CBS
              </Button>
            )}
            <Button
              variant="outlined"
              size="small"
              onClick={onRetry}
              sx={{ minHeight: 36 }}
            >
              Try now
            </Button>
          </Box>
        </Box>
      )}
      <TabSkeleton
        shape={shape}
        label={failed ? "Pool data unavailable" : "Loading the pool"}
        animate={!failed}
      />
    </>
  );
}
