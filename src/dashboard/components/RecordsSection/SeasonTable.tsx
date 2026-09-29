import { Fragment, useMemo } from "react";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import {
  Alert,
  Box,
  Chip,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  useTheme,
} from "@mui/material";
import { HistoricalRecords } from "../../types";
import {
  buildSeasonRows,
  cleanName,
  closedSeasons,
  HALVES_FROM_SEASON,
  isUnknownChampion,
} from "./recordsUtils";
import { GOLD, youRowSx } from "./recordsTheme";

type Props = {
  data: HistoricalRecords;
  year: number;
  onYearChange: (year: number) => void;
  userId: string;
};

const dash = "–";

export default function SeasonTable({ data, year, onYearChange, userId }: Props) {
  const theme = useTheme();
  const years = closedSeasons(data);
  const season = data.years[String(year)];
  const rows = useMemo(() => (season ? buildSeasonRows(season.standings) : []), [season]);
  const champion = data.champions.find((c) => c.year === year);
  const halves = year >= HALVES_FROM_SEASON;
  const maxRank = Math.max(0, ...rows.map((r) => r.rank));
  const hasGaps = rows.some((r) => r.missingBefore > 0);
  const columnCount = halves ? 5 : 3;

  return (
    <Stack spacing={1.5}>
      <Box sx={{ display: "flex", gap: 0.75, overflowX: "auto", pb: 0.5 }}>
        {[...years].reverse().map((y) => (
          <Chip
            key={y}
            label={y}
            size="small"
            clickable
            color={y === year ? "primary" : "default"}
            variant={y === year ? "filled" : "outlined"}
            onClick={() => onYearChange(y)}
            sx={data.years[String(y)]?.incomplete ? { borderStyle: "dashed" } : undefined}
          />
        ))}
      </Box>

      <Stack direction="row" sx={{ flexWrap: "wrap", columnGap: 2.5, rowGap: 0.5 }}>
        <Typography variant="body2" sx={{ fontWeight: 700 }}>
          {year}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Champion{" "}
          {champion && !isUnknownChampion(champion) ? (
            <>
              <Box component="b" sx={{ color: "text.primary" }}>
                {champion.names.map(cleanName).join(", ")}
              </Box>{" "}
              · {champion.score} pts
            </>
          ) : (
            <Box component="b" sx={{ color: "text.primary" }}>
              unknown
            </Box>
          )}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          <Box component="b" sx={{ color: "text.primary" }}>
            {rows.length}
          </Box>{" "}
          players on record{rows.length < maxRank ? `, ranks go to ${maxRank}` : ""}
        </Typography>
      </Stack>

      {season?.incomplete ? (
        <Alert severity="warning" variant="outlined">
          {year} is incomplete: the champion and some players are missing.
        </Alert>
      ) : (
        hasGaps && (
          <Typography variant="caption" color="text.secondary">
            Some {year} players aren't on file, so ranks skip where they would be.
          </Typography>
        )
      )}

      <TableContainer>
        <Table size="small" sx={{ "& td, & th": { fontVariantNumeric: "tabular-nums" } }}>
          <TableHead>
            <TableRow sx={{ "& th": { fontSize: "0.75rem", fontWeight: "bold", whiteSpace: "nowrap" } }}>
              <TableCell>Place</TableCell>
              <TableCell>Player</TableCell>
              <TableCell align="center">Score</TableCell>
              {halves && <TableCell align="center">1st half</TableCell>}
              {halves && <TableCell align="center">2nd half</TableCell>}
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((row) => {
              const isYou = String(row.user_id) === userId;
              const youSx = isYou ? youRowSx : {};
              return (
                <Fragment key={row.user_id}>
                  {row.missingBefore > 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={columnCount}
                        align="center"
                        sx={{ py: 0.25, bgcolor: "background.default", color: "text.disabled", fontSize: "0.7rem" }}
                      >
                        {row.missingBefore} {row.missingBefore === 1 ? "player" : "players"} not on file
                      </TableCell>
                    </TableRow>
                  )}
                  <TableRow hover>
                    <TableCell
                      sx={{
                        ...youSx,
                        whiteSpace: "nowrap",
                        ...(isYou && { boxShadow: `inset 3px 0 0 ${theme.palette.primary.main}` }),
                      }}
                    >
                      {row.rank === 1 ? (
                        <Box sx={{ display: "inline-flex", alignItems: "center", gap: 0.5, fontWeight: 600 }}>
                          <EmojiEventsIcon sx={{ fontSize: "1rem" }} htmlColor={GOLD} />
                          {row.rankLabel}
                        </Box>
                      ) : (
                        row.rankLabel
                      )}
                    </TableCell>
                    <TableCell sx={{ ...youSx, fontWeight: 500, whiteSpace: "nowrap" }}>{row.name}</TableCell>
                    <TableCell align="center" sx={youSx}>
                      {row.score}
                    </TableCell>
                    {halves && (
                      <TableCell align="center" sx={youSx}>
                        {row.firstHalfLabel ?? dash}
                        {row.first_half_score != null && (
                          <Typography component="span" variant="caption" color="text.secondary">
                            {" "}
                            ({row.first_half_score})
                          </Typography>
                        )}
                      </TableCell>
                    )}
                    {halves && (
                      <TableCell align="center" sx={youSx}>
                        {row.secondHalfLabel ?? dash}
                        {row.second_half_score != null && (
                          <Typography component="span" variant="caption" color="text.secondary">
                            {" "}
                            ({row.second_half_score})
                          </Typography>
                        )}
                      </TableCell>
                    )}
                  </TableRow>
                </Fragment>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </Stack>
  );
}
