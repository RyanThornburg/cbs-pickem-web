import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { ReactNode } from "react";

// The first row of every tab: its name (and week, on weekly tabs) as the
// page heading, an optional quiet note beside it (e.g. when odds last
// updated), and the tab's own controls on the right. One shape everywhere,
// so each tab starts the same way under the tab row.
export default function TabIntro({
  title,
  week,
  meta,
  actions,
}: {
  title: string;
  week?: number;
  meta?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        flexWrap: "wrap",
        columnGap: 2,
        rowGap: 1,
        // Room for the controls' 40px height, so a tab without any lines
        // up with one that has them.
        minHeight: 40,
        mb: 2,
        textAlign: "left",
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "baseline",
          flexWrap: "wrap",
          columnGap: 1.5,
          rowGap: 0.25,
          minWidth: 0,
        }}
      >
        <Typography
          component="h2"
          sx={{ fontSize: "1.125rem", fontWeight: 600, lineHeight: 1.3 }}
        >
          {title}
          {week != null && (
            <Box
              component="span"
              sx={{ color: "text.secondary", fontWeight: 500 }}
            >
              {" · "}Week {week}
            </Box>
          )}
        </Typography>
        {meta && (
          <Typography
            variant="caption"
            sx={{ color: "text.secondary", fontSize: "0.75rem" }}
          >
            {meta}
          </Typography>
        )}
      </Box>
      {actions && (
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            flexWrap: "wrap",
            columnGap: 2,
            rowGap: 1,
            ml: "auto",
          }}
        >
          {actions}
        </Box>
      )}
    </Box>
  );
}
