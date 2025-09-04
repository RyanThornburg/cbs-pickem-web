import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid2";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useEffect, useState } from "react";

import Scoreboard from "./Scoreboard";
import StatsLeaderboard from "./LeaderboardCard";
import TopTeamsPicked from "./TopTeamsPicked";
import WeeklyCoverChart from "./WeeklyCoverChart";
import CoverResultCard from "./CoverResultCard";
import UserSelectDropdown from "./UserSelectDropdown";
import WeekDropdown from "./WeekDropdown";
import UserSelected from "./UserSelected";
import { GetUserByWeek } from "../data/GetUserByWeek";
import { RankedUser } from "../types";
import UsersTable from "./UsersTable";
import UserSelectedMain from "./UserSelected/UserSelectedMain";
import { useCurrentWeek } from "./CurrentWeekContext";
//import TeamCoverCard from "./TeamCoversCard";

export default function MainGrid() {
  const { currentWeek } = useCurrentWeek();
  const [selectedWeek, setSelectedWeek] = useState<number>(currentWeek);
  const [user, setUser] = useState<string>("");
  const [userList, setUserList] = useState<RankedUser[]>([]);

  // If loading from localStorage, make sure the value exists in options first
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser && userList.some((user) => user.id === storedUser)) {
      setUser(storedUser);
    } else {
      setUser(""); // Reset to empty if stored value is invalid
    }
  }, [userList]); // Add userList as dependency
  const onWeekChange = (week: number): void => {
    setSelectedWeek(week);
  };

  const onUserChange = (userId: string) => {
    localStorage.setItem("user", userId);
    setUser(userId);
  };

  // Handle selectedWeek initialization
  useEffect(() => {
    if (selectedWeek === 0 && currentWeek > 0) {
      setSelectedWeek(currentWeek);
    }
  }, [selectedWeek, currentWeek]);

  useEffect(() => {
    if (currentWeek > 0 && selectedWeek > 0) {
      const unsubscribe = GetUserByWeek(selectedWeek, (users) => {
        setUserList(users as RankedUser[]);
      });

      // Cleanup subscription when component unmounts
      return () => {
        if (unsubscribe) {
          unsubscribe();
        }
      };
    }
  }, [currentWeek, selectedWeek]);

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
              <Typography align="left" variant="h5" sx={{ size: 3 }}>
                Morlocked Pick'em Results
              </Typography>
            </Grid>
            <Grid
              sx={{ display: { xs: "none", lg: "block" } }}
              size={{ xs: 0, lg: 7 }}
            >
              <UserSelectedMain userId={user} userList={userList} />
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
              </Stack>
            </Grid>

            <UserSelected userId={user} userList={userList} />
          </Grid>

          <Grid
            container
            spacing={2}
            columns={12}
            sx={{ mb: (theme) => theme.spacing(2) }}
          >
            <Grid size={{ xs: 12, sm: 6, md: 6, xl: 4 }}>
              <StatsLeaderboard
                userList={userList}
                isSecondHalf={false}
                userId={user}
              />
            </Grid>
            {/* <Grid size={{ xs: 12, sm: 6, md: 6, xl: 3 }}>
              <StatsLeaderboard
                userList={userList}
                isSecondHalf={true}
                userId={user}
              />
            </Grid> */}
            <Grid size={{ xs: 12, sm: 3, md: 3, xl: 4 }}>
              <CoverResultCard
                week={selectedWeek}
                isCurrent={currentWeek === selectedWeek}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 9, md: 3, xl: 4 }}>
              <WeeklyCoverChart />
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
            <UsersTable
              userList={userList}
              userId={user}
              showSecondHalf={selectedWeek >= 10}
              week={selectedWeek}
            />
            <Grid size={{ xs: 12, xl: 5 }}>
              <TopTeamsPicked week={selectedWeek} />
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
              <Scoreboard week={selectedWeek} />
            </Grid>
          </Grid>
        </>
      )}
    </Box>
  );
}
