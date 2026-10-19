import Tooltip from "@mui/material/Tooltip";
import { GameTag } from "../../../Recap/recapBadges";
import styles from "./GameRecapTags.module.css";

// Recap tags on a game: "Upset of the week", "Won, didn't cover".
// `wrap` lets the text wrap inside a narrow column (the compact rows'
// status column is only 72-88px wide).
export function GameRecapTags({
  tags,
  wrap = false,
}: {
  tags: GameTag[] | undefined;
  wrap?: boolean;
}) {
  if (!tags?.length) return null;
  return (
    <>
      {tags.map((tag) => (
        <Tooltip key={tag.kind} title={tag.detail}>
          <span
            className={[styles.tag, styles[tag.kind], wrap && styles.wrap]
              .filter(Boolean)
              .join(" ")}
          >
            {tag.label}
          </span>
        </Tooltip>
      ))}
    </>
  );
}
