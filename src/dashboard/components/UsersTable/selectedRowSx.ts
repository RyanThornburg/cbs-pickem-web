import { Theme } from "@mui/material/styles";
import { SystemStyleObject } from "@mui/system";

// Background for the selected user's row on User Picks (desktop and mobile).
// Components off MUI take the color itself.
export const SELECTED_ROW_BG = "#f0f4c3";

// applyStyles follows the theme's CSS-variable color scheme; palette.mode
// wouldn't (see CLAUDE.md), though the app is light-only today.
export const selectedRowSx = (theme: Theme): SystemStyleObject<Theme> => ({
  bgcolor: SELECTED_ROW_BG,
  ...theme.applyStyles("dark", { bgcolor: "#78909c" }),
});
