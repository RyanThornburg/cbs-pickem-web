import { Box, Tooltip } from "@mui/material";
import { GameTag, GameTagKind } from "../../../Recap/recapBadges";

const TAG_COLORS: Record<GameTagKind, { bg: string; fg: string }> = {
  upset: { bg: "hsl(12, 90%, 93%)", fg: "hsl(12, 75%, 38%)" },
  flipped: { bg: "hsl(265, 70%, 95%)", fg: "hsl(265, 50%, 42%)" },
};

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
          <Box
            component="span"
            sx={{
              fontSize: "0.75rem",
              fontWeight: 700,
              borderRadius: "4px",
              px: 0.75,
              py: "1px",
              whiteSpace: wrap ? "normal" : "nowrap",
              lineHeight: wrap ? 1.25 : undefined,
              maxWidth: "100%",
              alignSelf: "flex-start",
              bgcolor: TAG_COLORS[tag.kind].bg,
              color: TAG_COLORS[tag.kind].fg,
            }}
          >
            {tag.label}
          </Box>
        </Tooltip>
      ))}
    </>
  );
}
