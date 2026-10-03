import Button from "@mui/material/Button";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import { META_RETRY_INTERVAL_MS, MetaStatus } from "./CurrentWeekContext";
import TabSkeleton, { TabSkeletonShape } from "./TabSkeleton";
import LoadError from "./shared/LoadError";

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
        <LoadError
          title="Can't reach the pool data right now."
          detail={`Trying again every ${META_RETRY_INTERVAL_MS / 1000} seconds.`}
          onRetry={onRetry}
          sx={{ mb: 2 }}
          actions={
            cbsPoolUrl && (
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
            )
          }
        />
      )}
      <TabSkeleton
        shape={shape}
        label={failed ? "Pool data unavailable" : "Loading the pool"}
        animate={!failed}
      />
    </>
  );
}
