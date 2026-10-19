import { ordinal } from "../../helper";
import { CareerRow } from "./recordsUtils";
import { Button } from "../../ui/Button";
import styles from "./YourRecord.module.css";

type Props = {
  row: CareerRow;
  place: { place: number; tied: boolean };
};

const Fact = ({ children }: { children: React.ReactNode }) => (
  <span className={styles.fact}>{children}</span>
);

// The selected player's all-time line, first on the page: one big number
// (their place) plus a few short facts. Titles list their years; without a
// title, the best finish does instead.
export default function YourRecord({ row, place }: Props) {
  const titleYears = [...row.byYear]
    .filter(([, f]) => f.rank === 1)
    .map(([year]) => year)
    .sort((a, b) => a - b);
  const bestYears = [...row.byYear]
    .filter(([, f]) => f.rank === row.best)
    .map(([year]) => year)
    .sort((a, b) => a - b);

  return (
    <div
      role="group"
      aria-label="Your all-time record"
      className={styles.record}
    >
      <p className={styles.name}>
        {row.name}
        {row.active ? "" : " · former player"}
      </p>
      <p className={styles.place}>
        {place.tied ? "T" : ""}
        {ordinal(place.place)}
        <span className={styles.placeNote}>
          all-time · {row.points} career pts
        </span>
      </p>
      {titleYears.length > 0 ? (
        <Fact>
          <b>
            {titleYears.length} title{titleYears.length > 1 ? "s" : ""}
          </b>{" "}
          ({titleYears.join(", ")})
        </Fact>
      ) : (
        row.best !== undefined && (
          <Fact>
            best <b>{ordinal(row.best)}</b> ({bestYears.join(", ")})
          </Fact>
        )
      )}
      <Fact>
        <b>{row.seasons}</b> season{row.seasons === 1 ? "" : "s"}
      </Fact>
      {row.avgFinish !== undefined && (
        <Fact>
          avg finish <b>{row.avgFinish.toFixed(1)}</b>
        </Fact>
      )}
      {row.top5 > 0 && (
        <Fact>
          <b>{row.top5}</b> top-5 finish{row.top5 === 1 ? "" : "es"}
        </Fact>
      )}
    </div>
  );
}

type NoRecordProps = {
  selected: boolean;
  season: number;
  onChoose: () => void;
};

// Stands in for the all-time line when there isn't one: no one is picked
// yet, or the picked player has no finished season (a rookie).
export function NoRecordYet({ selected, season, onChoose }: NoRecordProps) {
  return (
    <div className={styles.empty}>
      <p className={styles.emptyText}>
        {selected
          ? `Your all-time line starts once the ${season} season closes.`
          : "Pick your name to see where you rank all\u2011time."}
      </p>
      {!selected && (
        <Button variant="outlined" size="small" onClick={onChoose}>
          Choose your name
        </Button>
      )}
    </div>
  );
}
