import { SideRoleRecord } from "../../types";
import { Tone, recordTone } from "./playerUtils";
import styles from "./SideRoleGrid.module.css";

const TONE_CLASS: Record<Tone, string | undefined> = {
  good: styles.good,
  bad: styles.bad,
  neutral: undefined,
};

// Home or road crossed with favorite or underdog, so "4-1 on road dogs"
// stands out. The tint repeats what the record says; it's never the only
// signal.
export function SideRoleGrid({ sideRoles }: { sideRoles: SideRoleRecord[] }) {
  const cell = (side: "home" | "away", role: "favorite" | "underdog") => {
    const record = sideRoles.find((r) => r.side === side && r.role === role);
    const graded = record ? record.wins + record.losses : 0;
    const label = `${side === "home" ? "Home" : "Road"} ${role === "favorite" ? "favorites" : "underdogs"}`;
    return (
      <div
        role="group"
        aria-label={label}
        className={[
          styles.cell,
          graded === 0 && styles.empty,
          TONE_CLASS[recordTone(record)],
        ]
          .filter(Boolean)
          .join(" ")}
      >
        <p className={styles.record}>
          {record ? `${record.wins}-${record.losses}` : "0-0"}
        </p>
        <span className={styles.detail}>
          {graded === 0
            ? "none yet"
            : `${Math.round((record!.wins / graded) * 100)}% · ${record!.picks} ${record!.picks === 1 ? "pick" : "picks"}`}
        </span>
      </div>
    );
  };
  const head = (text: string) => <span className={styles.head}>{text}</span>;
  const rowHead = (text: string) => (
    <span className={styles.rowHead}>{text}</span>
  );
  return (
    <div className={styles.grid}>
      <span />
      {head("Favorite")}
      {head("Underdog")}
      {rowHead("Home")}
      {cell("home", "favorite")}
      {cell("home", "underdog")}
      {rowHead("Road")}
      {cell("away", "favorite")}
      {cell("away", "underdog")}
    </div>
  );
}
