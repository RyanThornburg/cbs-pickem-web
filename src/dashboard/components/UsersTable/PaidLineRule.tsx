import Box from "@mui/material/Box";
import { MONEY_GOLD } from "./StandingsStatus";

// Deep trophy gold: the prize color, dark enough for 12px text (5.1:1).
const PAID_GOLD = MONEY_GOLD;

// The dashed "paid" line under the last paid place, in User Picks and the
// first-half leader card. Its label names the prize and any tie.
export function PaidLineRule({ label }: { label: string }) {
  return (
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
  );
}
