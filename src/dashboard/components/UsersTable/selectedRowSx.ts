// Background for the selected user's row on User Picks (desktop and mobile).
// Components off MUI take the color itself.
export const SELECTED_ROW_BG = "#f0f4c3";

// The same as an `sx` value, for callers still on MUI. Typed by shape so
// this folder imports nothing from MUI; MUI's Theme fits it.
// applyStyles follows the theme's CSS-variable color scheme; palette.mode
// wouldn't (see CLAUDE.md), though the app is light-only today.
export const selectedRowSx = (theme: {
  applyStyles: (mode: "dark", styles: { bgcolor: string }) => object;
}) => ({
  bgcolor: SELECTED_ROW_BG,
  ...theme.applyStyles("dark", { bgcolor: "#78909c" }),
});
