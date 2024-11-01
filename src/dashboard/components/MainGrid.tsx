import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid2";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import { onValue, ref } from "firebase/database";
import { useEffect, useState } from "react";
import { db } from "../../components/firebase";
import ColorModeIconDropdown from "../shared-theme/ColorModeIconDropdown";
import GamesMain from "./GamesMain";
import StatsLeaderboard from "./StatsLeaderboard";
import StatsTopUserPicks from "./StatsTopUserPicks";
import StatsWeeklyCoverChart from "./StatsWeeklyCoverChart";
import StatsWeeklyResult from "./StatsWeeklyResult";
import UserDataGrid from "./UserDataGrid";
//import UserSelected from "./UserSelected";

export default function MainGrid() {
  const [week, setWeek] = useState(0);
  const [weekString, setWeekString] = useState("0");
  const [currentWeek, setCurrentWeek] = useState(0);

  useEffect(() => {
    const userRef = ref(db, "current_week");
    return onValue(userRef, (snapshot) => {
      if (snapshot.exists()) {
        setCurrentWeek(snapshot.val());
        setWeek(snapshot.val());
      }
    });
  }, []);

  return (
    <Box sx={{ width: "100%", maxWidth: { sm: "100%", md: "1700px" } }}>
      {/* cards */}
      {week !== 0 && (
        <>
          <Stack
            direction="row"
            spacing={4}
            sx={{
              mt: 2,
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Stack></Stack>
            <Stack sx={{ alignItems: "center" }} spacing={2} direction="row">
              <Typography align="left" variant="h5" sx={{ size: 3, mb: 2 }}>
                Morlocked Pick'em Results:
              </Typography>
              <Typography align="left" variant="h5" sx={{ mb: 2 }}>
                Week {currentWeek}
              </Typography>
            </Stack>
            <Stack
              sx={{ alignItems: "flex-end", justifyContent: "flex-end" }}
              spacing={2}
              direction="row"
            >
              <ColorModeIconDropdown />
            </Stack>
          </Stack>

          <Grid
            container
            spacing={2}
            columns={12}
            sx={{ mb: (theme) => theme.spacing(2) }}
          >
            <Grid size={{ xs: 12, sm: 12, md: 4 }}>
              <StatsLeaderboard />
            </Grid>
            <Grid size={{ xs: 12, sm: 12, md: 3 }}>
              <StatsWeeklyResult week={week} />
            </Grid>
            <Grid size={{ xs: 12, sm: 12, md: 5 }}>
              <StatsWeeklyCoverChart />
            </Grid>
          </Grid>

          <Typography
            align="left"
            component="h2"
            variant="h4"
            sx={{ mb: 2, borderBottom: "1px solid grey" }}
          >
            User Picks
          </Typography>

          <Grid container spacing={{ xs: 2, md: 1, lg: 2, xl: 1 }}>
            <Grid
              id="gridUser"
              width={"fit-content"}
              display="flex"
              justifyContent="center"
              alignItems="center"
              size={{ xs: 12, sm: 12, md: 9, lg: 8, xl: 7 }}
            >
              <UserDataGrid week={week} />
            </Grid>
            <Grid size={{ xs: 12, sm: 12, md: 9, lg: 4, xl: 5 }}>
              <StatsTopUserPicks week={week} />
            </Grid>
          </Grid>

          <Grid container spacing={2} columns={12}>
            <Grid
              id="games"
              size={{ xs: 12, lg: 12 }}
              sx={{ display: "inline-block", width: "95%" }}
            >
              <Typography
                align="left"
                component="h2"
                variant="h4"
                sx={{ mt: 2, borderBottom: "1px solid grey" }}
              >
                Games
              </Typography>
            </Grid>
            <Grid size={{ xs: 12, lg: 12 }}>
              <GamesMain week={week} />
            </Grid>
          </Grid>
        </>
      )}
    </Box>
  );
}
