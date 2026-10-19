import { MEDAL } from "../Leaders/medals";
import styles from "./PlaceCell.module.css";

// 1st-3rd get the same gold/silver/bronze medals as the leader cards; every
// other place is a plain number. Who's paid is shown by the paid lines in
// the table, not by the marker's color.
export function PlaceCell({ place }: { place: number | null | undefined }) {
  if (place == null) return null;
  const medal = MEDAL[place];
  if (!medal) return <p className={styles.place}>{place}</p>;
  return (
    <span
      className={styles.medal}
      style={{ backgroundColor: medal.bg, color: medal.fg }}
    >
      {place}
    </span>
  );
}
