import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { MEDAL } from "../Leaders/medals";

// 1st-3rd get the same gold/silver/bronze medals as the leader cards; every
// other place is a plain number. Who's paid is shown by the paid lines in
// the table, not by the marker's color.
export function PlaceCell({ place }: { place: number | null | undefined }) {
  if (place == null) return null;
  const medal = MEDAL[place];
  if (!medal) return <Typography variant="body2">{place}</Typography>;
  return (
    <Box
      component="span"
      sx={{
        width: 24,
        height: 24,
        borderRadius: "50%",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "0.75rem",
        fontWeight: 700,
        bgcolor: medal.bg,
        color: medal.fg,
      }}
    >
      {place}
    </Box>
  );
}
