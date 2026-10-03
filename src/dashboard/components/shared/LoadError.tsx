import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutlineOutlined";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import { ReactNode } from "react";

// The one way a tab says it couldn't load something: a quiet bordered box
// (not an orange alert; nothing the viewer did is wrong) with what failed,
// when it tries again on its own, and a Try now button. With no `onRetry`
// it's a plain note for things that aren't there at all ("There's no team
// at …"), in the same box.
export default function LoadError({
  title,
  detail,
  onRetry,
  actions,
  sx,
}: {
  title: ReactNode;
  // The automatic retry, e.g. "Trying again every minute."
  detail?: ReactNode;
  onRetry?: () => void;
  // Extra buttons before Try now (the app shell's "Pool on CBS").
  actions?: ReactNode;
  sx?: object;
}) {
  const Icon = onRetry ? ErrorOutlineIcon : InfoOutlinedIcon;
  return (
    <Box
      role={onRetry ? "alert" : "status"}
      sx={{
        display: "flex",
        alignItems: "center",
        flexWrap: "wrap",
        columnGap: 1.5,
        rowGap: 1,
        p: 2,
        border: 1,
        borderColor: "divider",
        borderRadius: 2,
        bgcolor: "background.paper",
        textAlign: "left",
        ...sx,
      }}
    >
      <Icon aria-hidden sx={{ color: "text.secondary" }} />
      <Box sx={{ flex: "1 1 14rem", minWidth: 0 }}>
        <Typography variant="body2" sx={{ fontWeight: 600 }}>
          {title}
        </Typography>
        {detail && (
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            {detail}
          </Typography>
        )}
      </Box>
      {(actions || onRetry) && (
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
          {actions}
          {onRetry && (
            <Button
              variant="outlined"
              size="small"
              onClick={onRetry}
              sx={{ minHeight: 36 }}
            >
              Try now
            </Button>
          )}
        </Box>
      )}
    </Box>
  );
}
