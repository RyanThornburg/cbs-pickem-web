import { GameHighlight } from "../../utils/scoreboardUtils";
import styles from "./HighlightFlags.module.css";

const Flag = ({
  label,
  kind,
}: {
  label: string;
  kind: "close" | "redZone";
}) => <span className={`${styles.flag} ${styles[kind]}`}>{label}</span>;

export const HighlightFlags = ({ highlight }: { highlight: GameHighlight }) => (
  <>
    {highlight.ending ? (
      <Flag label="Close, ending" kind="close" />
    ) : highlight.close ? (
      <Flag label="Close" kind="close" />
    ) : null}
    {highlight.redZone && <Flag label="Red zone" kind="redZone" />}
  </>
);
