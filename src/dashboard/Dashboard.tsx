import Box from "@mui/material/Box";
import CssBaseline from "@mui/material/CssBaseline";
import Stack from "@mui/material/Stack";
import { alpha } from "@mui/material/styles";
import MainGrid from "./components/MainGrid";
import AppTheme from "./shared-theme/AppTheme";

export default function Dashboard(props: { disableCustomTheme?: boolean }) {
  return (
    <AppTheme {...props}>
      <CssBaseline enableColorScheme />
      <Box sx={{ display: "flex" }}>
        {/* Main content */}
        <Box
          component="main"
          sx={(theme) => ({
            flexGrow: 1,
            backgroundColor: alpha(theme.palette.background.default, 1),
            // Clip rather than scroll: a scroll box here (that never
            // scrolls, since the window does) would break position: sticky
            // for everything inside, like User Picks' pinned row.
            minWidth: 0,
            overflowX: "clip",
          })}
        >
          <Stack
            spacing={2}
            sx={{
              alignItems: "center",
              mx: { xs: 2, sm: 3 },
              pb: 5,
            }}
          >
            <MainGrid />
          </Stack>
        </Box>
      </Box>
    </AppTheme>
  );
}
