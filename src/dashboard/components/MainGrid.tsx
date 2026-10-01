import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import Badge from "@mui/material/Badge";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Grid from "@mui/material/Grid";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import Typography from "@mui/material/Typography";
import useMediaQuery from "@mui/material/useMediaQuery";
import { useTheme } from "@mui/material/styles";
import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";

import AdminPanel from "./AdminPanel";
import GamesCard from "./GamesCard";
import RecordsSection from "./RecordsSection";
import Scoreboard from "./Scoreboard";
import TrendsSection from "./TrendsSection";
import UserSelectDropdown from "./UserSelectDropdown";
import PickYourselfHint from "./PickYourselfHint";
import PastWeekNotice from "./PastWeekNotice";
import WeekDropdown from "./WeekDropdown";
import {
  ADMIN_TAB,
  AppTab,
  RECORDS_TAB,
  getInitialTab,
  isPrimaryTab,
  setStoredTab,
} from "../utils/defaultTab";
import UsersTable from "./UsersTable";
import { UserGamePicksStack } from "./UsersTable/UserPickStack";
import { useMoneyStandings } from "./UsersTable/useMoneyStandings";
import { visuallyHidden } from "../helper";
import RecapStrip from "./Recap/RecapStrip";
import SecondHalfLeaders from "./Leaders/SecondHalfLeaders";
import { useCurrentWeek } from "./CurrentWeekContext";
import { useIsAdmin, useSelectedUser, useWeekData } from "./useWeekData";

const TAB_TITLES: Record<AppTab, string> = {
  picks: "User Picks",
  games: "Games",
  scoreboard: "Scoreboard",
  trends: "Trends",
  [RECORDS_TAB]: "Records",
  [ADMIN_TAB]: "Admin",
};

