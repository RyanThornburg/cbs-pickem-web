import Box from "@mui/material/Box";
import { MONEY_GOLD } from "./StandingsStatus";
import { selectedRowSx } from "./selectedRowSx";

// Deep trophy gold: the prize color, dark enough for 12px text (5.1:1).
const PAID_GOLD = MONEY_GOLD;

// The dashed "paid" line under the last paid place, in User Picks and the
// first-half leader card. Its label names the prize and any tie. Below md,
// where the header has no room for money lines, `note` says how far back
// the selected player is ("you're 3 pts back"), right on the line it's
// measured against.
export function PaidLineRule({
  label,
  note,
}: {
  label: string;
  note?: string;
}) {
  return (
    <>
      <Box
        role="separator"
        aria-label={label}
        sx={{
          position: "relative",
          borderTop: `1.5px dashed ${PAID_GOLD}`,
          my: 1.25,
        }}
      >
        <Box
          component="span"
          aria-hidden
          sx={{
            position: "absolute",
            right: 0,
            top: -10,
            pl: 1,
            bgcolor: "background.paper",
            color: PAID_GOLD,
            fontSize: "0.75rem",
            fontWeight: 600,
            lineHeight: "20px",
            whiteSpace: "nowrap",
          }}
        >
          {label}
        </Box>
      </Box>
      {note && (
        <Box
          sx={{
            display: { xs: "flex", md: "none" },
            justifyContent: "flex-end",
            mt: -0.25,
            mb: 1,
          }}
        >
          <Box
            component="span"
            // The selected row's highlight: it's about that row's player.
            sx={[
              {
                borderRadius: 1,
                px: 0.75,
                fontSize: "0.75rem",
                fontWeight: 600,
                lineHeight: "20px",
                color: "text.primary",
              },
              selectedRowSx,
            ]}
          >
            {note}
          </Box>
        </Box>
      )}
    </>
  );
}
