import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import Badge from "@mui/material/Badge";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Grid from "@mui/material/Grid2";
import Stack from "@mui/material/Stack";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import Typography from "@mui/material/Typography";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import AdminPanel from "./AdminPanel";
import GamesCard from "./GamesCard";
import RecordsSection from "./RecordsSection";
import Scoreboard from "./Scoreboard";
import TrendsSection from "./TrendsSection";
import UserSelectDropdown from "./UserSelectDropdown";
import WeekDropdown from "./WeekDropdown";
import UserSelected from "./UserSelected";
import {
  ADMIN_TAB,
  AppTab,
  RECORDS_TAB,
  getInitialTab,
  isPrimaryTab,
  setStoredTab,
} from "../utils/defaultTab";
import UsersTable from "./UsersTable";
import RecapStrip from "./Recap/RecapStrip";
import UserSelectedMain from "./UserSelected/UserSelectedMain";
import { useCurrentWeek } from "./CurrentWeekContext";
import {
  useIsAdmin,
  useSelectedUser,
  useSelectedUserTrends,
  useWeekData,
} from "./useWeekData";

export default function MainGrid() {
  const { currentWeek, season, secondHalfStartWeek, cbsPoolUrl } =
    useCurrentWeek();
  const { tab } = useParams<{ tab: string }>();
  const navigate = useNavigate();
  const [selectedWeek, setSelectedWeek] = useState<number>(currentWeek);
  // The hot streak badge is season data as of now, with no week-by-week
  // history, so it only shows while browsing the current week.
  const isCurrentWeek = selectedWeek === currentWeek;
  const { userList, recap, hasLiveGame } = useWeekData(season, selectedWeek);
  const [user, onUserChange] = useSelectedUser(userList);
  const selectedUserTrends = useSelectedUserTrends(season, user);
  const isAdmin = useIsAdmin();

  const activeTab: AppTab | null = isPrimaryTab(tab)
    ? tab
    : tab === ADMIN_TAB || tab === RECORDS_TAB
      ? tab
      : null;

  // /:tab only matches known routes explicitly (see the "*" catch-all in
  // App.tsx), but the param itself could still be anything -- redirect an
  // unrecognized value back through "/" so it re-resolves to the stored
  // tab (or the cold-start default) instead of rendering a blank tab.
  useEffect(() => {
    if (activeTab === null) {
      navigate(`/${getInitialTab()}`, { replace: true });
    }
  }, [activeTab, navigate]);

  const handleTabChange = (_: React.SyntheticEvent, value: AppTab) => {
    if (isPrimaryTab(value)) {
      setStoredTab(value);
    }
    navigate(`/${value}`);
  };

  const onWeekChange = (week: number): void => {
    setSelectedWeek(week);
  };

  // Handle selectedWeek initialization
  useEffect(() => {
    if (selectedWeek === 0 && currentWeek > 0) {
      setSelectedWeek(currentWeek);
    }
  }, [selectedWeek, currentWeek]);

  return (
    <Box sx={{ width: "100%", maxWidth: { sm: "100%", md: "1700px" } }}>
      {/* cards */}
      {currentWeek !== 0 && activeTab !== null && (
        <>
          <Grid
            container
            spacing={{ xs: 4, lg: 2 }}
            rowSpacing={0.5}
            sx={{
              mt: 2,
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            {/* From lg up the pick summary shares the header row, pushed
                right next to the Week/User dropdowns since it describes the
                selected user. If it can't fit it wraps below rather than
                squeezing the title onto two lines. */}
            <Grid size={{ xs: 12, sm: "grow" }} sx={{ minWidth: 0 }}>
              <Box
                sx={{
                  display: "flex",
                  flexWrap: "wrap",
                  alignItems: "center",
                  columnGap: 3,
                  rowGap: 1,
                }}
              >
                <Typography
                  align="left"
                  variant="h5"
                  sx={{ whiteSpace: { lg: "nowrap" } }}
                >
                  Morlocked Pick'em
                </Typography>
                <Box sx={{ display: { xs: "none", lg: "block" }, ml: "auto", mr: 1 }}>
                  <UserSelectedMain
                    userId={user}
                    userList={userList}
                    userTrends={selectedUserTrends}
                    showStreak={isCurrentWeek}
                  />
                </Box>
              </Box>
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
                {/* Records isn't weekly data, so there's no week to pick. */}
                {activeTab !== RECORDS_TAB && (
                  <WeekDropdown
                    currentWeek={currentWeek}
                    selectedWeek={selectedWeek}
                    onWeekChange={onWeekChange}
                  />
                )}
                <UserSelectDropdown
                  userList={userList}
                  user={user}
                  onUserChange={onUserChange}
                />
              </Stack>
            </Grid>

            <UserSelected
              userId={user}
              userList={userList}
              userTrends={selectedUserTrends}
              showStreak={isCurrentWeek}
            />
          </Grid>

          {/* Overall/second-half leaderboard cards are hidden for now -- User
              Picks shows the same place/score data and is slated for a
              rework, so this duplicate top-of-page summary was redundant. */}

          <Box
            sx={{
              mt: 2,
              borderBottom: 1,
              borderColor: "divider",
              display: "flex",
              alignItems: "center",
            }}
          >
            {/* Scrollable so the Admin tab can't push the row past 360px.
                Arrows only appear on overflow, i.e. only for the admin on a
                phone. The five public tabs fit at 360px thanks to the short
                "Picks" label and tighter padding on phones. */}
            <Tabs
              value={activeTab}
              onChange={handleTabChange}
              variant="scrollable"
              scrollButtons="auto"
              allowScrollButtonsMobile
              sx={{
                flex: 1,
                minWidth: 0,
                "& .MuiTab-root": {
                  px: { xs: "4px", sm: 1 },
                  fontSize: { xs: "0.8125rem", sm: undefined },
                },
              }}
            >
              <Tab
                // One span: Tab lays its children out as a flex column, so
                // "User" and "Picks" as siblings would stack.
                label={
                  <span>
                    <Box component="span" sx={{ display: { xs: "none", sm: "inline" } }}>
                      User{" "}
                    </Box>
                    Picks
                  </span>
                }
                value="picks"
              />
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
              {/* Set apart like Admin: all-time data, not this week's.
                  Icon-only on phones so the row still fits at 360px. */}
              <Tab
                label={
                  <Box component="span" sx={{ display: { xs: "none", sm: "inline" } }}>
                    Records
                  </Box>
                }
                aria-label="Records"
                value={RECORDS_TAB}
                icon={<EmojiEventsIcon fontSize="small" />}
                iconPosition="start"
                sx={{
                  ml: { xs: 0.5, sm: 1 },
                  pl: { xs: 1, sm: 1.5 },
                  minWidth: 0,
                  borderLeft: 1,
                  borderColor: "divider",
                  borderRadius: 0,
                  color: "#a87f12",
                  "& .MuiTab-icon": { mr: { xs: 0, sm: 1 } },
                  "&.Mui-selected": { color: "#a87f12" },
                }}
              />
              {/* Also rendered while on /admin itself so the Tabs value stays
                  valid even before (or if) the admin check comes back. */}
              {(isAdmin || activeTab === ADMIN_TAB) && (
                <Tab
                  label="Admin"
                  value={ADMIN_TAB}
                  icon={<AdminPanelSettingsIcon fontSize="small" />}
                  iconPosition="start"
                  sx={{
                    ml: 1,
                    pl: 1.5,
                    borderLeft: 1,
                    borderColor: "divider",
                    borderRadius: 0,
                    color: "warning.main",
                    "&.Mui-selected": { color: "warning.main" },
                  }}
                />
              )}
            </Tabs>
            {cbsPoolUrl && (
              // Icon-only on phones -- the four tabs already use most of the
              // row at 360px.
              <Button
                href={cbsPoolUrl}
                target="_blank"
                rel="noopener noreferrer"
                size="small"
                aria-label="Open the pool on CBS Sports"
                endIcon={<OpenInNewIcon />}
                sx={{
                  flexShrink: 0,
                  whiteSpace: "nowrap",
                  minWidth: 0,
                  px: { xs: 0.5, sm: 1 },
                  "& .MuiButton-endIcon": { ml: { xs: 0, sm: 1 } },
                }}
              >
                <Box
                  component="span"
                  sx={{ display: { xs: "none", sm: "inline" } }}
                >
                  CBS Pool
                </Box>
              </Button>
            )}
          </Box>

          <Grid container spacing={2} columns={12} sx={{ mt: 2 }}>
            <Grid
              size={{ xs: 12, lg: 12 }}
              sx={{ display: activeTab === "picks" ? "block" : "none" }}
            >
              <RecapStrip recap={recap} />
              <UsersTable
                userList={userList}
                userId={user}
                showSecondHalf={selectedWeek >= secondHalfStartWeek}
                week={selectedWeek}
                season={season}
                recap={recap}
                showStreak={isCurrentWeek}
              />
            </Grid>
            <Grid
              size={{ xs: 12, lg: 12 }}
              sx={{ display: activeTab === "games" ? "block" : "none" }}
            >
              <GamesCard week={selectedWeek} recap={recap} />
            </Grid>
            <Grid
              size={{ xs: 12, lg: 12 }}
              sx={{ display: activeTab === "scoreboard" ? "block" : "none" }}
            >
              <Scoreboard
                week={selectedWeek}
                userId={user}
                totalUsers={userList.length}
                recap={recap}
              />
            </Grid>
            <Grid
              size={{ xs: 12, lg: 12 }}
              sx={{ display: activeTab === "trends" ? "block" : "none" }}
            >
              <TrendsSection season={season} week={selectedWeek} recap={recap} />
            </Grid>
            {activeTab === RECORDS_TAB && (
              <Grid size={{ xs: 12, lg: 12 }}>
                <RecordsSection season={season} userId={user} />
              </Grid>
            )}
            {/* Mounted only while open, so admin data is never polled in the
                background from the public tabs. */}
            {activeTab === ADMIN_TAB && (
              <Grid size={{ xs: 12, lg: 12 }}>
                <AdminPanel />
              </Grid>
            )}
          </Grid>
        </>
      )}
    </Box>
  );
}
