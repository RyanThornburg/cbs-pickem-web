import { alpha, Theme } from "@mui/material/styles";
import { SystemStyleObject } from "@mui/system";
import { HighlightBorder } from "../../utils/scoreboardUtils";

// One border per game (see highlightBorder). Cards draw it outside the edge;
// compact rows draw it inset, since the list container would clip it.
export const highlightSx = (
  border: HighlightBorder,
  inset = false
): ((theme: Theme) => SystemStyleObject<Theme>) => (theme) => {
  if (!border) return {};
  const color = border === "redZone" ? theme.palette.error.main : theme.palette.warning.main;
  const i = inset ? "inset " : "";
  if (border === "ending") {
    return {
      borderColor: color,
      boxShadow: inset
        ? `inset 0 0 0 3px ${color}`
        : `0 0 0 2px ${color}, 0 0 14px ${alpha(color, 0.45)}`,
      ...(inset && { bgcolor: alpha(color, 0.08) }),
    };
  }
  return { borderColor: color, boxShadow: `${i}0 0 0 ${inset ? 2 : 1}px ${color}` };
};
