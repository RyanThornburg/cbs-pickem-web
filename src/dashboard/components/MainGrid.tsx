import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid2";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useState } from "react";
import ColorModeIconDropdown from "../shared-theme/ColorModeIconDropdown";
import GamesMain from "./GamesMain";
import StatsLeaderboard from "./StatsLeaderboard";
import StatsTopUserPicks from "./StatsTopUserPicks";
import StatsWeeklyCoverChart from "./StatsWeeklyCoverChart";
import StatsWeeklyResult from "./StatsWeeklyResult";
import UserDataGrid from "./UserDataGrid";
import UserDataMobile from "./UserDataMobile";
import UserSelectDropdown from "./UserSelectDropdown";
import WeekDropdown from "./WeekDropdown";

export type Props = {
  currentWeek: number;
};

export default function MainGrid({ currentWeek }: Props) {
  const [selectedWeek, setSelectedWeek] = useState<number>(currentWeek);
  const [user, setUser] = useState<string>((): string => {
    const storedUser = localStorage.getItem("user");
    return storedUser ? storedUser : "";
  });

  if (selectedWeek === 0 && currentWeek > 0) {
    setSelectedWeek(currentWeek);
  }
  const onWeekChange = (week: number): void => {
    setSelectedWeek(week);
  };

  const onUserChange = (userId: string) => {
    localStorage.setItem("user", userId);
    setUser(userId);
  };

  return (
    <Box sx={{ width: "100%", maxWidth: { sm: "100%", md: "1700px" } }}>
      {/* cards */}
      {currentWeek !== 0 && (
        <>
          <Grid
            container
            spacing={4}
            rowSpacing={0.5}
            sx={{
              mt: 2,
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Grid size={{ xs: 12, sm: "grow" }}>
              <Typography align="left" variant="h5" sx={{ size: 3, mb: 2 }}>
                Morlocked Pick'em Results
              </Typography>
            </Grid>
            <Grid
              size={{ xs: 12, sm: "auto" }}
              alignItems={{ xs: "center", sm: "flex-end" }}
            >
              <Stack
                sx={{
                  alignItems: "flex-end",
                  justifyContent: "space-between",
                  pb: 2,
                }}
                spacing={2}
                direction="row"
              >
                <WeekDropdown
                  currentWeek={currentWeek}
                  selectedWeek={selectedWeek}
                  onUserChange={onWeekChange}
                />
                <UserSelectDropdown
                  week={selectedWeek}
                  user={user}
                  onUserChange={onUserChange}
                />
                <ColorModeIconDropdown />
              </Stack>
            </Grid>
          </Grid>

          <Grid
            container
            spacing={2}
            columns={12}
            sx={{ mb: (theme) => theme.spacing(2) }}
          >
            <Grid size={{ xs: 12, sm: 12, md: 6, lg: 3 }}>
              <StatsLeaderboard
                week={currentWeek}
                isSecondHalf={false}
                userId={user}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 12, md: 6, lg: 3 }}>
              <StatsLeaderboard
                week={currentWeek}
                isSecondHalf={true}
                userId={user}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 12, md: 3, lg: 2 }}>
              <StatsWeeklyResult
                week={selectedWeek}
                isCurrent={currentWeek == selectedWeek}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 12, md: 9, lg: 4 }}>
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
              sx={{ display: { xs: "none", sm: "block" } }}
              size={{ xs: 12, sm: 12, md: 12, lg: 8, xl: 7 }}
            >
              <UserDataGrid week={selectedWeek} userId={user} />
            </Grid>
            <Grid
              sx={{ display: { xs: "block", sm: "none" } }}
              size={{ xs: 12 }}
            >
              <UserDataMobile userId={user} week={selectedWeek} />
            </Grid>
            <Grid size={{ xs: 12, sm: 12, md: 12, lg: 4, xl: 5 }}>
              <StatsTopUserPicks week={selectedWeek} />
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
              <GamesMain week={selectedWeek} />
            </Grid>
          </Grid>
        </>
      )}
    </Box>
  );
}