export default function MainGrid() {
  const { currentWeek, season, secondHalfStartWeek, cbsPoolUrl } =
    useCurrentWeek();
  const { tab } = useParams<{ tab: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  // The browsed week lives in the URL (?week=3), so a reload or a shared
  // link keeps it. No param, or one out of range, means the current week,
  // which also follows meta when a new week opens.
  const urlWeek = Number(searchParams.get("week"));
  const selectedWeek =
    Number.isInteger(urlWeek) && urlWeek >= 1 && urlWeek <= currentWeek
      ? urlWeek
      : currentWeek;
  // The hot streak badge is season data as of now, with no week-by-week
  // history, so it only shows while browsing the current week.
  const isCurrentWeek = selectedWeek === currentWeek;
  const { userList, leaderboardStatus, recap, hasLiveGame, weekComplete } =
    useWeekData(season, selectedWeek);
  const [user, onUserChange] = useSelectedUser(userList);
  const selectedUser = user
    ? userList.find((entry) => entry.id === user)
    : undefined;
  const moneyStandings = useMoneyStandings(
    userList,
    user,
    selectedWeek,
    weekComplete
  );
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up("md"));
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  // After picking someone on User Picks, bring their row into view if it's
  // off screen. Runs once the menu has finished closing: until then the
  // page is scroll-locked, and the select takes focus back as it closes.
  const pendingScrollRef = useRef<string | null>(null);
  const handleUserChange = (userId: string) => {
    onUserChange(userId);
    pendingScrollRef.current = userId && activeTab === "picks" ? userId : null;
  };
  const scrollToPendingRow = () => {
    const userId = pendingScrollRef.current;
    pendingScrollRef.current = null;
    if (!userId) return;
    // The menu hands focus back to the select right after it exits, which
    // scrolls a phone back up to it; start after that.
    window.setTimeout(() => scrollToRow(userId), 50);
  };
  const scrollToRow = (userId: string) => {
    const row = [
      ...document.querySelectorAll<HTMLElement>(
        `[data-user-row="${CSS.escape(userId)}"]`
      ),
    ].find((el) => el.offsetParent !== null);
    if (!row) return;
    const { top, bottom } = row.getBoundingClientRect();
    if (top >= 0 && bottom <= window.innerHeight) return;
    const reduce = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    row.scrollIntoView({
      block: "center",
      behavior: reduce ? "auto" : "smooth",
    });
  };

  const openUserMenu = () => {
    document
      .getElementById("user-drop-down")
      ?.scrollIntoView({ block: "center" });
    setUserMenuOpen(true);
  };
  const isAdmin = useIsAdmin();

  const activeTab: AppTab | null = isPrimaryTab(tab)
    ? tab
    : tab === ADMIN_TAB || tab === RECORDS_TAB
      ? tab
      : null;
  // Pipeline status has nothing to do with a week or a player, so the admin
  // page drops the dropdowns and the selected-player header.
  const showPlayerControls = activeTab !== ADMIN_TAB;
  // Games is pregame research and Records is all-time, so neither shows
  // the player's picks or money; the picker keeps name, place and score.
  const showWeekPicks = activeTab !== "games" && activeTab !== RECORDS_TAB;

  // /:tab only matches known routes explicitly (see the "*" catch-all in
  // App.tsx), but the param itself could still be anything -- redirect an
  // unrecognized value back through "/" so it re-resolves to the stored
  // tab (or the cold-start default) instead of rendering a blank tab.
  useEffect(() => {
    if (activeTab === null) {
      navigate(`/${getInitialTab()}`, { replace: true });
    }
  }, [activeTab, navigate]);

  // Phones don't show the site name, so the browser tab carries it, and a
  // tab change reads as a page change.
  useEffect(() => {
    if (activeTab !== null) {
      document.title = `${TAB_TITLES[activeTab]} · Morlocked Pick'em`;
    }
  }, [activeTab]);

  // A past week carries over to the next tab; other params (Trends'
  // ?view=) belong to the tab they were set on.
  const weekSearch = isCurrentWeek ? "" : `?week=${selectedWeek}`;
  const handleTabChange = (_: React.SyntheticEvent, value: AppTab) => {
    if (isPrimaryTab(value)) {
      setStoredTab(value);
    }
    navigate({ pathname: `/${value}`, search: weekSearch });
  };

  const onWeekChange = (week: number): void => {
    setSearchParams((params) => {
      if (week === currentWeek) params.delete("week");
      else params.set("week", String(week));
      return params;
    });
  };

  return (
    <Box sx={{ width: "100%", maxWidth: { sm: "100%", md: "1700px" } }}>
      {/* cards */}
      {currentWeek !== 0 && activeTab !== null && (
        <>
          {/* Desktop: a small site name, then the week's picks, the Week
              pill and the player card (place, score, money lines). Phones
              drop the visible site name (the browser tab carries it) and
              put the Week pill and player picker on one row, picks below
              (also below from md to lg, where the row can't fit them). */}
          <Box
            component="header"
            sx={{
              mt: 2,
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              columnGap: 2,
              rowGap: 1.25,
            }}
          >
            <Typography
              component="h1"
              sx={(theme) => ({
                mr: "auto",
                fontSize: "0.9375rem",
                fontWeight: 700,
                letterSpacing: "-0.01em",
                whiteSpace: "nowrap",
                [theme.breakpoints.down("md")]: visuallyHidden,
              })}
            >
              Morlocked{" "}
              <Box
                component="span"
                sx={{ color: "text.secondary", fontWeight: 500 }}
              >
                Pick'em
              </Box>
            </Typography>
            {showPlayerControls && showWeekPicks && selectedUser && (
              <Box
                // Beside the Week pill from lg; below the header row on
                // narrower screens, where the card needs the room.
                sx={{
                  order: { xs: 3, lg: 0 },
                  width: { xs: "100%", lg: "auto" },
                }}
              >
                {UserGamePicksStack(
                  selectedUser.picks,
                  true,
                  selectedUser.has_submitted_picks
                )}
              </Box>
            )}
            {showPlayerControls && activeTab !== RECORDS_TAB && (
              // Records isn't weekly data, so there's no week to pick.
              <WeekDropdown
                currentWeek={currentWeek}
                selectedWeek={selectedWeek}
                onWeekChange={onWeekChange}
              />
            )}
            {showPlayerControls && (
              <UserSelectDropdown
                userList={userList}
                user={user}
                onUserChange={handleUserChange}
                open={userMenuOpen}
                onOpenChange={setUserMenuOpen}
                onMenuClosed={scrollToPendingRow}
                summary={isDesktop ? "card" : "compact"}
                standings={showWeekPicks ? moneyStandings : []}
              />
            )}
          </Box>

          <Box
            sx={{
              mt: 1.5,
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
                  // Taller tap targets on phones; the width is unchanged.
                  minHeight: { xs: 44, sm: "fit-content" },
                },
              }}
            >
              <Tab
                // One span: Tab lays its children out as a flex column, so
                // "User" and "Picks" as siblings would stack.
                label={
                  <span>
                    <Box
                      component="span"
                      sx={{ display: { xs: "none", sm: "inline" } }}
                    >
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
                  <Box
                    component="span"
                    sx={{ display: { xs: "none", sm: "inline" } }}
                  >
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
                  // The theme gives every tab a transparent border on all
                  // four sides; only the left one is the divider.
                  borderLeftColor: "divider",
                  borderRadius: 0,
                  color: "#8a6a0f",
                  "& .MuiTab-icon": { mr: { xs: 0, sm: 1 } },
                  "&.Mui-selected": { color: "#8a6a0f" },
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
                    borderLeftColor: "divider",
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

          {!isCurrentWeek &&
            activeTab !== RECORDS_TAB &&
            activeTab !== ADMIN_TAB && (
              <PastWeekNotice
                week={selectedWeek}
                currentWeek={currentWeek}
                onBack={() => onWeekChange(currentWeek)}
              />
            )}

          <Grid container spacing={2} columns={12} sx={{ mt: 2 }}>
            <Grid
              size={{ xs: 12, lg: 12 }}
              sx={{ display: activeTab === "picks" ? "block" : "none" }}
            >
              {!user && userList.length > 0 && (
                <PickYourselfHint onChoose={openUserMenu} />
              )}
              {selectedWeek >= secondHalfStartWeek && (
                <SecondHalfLeaders
                  userList={userList}
                  userId={user}
                  week={selectedWeek}
                />
              )}
              <RecapStrip recap={recap} isCurrentWeek={isCurrentWeek} />
              <UsersTable
                userList={userList}
                leaderboardStatus={leaderboardStatus}
                userId={user}
                showSecondHalf={selectedWeek >= secondHalfStartWeek}
                week={selectedWeek}
                season={season}
                recap={recap}
                showStreak={isCurrentWeek}
                moneyStandings={moneyStandings}
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
              <TrendsSection
                season={season}
                week={selectedWeek}
                recap={recap}
                userList={userList}
                userId={user}
              />
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
