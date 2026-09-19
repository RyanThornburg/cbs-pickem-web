import Badge from "@mui/material/Badge";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid2";
import Stack from "@mui/material/Stack";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import Typography from "@mui/material/Typography";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import GamesCard from "./GamesCard";
import Scoreboard from "./Scoreboard";
import TrendsSection from "./TrendsSection";
import UserSelectDropdown from "./UserSelectDropdown";
import WeekDropdown from "./WeekDropdown";
import UserSelected from "./UserSelected";
import { GetGameDataByWeek } from "../data/GetGameDataByWeek";
import { GetUserByWeek } from "../data/GetUserByWeek";
import { GameStatus, RankedUser } from "../types";
import {
  getInitialTab,
  isPrimaryTab,
  PrimaryTab,
  setStoredTab,
} from "../utils/defaultTab";
import UsersTable from "./UsersTable";
import UserSelectedMain from "./UserSelected/UserSelectedMain";
import { useCurrentWeek } from "./CurrentWeekContext";
// WeeklyCoverChart, CoverResultCard, and TeamCoversCard were removed along with their
// Firebase reads — rebuild against the phase-2 covers KV key when it exists.

export default function MainGrid() {
  const { currentWeek, season, secondHalfStartWeek } = useCurrentWeek();
  const { tab } = useParams<{ tab: string }>();
  const navigate = useNavigate();
  const [selectedWeek, setSelectedWeek] = useState<number>(currentWeek);
  const [user, setUser] = useState<string>("");
  const [userList, setUserList] = useState<RankedUser[]>([]);
  const [hasLiveGame, setHasLiveGame] = useState(false);

  const activeTab = isPrimaryTab(tab) ? tab : null;

  // /:tab only matches known routes explicitly (see the "*" catch-all in
  // App.tsx), but the param itself could still be anything -- redirect an
  // unrecognized value back through "/" so it re-resolves to the stored/
  // day-time default instead of rendering a blank tab.
  useEffect(() => {
    if (activeTab === null) {
      navigate(`/${getInitialTab()}`, { replace: true });
    }
  }, [activeTab, navigate]);

  const handleTabChange = (_: React.SyntheticEvent, value: PrimaryTab) => {
    setStoredTab(value);
    navigate(`/${value}`);
  };

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
    if (season > 0 && selectedWeek > 0) {
      const unsubscribe = GetUserByWeek(season, selectedWeek, (users) => {
        setUserList(users as RankedUser[]);
      });

      // Cleanup subscription when component unmounts
      return () => {
        if (unsubscribe) {
          unsubscribe();
        }
      };
    }
  }, [season, selectedWeek]);

  // Drives the Scoreboard tab's live-dot badge -- independent of the
  // day/time default-tab rule, since a Thursday/Saturday game running long
  // (or short) should still get flagged correctly.
  useEffect(() => {
    if (season > 0 && selectedWeek > 0) {
      const unsubscribe = GetGameDataByWeek(season, selectedWeek, (games) => {
        setHasLiveGame(
          games.some(
            (game) =>
              game.status === GameStatus.Inprogress ||
              game.status === GameStatus.Halftime
          )
        );
      });

      return () => {
        if (unsubscribe) {
          unsubscribe();
        }
      };
    }
  }, [season, selectedWeek]);

  return (
    <Box sx={{ width: "100%", maxWidth: { sm: "100%", md: "1700px" } }}>
      {/* cards */}
      {currentWeek !== 0 && activeTab !== null && (
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
                  userList={userList}
                  user={user}
                  onUserChange={onUserChange}
                />
              </Stack>
            </Grid>

            <UserSelected userId={user} userList={userList} />
          </Grid>

          {/* Overall/second-half leaderboard cards are hidden for now -- User
              Picks shows the same place/score data and is slated for a
              rework, so this duplicate top-of-page summary was redundant. */}

          <Box sx={{ mt: 2, borderBottom: 1, borderColor: "divider" }}>
            <Tabs value={activeTab} onChange={handleTabChange}>
              <Tab label="User Picks" value="picks" />
              <Tab label="Games" value="games" />
              <Tab
                label={
                  <Badge
                    color="error"
                    variant="dot"
                    invisible={!hasLiveGame || activeTab === "scoreboard"}
                  >
                    Scoreboard
                  </Badge>
                }
                value="scoreboard"
              />
              <Tab label="Trends" value="trends" />
            </Tabs>
          </Box>

          <Grid container spacing={2} columns={12} sx={{ mt: 2 }}>
            <Grid
              size={{ xs: 12, lg: 12 }}
              sx={{ display: activeTab === "picks" ? "block" : "none" }}
            >
              <UsersTable
                userList={userList}
                userId={user}
                showSecondHalf={selectedWeek >= secondHalfStartWeek}
                week={selectedWeek}
              />
            </Grid>
            <Grid
              size={{ xs: 12, lg: 12 }}
              sx={{ display: activeTab === "games" ? "block" : "none" }}
            >
              <GamesCard week={selectedWeek} />
            </Grid>
            <Grid
              size={{ xs: 12, lg: 12 }}
              sx={{ display: activeTab === "scoreboard" ? "block" : "none" }}
            >
              <Scoreboard week={selectedWeek} />
            </Grid>
            <Grid
              size={{ xs: 12, lg: 12 }}
              sx={{ display: activeTab === "trends" ? "block" : "none" }}
            >
              <TrendsSection season={season} week={selectedWeek} />
            </Grid>
          </Grid>
        </>
      )}
    </Box>
  );
}
