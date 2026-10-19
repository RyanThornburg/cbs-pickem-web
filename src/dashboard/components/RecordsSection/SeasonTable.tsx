import { Fragment, useMemo } from "react";
import {
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  useTheme,
} from "@mui/material";
import { HistoricalRecords } from "../../types";
import {
  buildSeasonRows,
  cleanName,
  closedSeasons,
  HALVES_FROM_SEASON,
  isUnknownChampion,
  seasonPeriods,
} from "./recordsUtils";
import { rowHoverSx, youRowSx } from "./recordsTheme";
import { Icon } from "../../ui/Icon";
import styles from "./SeasonTable.module.css";

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
  const periods = useMemo(() => seasonPeriods(data, year), [data, year]);
  const rows = useMemo(
    () =>
      season
        ? buildSeasonRows(
            season.standings,
            periods.map((p) => p.key)
          )
        : [],
    [season, periods]
  );
  const champion = data.champions.find((c) => c.year === year);
  const hasPeriods = periods.length > 0;
  const maxRank = Math.max(0, ...rows.map((r) => r.rank));
  const hasGaps = rows.some((r) => r.missingBefore > 0);
  const columnCount = 3 + periods.length;

  return (
    <div className={styles.stack}>
      {/* Wraps rather than scrolls, so every season is in view. */}
      <div role="group" aria-label="Season" className={styles.years}>
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
      </div>

      <div className={styles.summary}>
        <p className={styles.year}>{year}</p>
        <p className={styles.muted}>
          Champion{" "}
          {champion && !isUnknownChampion(champion) ? (
            <>
              <b className={styles.strong}>
                {champion.names.map(cleanName).join(", ")}
              </b>{" "}
              · {champion.score} pts
            </>
          ) : (
            <b className={styles.strong}>unknown</b>
          )}
        </p>
        <p className={styles.muted}>
          <b className={styles.strong}>{rows.length}</b>
          {rows.length < maxRank
            ? ` of ${maxRank} players on file`
            : " players"}
        </p>
      </div>

      {(season?.incomplete || hasGaps || !hasPeriods) && (
        <p className={styles.muted}>
          {season?.incomplete
            ? `${year} is missing some players, including the champion, so ranks skip where they would be.`
            : hasGaps
              ? `Some ${year} players aren't on file, so ranks skip where they would be.`
              : ""}
          {!hasPeriods &&
            `${season?.incomplete || hasGaps ? " " : ""}Half-season results start in ${HALVES_FROM_SEASON}.`}
        </p>
      )}

      <TableContainer sx={{ maxWidth: 520 + 100 * periods.length }}>
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
                  fontWeight: 700,
                  whiteSpace: "nowrap",
                },
              }}
            >
              <TableCell>Place</TableCell>
              <TableCell>Player</TableCell>
              <TableCell align="center">Score</TableCell>
              {periods.map((p) => (
                <TableCell key={p.key} align="center">
                  {p.name}
                </TableCell>
              ))}
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
                        <div className={styles.champion}>
                          <Icon name="EmojiEvents" className={styles.trophy} />
                          {row.rankLabel}
                        </div>
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
                    {periods.map((p) => {
                      const score = row.periods?.[p.key]?.score;
                      return (
                        <TableCell key={p.key} align="center" sx={youSx}>
                          {row.periodLabels[p.key] ?? dash}
                          {score != null && (
                            <span className={styles.periodScore}>
                              {" "}
                              ({score})
                            </span>
                          )}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                </Fragment>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </div>
  );
}
