import { Fragment } from "react";
import { RecordTile } from "./recordsUtils";
import styles from "./RecordTiles.module.css";

type Props = {
  tiles: RecordTile[];
  userId: string;
};

export default function RecordTiles({ tiles, userId }: Props) {
  return (
    <div className={styles.grid}>
      {tiles.map((tile) => (
        <div key={tile.label} className={styles.tile}>
          <p className={styles.label}>{tile.label}</p>
          <p className={styles.value}>
            {tile.value} <span className={styles.unit}>{tile.unit}</span>
          </p>
          <p className={styles.holders}>
            {tile.holders.map((holder, i) => (
              <Fragment key={`${holder.text}-${i}`}>
                {i > 0 && ", "}
                {holder.text}
                {holder.userId !== undefined &&
                  String(holder.userId) === userId && (
                    <span className={styles.you}> (you)</span>
                  )}
              </Fragment>
            ))}
          </p>
          {tile.detail && <span className={styles.detail}>{tile.detail}</span>}
        </div>
      ))}
    </div>
  );
}
