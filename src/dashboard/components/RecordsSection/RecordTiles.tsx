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
        // Six tiles: 2 rows of 3 from md, 3 rows of 2 below.
        gridTemplateColumns: {
          xs: "repeat(2, minmax(0, 1fr))",
          md: "repeat(3, minmax(0, 1fr))",
        },
        gap: 1,
      }}
    >
      {tiles.map((tile) => (
        <Paper
          key={tile.label}
          variant="outlined"
          sx={{
            p: 1.5,
            display: "flex",
            flexDirection: "column",
            gap: 0.25,
            minWidth: 0,
          }}
        >
          <Typography
            sx={{
              fontSize: "0.75rem",
              fontWeight: 600,
              color: "text.secondary",
            }}
          >
            {tile.label}
          </Typography>
          <Typography
            sx={{
              fontSize: "1.75rem",
              fontWeight: 700,
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
                    <Box component="span" sx={{ fontWeight: 700 }}>
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
