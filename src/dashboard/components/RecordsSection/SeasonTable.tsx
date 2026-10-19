import { Fragment, useMemo } from "react";
import { HistoricalRecords } from "../../types";
import {
  buildSeasonRows,
  cleanName,
  closedSeasons,
  HALVES_FROM_SEASON,
  isUnknownChampion,
  seasonPeriods,
} from "./recordsUtils";
import { Chip } from "../../ui/Chip";
import { Icon } from "../../ui/Icon";
import table from "../../ui/table.module.css";
import shared from "./recordsTable.module.css";
import styles from "./SeasonTable.module.css";

type Props = {
  data: HistoricalRecords;
  year: number;
  onYearChange: (year: number) => void;
  userId: string;
};

const dash = "–";

const cx = (...names: (string | false | undefined)[]) =>
  names.filter(Boolean).join(" ");

const headCell = cx(
  table.cell,
  table.small,
  table.head,
  shared.headCell,
  shared.nowrap
);

export default function SeasonTable({
  data,
  year,
  onYearChange,
  userId,
}: Props) {
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
            pressed={y === year}
            variant={y === year ? "filled" : "outlined"}
            onClick={() => onYearChange(y)}
            className={cx(
              styles.yearChip,
              // Selected like the phone tab bar's pill: slate, not blue
              // (blue means "open" and "you").
              y === year && styles.selected,
              // Seasons missing players get a dashed edge, but not once
              // selected (a dashed filled chip looks broken).
              data.years[String(y)]?.incomplete && y !== year && styles.dashed
            )}
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

      <div
        className={table.container}
        style={{ maxWidth: 520 + 100 * periods.length }}
      >
        <table
          aria-label={`${year} standings`}
          className={cx(table.table, shared.tabular)}
        >
          <thead>
            <tr>
              <th scope="col" className={headCell}>
                Place
              </th>
              <th scope="col" className={headCell}>
                Player
              </th>
              <th scope="col" className={cx(headCell, table.center)}>
                Score
              </th>
              {periods.map((p) => (
                <th
                  key={p.key}
                  scope="col"
                  className={cx(headCell, table.center)}
                >
                  {p.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const isYou = String(row.user_id) === userId;
              const bodyCell = cx(table.cell, table.small, isYou && shared.you);
              return (
                <Fragment key={row.user_id}>
                  {row.missingBefore > 0 && (
                    <tr>
                      <td
                        colSpan={columnCount}
                        className={cx(
                          table.cell,
                          table.small,
                          table.center,
                          styles.missing
                        )}
                      >
                        {row.missingBefore}{" "}
                        {row.missingBefore === 1 ? "player" : "players"} not on
                        file
                      </td>
                    </tr>
                  )}
                  <tr className={cx(table.hover, shared.rowHover)}>
                    <td
                      className={cx(
                        bodyCell,
                        shared.nowrap,
                        isYou && shared.youEdge
                      )}
                    >
                      {row.rank === 1 ? (
                        <div className={styles.champion}>
                          <Icon name="EmojiEvents" className={styles.trophy} />
                          {row.rankLabel}
                        </div>
                      ) : (
                        row.rankLabel
                      )}
                    </td>
                    <th
                      scope="row"
                      className={cx(bodyCell, styles.name, shared.nowrap)}
                    >
                      {row.name}
                    </th>
                    <td className={cx(bodyCell, table.center)}>{row.score}</td>
                    {periods.map((p) => {
                      const score = row.periods?.[p.key]?.score;
                      return (
                        <td key={p.key} className={cx(bodyCell, table.center)}>
                          {row.periodLabels[p.key] ?? dash}
                          {score != null && (
                            <span className={styles.periodScore}>
                              {" "}
                              ({score})
                            </span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
