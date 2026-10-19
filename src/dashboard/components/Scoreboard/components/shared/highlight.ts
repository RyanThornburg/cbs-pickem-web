import { HighlightBorder } from "../../utils/scoreboardUtils";
import styles from "./highlight.module.css";

// One border per game (see highlightBorder). Cards draw it outside the edge;
// compact rows draw it inset, since the list container would clip it.
export const highlightClass = (
  border: HighlightBorder,
  inset = false
): string | undefined =>
  border
    ? `${inset ? styles.inset : styles.outside} ${styles[border]}`
    : undefined;
