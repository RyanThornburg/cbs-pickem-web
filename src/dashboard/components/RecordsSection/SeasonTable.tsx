import { Fragment, useMemo } from "react";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import {
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
import { GOLD, rowHoverSx, youRowSx } from "./recordsTheme";

type Props = {
  data: HistoricalRecords;
  year: number;
  onYearChange: (year: number) => void;
  userId: string;
};

const dash = "–";

export default function SeasonTable({
  data,
  year,
  onYearChange,
  userId,
}: Props) {
  const theme = useTheme();
  const years = closedSeasons(data);
  const season = data.years[String(year)];
  const rows = useMemo(
    () => (season ? buildSeasonRows(season.standings) : []),
    [season]
  );
  const champion = data.champions.find((c) => c.year === year);
  const halves = year >= HALVES_FROM_SEASON;
  const maxRank = Math.max(0, ...rows.map((r) => r.rank));
  const hasGaps = rows.some((r) => r.missingBefore > 0);
  const columnCount = halves ? 5 : 3;

  return (
    <Stack spacing={1.5}>
      {/* Wraps rather than scrolls, so every season is in view. */}
      <Box
        role="group"
        aria-label="Season"
        sx={{ display: "flex", flexWrap: "wrap", gap: 0.75 }}
      >
        {[...years].reverse().map((y) => (
          <Chip
            key={y}
            label={y}
            size="small"
            clickable
            aria-pressed={y === year}
            variant={y === year ? "filled" : "outlined"}
            onClick={() => onYearChange(y)}
            sx={{
              height: 28,
              fontVariantNumeric: "tabular-nums",
              // Selected like the phone tab bar's pill: slate, not blue
              // (blue means "open" and "you").
              ...(y === year && {
                bgcolor: "hsl(220, 20%, 88%)",
                color: "text.primary",
                fontWeight: 700,
                "&:hover": { bgcolor: "hsl(220, 20%, 84%)" },
              }),
              // Seasons missing players get a dashed edge, but not once
              // selected (a dashed filled chip looks broken).
              ...(data.years[String(y)]?.incomplete &&
                y !== year && { borderStyle: "dashed" }),
            }}
          />
        ))}
      </Box>

      <Stack
        direction="row"
        sx={{ flexWrap: "wrap", columnGap: 2.5, rowGap: 0.5 }}
      >
        <Typography variant="body2" sx={{ fontWeight: 700 }}>
          {year}
        </Typography>
        <Typography
          variant="body2"
          sx={{
            color: "text.secondary",
          }}
        >
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
        <Typography
          variant="body2"
          sx={{
            color: "text.secondary",
          }}
        >
          <Box component="b" sx={{ color: "text.primary" }}>
            {rows.length}
          </Box>
          {rows.length < maxRank
            ? ` of ${maxRank} players on file`
            : " players"}
        </Typography>
      </Stack>

      {(season?.incomplete || hasGaps || !halves) && (
        <Typography variant="body2" sx={{ color: "text.secondary" }}>
          {season?.incomplete
            ? `${year} is missing some players, including the champion, so ranks skip where they would be.`
            : hasGaps
              ? `Some ${year} players aren't on file, so ranks skip where they would be.`
              : ""}
          {!halves &&
            `${season?.incomplete || hasGaps ? " " : ""}Half-season results start in ${HALVES_FROM_SEASON}.`}
        </Typography>
      )}

      <TableContainer sx={{ maxWidth: halves ? 720 : 520 }}>
        <Table
          size="small"
          aria-label={`${year} standings`}
          sx={{ "& td, & th": { fontVariantNumeric: "tabular-nums" } }}
        >
          <TableHead>
            <TableRow
              sx={{
                "& th": {
                  fontSize: "0.75rem",
                  fontWeight: "bold",
                  whiteSpace: "nowrap",
                },
              }}
            >
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
                        sx={{
                          py: 0.25,
                          bgcolor: "background.default",
                          color: "text.secondary",
                          fontSize: "0.75rem",
                        }}
                      >
                        {row.missingBefore}{" "}
                        {row.missingBefore === 1 ? "player" : "players"} not on
                        file
                      </TableCell>
                    </TableRow>
                  )}
                  <TableRow hover sx={rowHoverSx}>
                    <TableCell
                      sx={{
                        ...youSx,
                        whiteSpace: "nowrap",
                        ...(isYou && {
                          boxShadow: `inset 3px 0 0 ${theme.palette.primary.main}`,
                        }),
                      }}
                    >
                      {row.rank === 1 ? (
                        <Box
                          sx={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 0.5,
                            fontWeight: 600,
                          }}
                        >
                          <EmojiEventsIcon
                            sx={{ fontSize: "1rem" }}
                            htmlColor={GOLD}
                          />
                          {row.rankLabel}
                        </Box>
                      ) : (
                        row.rankLabel
                      )}
                    </TableCell>
                    <TableCell
                      component="th"
                      scope="row"
                      sx={{ ...youSx, fontWeight: 500, whiteSpace: "nowrap" }}
                    >
                      {row.name}
                    </TableCell>
                    <TableCell align="center" sx={youSx}>
                      {row.score}
                    </TableCell>
                    {halves && (
                      <TableCell align="center" sx={youSx}>
                        {row.firstHalfLabel ?? dash}
                        {row.first_half_score != null && (
                          <Typography
                            component="span"
                            variant="caption"
                            sx={{
                              color: "text.secondary",
                            }}
                          >
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
                          <Typography
                            component="span"
                            variant="caption"
                            sx={{
                              color: "text.secondary",
                            }}
                          >
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
