import { useLayoutEffect, useMemo, useRef, useState } from "react";
import { HistoricalRecords } from "../../types";
import { Tooltip } from "../../ui/Tooltip";
import table from "../../ui/table.module.css";
import uiStyles from "../../ui/ui.module.css";
import { useMediaQuery } from "../../ui/useMediaQuery";
import { ordinal } from "../../helper";
import {
  byAllTimeRank,
  CareerRow,
  closedSeasons,
  FinishTier,
  finishTier,
} from "./recordsUtils";
import shared from "./recordsTable.module.css";
import styles from "./FinishesGrid.module.css";

type Props = {
  data: HistoricalRecords;
  rows: CareerRow[];
  userId: string;
};

const cx = (...names: (string | false | undefined)[]) =>
  names.filter(Boolean).join(" ");

const TIERS: FinishTier[] = [1, 2, 3, 4, 5, 6];
const SAMPLE_RANK: Record<FinishTier, number> = {
  1: 1,
  2: 2,
  3: 3,
  4: 4,
  5: 7,
  6: 14,
};

// Each tier's look (FinishesGrid.module.css), shared by the legend and the
// grid.
const TIER_CLASS: Record<FinishTier, string> = {
  1: styles.tier1,
  2: styles.tier2,
  3: styles.tier3,
  4: styles.tier4,
  5: styles.tier5,
  6: styles.tier6,
};

const FINISH_TIER_LABELS: Record<FinishTier, string> = {
  1: "Champion",
  2: "2nd",
  3: "3rd",
  4: "4th–5th",
  5: "6th–10th",
  6: "11th and below",
};

// The legend draws each tier the way the grid does.
const Sample = ({ tier }: { tier: FinishTier }) => (
  <span aria-hidden className={cx(styles.sample, TIER_CLASS[tier])}>
    {SAMPLE_RANK[tier]}
  </span>
);

// Every player's finish in every season, players in all-time order (fixed,
// whatever the All-time table is sorted by). Opens scrolled to the newest
// seasons, so phones see this year's players first. Tapping a finish shows
// its score in the line above the grid.
export default function FinishesGrid({ data, rows, userId }: Props) {
  const years = closedSeasons(data);
  const incomplete = (year: number) => data.years[String(year)]?.incomplete;
  const ordered = useMemo(() => [...rows].sort(byAllTimeRank), [rows]);
  const [detail, setDetail] = useState<string | null>(null);
  const canHover = useMediaQuery("(hover: hover)");

  const scroller = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const el = scroller.current;
    if (el) el.scrollLeft = el.scrollWidth;
  }, []);

  return (
    <div className={styles.stack}>
      <div className={styles.legend}>
        {TIERS.map((tier) => (
          <div key={tier} className={styles.legendItem}>
            <Sample tier={tier} />
            <span className={styles.caption}>{FINISH_TIER_LABELS[tier]}</span>
          </div>
        ))}
        <div className={styles.legendItem}>
          <span aria-hidden className={styles.hatch} />
          <span className={styles.caption}>Missing some players</span>
        </div>
      </div>

      <p aria-live="polite" className={styles.detail}>
        {detail ??
          `Players in all-time order. ${canHover ? "Hover over" : "Tap"} a finish for its score.`}
      </p>

      <div
        ref={scroller}
        tabIndex={0}
        role="region"
        aria-label="Finishes by year, scrolls sideways"
        className={cx(table.container, styles.scroller)}
      >
        <table
          aria-label="Each player's finish by season"
          className={cx(table.table, styles.grid)}
        >
          <thead>
            <tr>
              <th
                scope="col"
                className={cx(
                  table.cell,
                  table.small,
                  table.head,
                  styles.head,
                  shared.sticky,
                  shared.stickyHead,
                  styles.fade
                )}
              >
                Player
              </th>
              {years.map((year) => (
                <th
                  key={year}
                  scope="col"
                  aria-label={String(year)}
                  className={cx(
                    table.cell,
                    table.small,
                    table.head,
                    styles.head,
                    styles.yearHead,
                    incomplete(year) && styles.incomplete
                  )}
                >
                  ’{String(year).slice(2)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ordered.map((row) => {
              const isYou = String(row.id) === userId;
              return (
                <tr key={row.id}>
                  <th
                    scope="row"
                    className={cx(
                      table.cell,
                      table.small,
                      shared.sticky,
                      styles.fade,
                      isYou && shared.you,
                      isYou && shared.youEdge
                    )}
                  >
                    <span className={styles.name}>
                      {row.name}
                      {!row.active && (
                        <span className={styles.former}>former</span>
                      )}
                    </span>
                  </th>
                  {years.map((year) => {
                    const finish = row.byYear.get(year);
                    const text =
                      finish &&
                      `${row.name} · ${year}: ${ordinal(finish.rank)}, ${finish.score} pts`;
                    return (
                      <td
                        key={year}
                        className={cx(
                          table.cell,
                          table.small,
                          isYou && shared.you,
                          incomplete(year) && styles.incomplete
                        )}
                      >
                        {finish ? (
                          <Tooltip
                            title={`${ordinal(finish.rank)}, ${finish.score} pts`}
                          >
                            {/* Out of the tab order (hundreds of cells); the
                                grid scrolls by keyboard and screen readers
                                read each cell's label. */}
                            <button
                              type="button"
                              tabIndex={-1}
                              aria-label={`${year}: ${ordinal(finish.rank)}, ${finish.score} points`}
                              onClick={() => setDetail(text ?? null)}
                              className={cx(
                                uiStyles.plainButton,
                                styles.finish,
                                TIER_CLASS[finishTier(finish.rank)]
                              )}
                            >
                              {finish.rank}
                            </button>
                          </Tooltip>
                        ) : (
                          <span aria-hidden className={styles.none}>
                            ·
                          </span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
