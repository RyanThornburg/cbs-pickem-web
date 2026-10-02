import Box from "@mui/material/Box";
import { GameHighlight } from "../../utils/scoreboardUtils";

const Flag = ({
  label,
  kind,
}: {
  label: string;
  kind: "close" | "redZone";
}) => (
  <Box
    component="span"
    sx={{
      fontSize: "0.75rem",
      fontWeight: 700,
      px: "6px",
      py: "3px",
      borderRadius: "4px",
      lineHeight: 1,
      whiteSpace: "nowrap",
      bgcolor: kind === "close" ? "warning.main" : "error.main",
      color: kind === "close" ? "#1b1300" : "#fff",
    }}
  >
    {label}
  </Box>
);

export const HighlightFlags = ({ highlight }: { highlight: GameHighlight }) => (
  <>
    {highlight.ending ? (
      <Flag label="Close, ending" kind="close" />
    ) : highlight.close ? (
      <Flag label="Close" kind="close" />
    ) : null}
    {highlight.redZone && <Flag label="Red zone" kind="redZone" />}
  </>
);
