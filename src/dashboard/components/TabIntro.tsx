import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import HistoryIcon from "@mui/icons-material/History";
import { createContext, ReactNode, Ref, useContext } from "react";
import { useTabActive } from "./tabLinks";

// Set by MainGrid while a past week is browsed. Weekly tabs' intro rows
// then say so, with the way back, in place of a separate notice. `noticeRef`
// goes on the shown tab's marker, so MainGrid can tell when it scrolls away
// (phones then show the same marker on the tab bar).
export interface PastWeekInfo {
  currentWeek: number;
  onBack: () => void;
  noticeRef: Ref<HTMLDivElement>;
}
export const PastWeekContext = createContext<PastWeekInfo | null>(null);

// The first row of every tab: its name (and week, on weekly tabs) as the
// page heading, a past-week marker when one is browsed, an optional quiet
// note (e.g. when odds last updated), and the tab's own controls on the
// right. One shape everywhere, so each tab starts the same way under the
// tab row.
export default function TabIntro({
  title,
  week,
  weekly = week != null,
  meta,
  actions,
}: {
  title: string;
  week?: number;
  // A weekly tab that doesn't put the week in its title (Trends, whose
  // switch names it) still gets the past-week marker.
  weekly?: boolean;
  meta?: ReactNode;
  actions?: ReactNode;
}) {
  const pastWeek = useContext(PastWeekContext);
  const active = useTabActive();
  const showPast = weekly && pastWeek !== null;

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
          rowGap: 0.5,
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
        {showPast && (
          <Box
            ref={active ? pastWeek.noticeRef : undefined}
            sx={{
              alignSelf: "center",
              display: "flex",
              alignItems: "center",
              gap: 0.5,
            }}
          >
            <Box
              component="span"
              sx={{
                display: "inline-flex",
                alignItems: "center",
                gap: 0.5,
                px: 1,
                py: 0.25,
                borderRadius: 999,
                // DESIGN.md slate-100: a quiet tone, not a warning.
                bgcolor: "hsl(220, 30%, 94%)",
                color: "text.secondary",
                fontSize: "0.75rem",
                fontWeight: 600,
              }}
            >
              <HistoryIcon aria-hidden sx={{ fontSize: "0.95rem" }} />
              Past week
            </Box>
            <Button
              size="small"
              onClick={pastWeek.onBack}
              sx={{ minHeight: 36 }}
            >
              Back to week {pastWeek.currentWeek}
            </Button>
          </Box>
        )}
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
