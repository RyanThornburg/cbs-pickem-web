import { useState } from "react";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import Popover from "@mui/material/Popover";
import Typography from "@mui/material/Typography";
import HelpOutlineIcon from "@mui/icons-material/HelpOutlineOutlined";
import { useCurrentWeek } from "../CurrentWeekContext";
import { MONEY_GOLD } from "./StandingsStatus";

// How scoring and the three prizes work, opened from the "?" on each paid
// line. Places and the second-half start come from meta, so the text follows
// the season's settings. CBS lines are always half points, so there are no
// pushes to explain.
export function PrizesHelp() {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const { paidPlaces, secondHalfStartWeek } = useCurrentWeek();
  const lastFirstHalfWeek = secondHalfStartWeek - 1;

  const prizes = [
    ["Overall", "the whole season", paidPlaces.overall],
    ["1st half", `weeks 1–${lastFirstHalfWeek}`, paidPlaces.first_half],
    ["2nd half", `week ${secondHalfStartWeek} on`, paidPlaces.second_half],
  ] as const;

  return (
    <>
      <IconButton
        size="small"
        aria-label="How prizes work"
        aria-haspopup="dialog"
        aria-expanded={Boolean(anchor)}
        onClick={(event) => setAnchor(event.currentTarget)}
        sx={{ width: 24, height: 24, my: -0.5, color: MONEY_GOLD }}
      >
        <HelpOutlineIcon sx={{ fontSize: "1rem" }} />
      </IconButton>
      <Popover
        open={Boolean(anchor)}
        anchorEl={anchor}
        onClose={() => setAnchor(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        slotProps={{
          paper: {
            role: "dialog",
            "aria-label": "How prizes work",
            sx: {
              p: 2,
              width: 320,
              maxWidth: "calc(100vw - 32px)",
              textAlign: "left",
            },
          },
        }}
      >
        <Typography component="h4" sx={{ fontWeight: 600, mb: 1 }}>
          How prizes work
        </Typography>
        <Typography variant="body2" sx={{ mb: 1.5 }}>
          Every pick that covers the CBS line is 1 point.
        </Typography>
        <Box
          component="dl"
          sx={{
            display: "grid",
            gridTemplateColumns: "auto 1fr",
            columnGap: 1.5,
            rowGap: 0.5,
            m: 0,
            fontSize: "0.875rem",
          }}
        >
          {prizes.map(([name, span, places]) => (
            <Box key={name} sx={{ display: "contents" }}>
              <Box component="dt" sx={{ fontWeight: 600 }}>
                {name}
              </Box>
              <Box component="dd" sx={{ m: 0, color: "text.secondary" }}>
                {span} · top {places} paid
              </Box>
            </Box>
          ))}
        </Box>
        <Typography variant="body2" sx={{ mt: 1.5, color: "text.secondary" }}>
          The dashed lines mark the last paid place. Players tied at a paid
          place split its prize.
        </Typography>
      </Popover>
    </>
  );
}
