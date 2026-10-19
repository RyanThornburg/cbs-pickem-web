import { createContext, ReactNode, Ref, useContext } from "react";
import { useTabActive } from "./tabLinks";
import { Button } from "../ui/Button";
import { Icon } from "../ui/Icon";
import styles from "./TabIntro.module.css";

// Set by MainGrid while a past week is browsed. Weekly tabs' intro rows
// then say so, with the way back, in place of a separate notice. `noticeRef`
// goes on the shown tab's marker, so MainGrid can tell when it scrolls away
// (phones then show the same marker on the tab bar).
export interface PastWeekInfo {
  currentWeek: number;
  onBack: () => void;
  noticeRef: Ref<HTMLDivElement>;
}
export const PastWeekContext = createContext<PastWeekInfo | null>(null);

// The first row of every tab: its name (and week, on weekly tabs) as the
// page heading, a past-week marker when one is browsed, an optional quiet
// note (e.g. when odds last updated), and the tab's own controls on the
// right. One shape everywhere, so each tab starts the same way under the
// tab row. Team and player pages use the same row with a way back above it,
// their logo or avatar in front of the name, and a summary line under it.
export default function TabIntro({
  title,
  week,
  weekly = week != null,
  meta,
  actions,
  back,
  leading,
  subtitle,
}: {
  title: ReactNode;
  week?: number;
  // A weekly tab that doesn't put the week in its title (Trends, whose
  // switch names it) still gets the past-week marker.
  weekly?: boolean;
  meta?: ReactNode;
  actions?: ReactNode;
  back?: ReactNode;
  leading?: ReactNode;
  subtitle?: ReactNode;
}) {
  const pastWeek = useContext(PastWeekContext);
  const active = useTabActive();
  const showPast = weekly && pastWeek !== null;

  const titleBlock = (
    <div className={styles.titleBlock}>
      <h2 className={styles.title}>
        {title}
        {week != null && (
          <span className={styles.week}>
            {" · "}Week {week}
          </span>
        )}
      </h2>
      {showPast && (
        <div
          ref={active ? pastWeek.noticeRef : undefined}
          className={styles.past}
        >
          <span className={styles.pastTag}>
            <Icon name="History" className={styles.pastIcon} />
            Past week
          </span>
          <Button size="small" onClick={pastWeek.onBack}>
            Back to week {pastWeek.currentWeek}
          </Button>
        </div>
      )}
      {meta && <span className={styles.meta}>{meta}</span>}
    </div>
  );

  return (
    <div className={styles.intro}>
      {back && <div className={styles.back}>{back}</div>}
      <div className={styles.row}>
        {leading || subtitle ? (
          <div className={styles.leadingRow}>
            {leading}
            <div className={styles.leadingText}>
              {titleBlock}
              {subtitle}
            </div>
          </div>
        ) : (
          titleBlock
        )}
        {/* Phones put these on their own row (TabIntro.module.css). */}
        {actions && <div className={styles.actions}>{actions}</div>}
      </div>
    </div>
  );
}
