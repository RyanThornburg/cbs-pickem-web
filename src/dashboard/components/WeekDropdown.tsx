import { Select } from "../ui/Select";
import uiStyles from "../ui/ui.module.css";
import styles from "./WeekDropdown.module.css";

export type Props = {
  currentWeek: number;
  selectedWeek: number;
  onWeekChange: (week: number) => void;
};

// A small pill, "Week 3" ("Wk 3" on phones), next to the player picker.
export default function WeekDropdown({
  currentWeek,
  selectedWeek,
  onWeekChange,
}: Props) {
  return (
    <div className={styles.wrap}>
      <span id="week-select-label" className={uiStyles.visuallyHidden}>
        Week
      </span>
      <Select
        id="week-drop-down"
        labelledBy="week-select-label"
        className={styles.trigger}
        value={selectedWeek === 0 ? "1" : selectedWeek.toString()}
        onChange={(value) => onWeekChange(Number(value))}
        options={[...Array(currentWeek)].map((_, index) => {
          const weekNum = String(currentWeek - index);
          return { value: weekNum, label: `Week ${weekNum}` };
        })}
        // One span, so the space between "Week" and the number survives
        // the value's flex layout. The word is hidden from screen readers,
        // since the label already says "Week".
        renderValue={(value) => (
          <span>
            <span aria-hidden className={styles.long}>
              Week{" "}
            </span>
            <span aria-hidden className={styles.short}>
              Wk{" "}
            </span>
            {value}
          </span>
        )}
      />
    </div>
  );
}
