import { Box, Paper, Typography } from "@mui/material";
import { Fragment } from "react";
import { RecordTile } from "./recordsUtils";

type Props = {
  tiles: RecordTile[];
  userId: string;
};

export default function RecordTiles({ tiles, userId }: Props) {
  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
        gap: 1.5,
      }}
    >
      {tiles.map((tile) => (
        <Paper
          key={tile.label}
          variant="outlined"
          sx={{ p: 1.5, display: "flex", flexDirection: "column", gap: 0.25 }}
        >
          <Typography
            sx={{
              fontSize: "0.7rem",
              fontWeight: 700,
              letterSpacing: "0.07em",
              textTransform: "uppercase",
              color: "text.secondary",
            }}
          >
            {tile.label}
          </Typography>
          <Typography
            sx={{
              fontSize: "1.6rem",
              fontWeight: 800,
              lineHeight: 1.15,
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {tile.value}{" "}
            <Typography
              component="span"
              variant="body2"
              sx={{
                color: "text.secondary",
              }}
            >
              {tile.unit}
            </Typography>
          </Typography>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            {tile.holders.map((holder, i) => (
              <Fragment key={`${holder.text}-${i}`}>
                {i > 0 && ", "}
                {holder.text}
                {holder.userId !== undefined &&
                  String(holder.userId) === userId && (
                    <Box component="span" sx={{ color: "primary.main" }}>
                      {" "}
                      (you)
                    </Box>
                  )}
              </Fragment>
            ))}
          </Typography>
          {tile.detail && (
            <Typography
              variant="caption"
              sx={{
                color: "text.secondary",
              }}
            >
              {tile.detail}
            </Typography>
          )}
        </Paper>
      ))}
    </Box>
  );
}
