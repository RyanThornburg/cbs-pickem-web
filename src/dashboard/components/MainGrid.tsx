import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import Badge from "@mui/material/Badge";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Grid from "@mui/material/Grid";
import Skeleton from "@mui/material/Skeleton";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import Typography from "@mui/material/Typography";
import useMediaQuery from "@mui/material/useMediaQuery";
import { useTheme } from "@mui/material/styles";
import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";

import AppShellStatus from "./AppShellStatus";
import TabIntro, { PastWeekContext, PastWeekInfo } from "./TabIntro";
import TabSkeleton, { TabSkeletonShape } from "./TabSkeleton";
import GamesCard from "./GamesCard";
import Scoreboard from "./Scoreboard";
import TrendsSection from "./TrendsSection";
import UserSelectDropdown from "./UserSelectDropdown";
import PickYourselfHint from "./PickYourselfHint";
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
import { ordinal, visuallyHidden } from "../helper";
import { PHONE_TAB_BAR_OFFSET, PhoneTabBar } from "./PhoneTabBar";
import RecapStrip from "./Recap/RecapStrip";
import SecondHalfLeaders from "./Leaders/SecondHalfLeaders";
import { useCurrentWeek } from "./CurrentWeekContext";
import { useIsAdmin, useSelectedUser, useWeekData } from "./useWeekData";
import { MONEY_GOLD } from "./UsersTable/StandingsStatus";
import { TabActiveContext, followTabLink, tabHref } from "./tabLinks";

// All-time records and the owner-only admin page aren't weekly, and most
// visits never open them, so they load on first open.
const RecordsSection = lazy(() => import("./RecordsSection"));
const AdminPanel = lazy(() => import("./AdminPanel"));

// What each tab's loading placeholder looks like (see TabSkeleton).
const TAB_SKELETONS: Record<AppTab, TabSkeletonShape> = {
  picks: "rows",
  games: "cards",
  scoreboard: "cards",
  trends: "cards",
  [RECORDS_TAB]: "tiles",
  [ADMIN_TAB]: "rows",
};

const TAB_TITLES: Record<AppTab, string> = {
  picks: "User Picks",
  games: "Games",
  scoreboard: "Scoreboard",
  trends: "Trends",
  [RECORDS_TAB]: "Records",
  [ADMIN_TAB]: "Admin",
};

export default function MainGrid() {
  const {
    metaStatus,
    retryMeta,
    currentWeek,
    season,
    secondHalfStartWeek,
    cbsPoolUrl,
  } = useCurrentWeek();
  // Until meta first loads there's no season or week, so the header and
  // tabs render around placeholders instead of the page staying blank.
  const metaReady = metaStatus === "ready";
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
  // The header (Week pill, player card with its money lines, picks) is the
  // same on every tab but Admin, so it never changes shape when you switch.

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

  // A ?week= that isn't a past week (out of range, not a number, or the
  // current week itself) shows the current week, so the URL drops it rather
  // than keep a link that says something else; "03" is rewritten as "3".
  const weekParam = searchParams.get("week");
  useEffect(() => {
    if (!metaReady || weekParam === null) return;
    const canonical = isCurrentWeek ? null : String(selectedWeek);
    if (weekParam === canonical) return;
    setSearchParams(
      (params) => {
        if (canonical) params.set("week", canonical);
        else params.delete("week");
        return params;
      },
      { replace: true }
    );
  }, [metaReady, weekParam, selectedWeek, isCurrentWeek, setSearchParams]);

  // A past week carries over to the next tab; other params (Trends'
  // ?view=) belong to the tab they were set on.
  const weekSearch = isCurrentWeek ? "" : `?week=${selectedWeek}`;
  // Each desktop tab is a link to its route (see tabLinks.ts). MUI's Tabs
  // still draws the row and the indicator, but its tab roles and roving
  // focus are swapped for plain links, each in the tab order.
  const navTabProps = (value: AppTab) => ({
    value,
    component: "a" as const,
    href: tabHref(value, weekSearch),
    onClick: (event: React.MouseEvent) => followTabLink(event, value, goToTab),
    role: undefined,
    tabIndex: 0,
    "aria-selected": undefined,
    "aria-current": activeTab === value ? ("page" as const) : undefined,
  });

  // Skips the header and tab row to the active tab's content.
  const mainContentRef = useRef<HTMLDivElement>(null);
  const skipToContent = (event: React.MouseEvent) => {
    event.preventDefault();
    mainContentRef.current?.focus();
  };
  // A new tab starts at its top, not at the old tab's scroll position.
  const goToTab = (value: AppTab) => {
    if (isPrimaryTab(value)) {
      setStoredTab(value);
    }
    navigate({ pathname: `/${value}`, search: weekSearch });
    window.scrollTo({ top: 0 });
  };

  // Desktop's tab row sticks to the top once the header scrolls away, and
  // then names the week and player, since the header that did is gone.
  const tabRowSentinel = useRef<HTMLDivElement>(null);
  const [tabRowStuck, setTabRowStuck] = useState(false);
  useEffect(() => {
    const sentinel = tabRowSentinel.current;
    if (!sentinel) return undefined;
    const observer = new IntersectionObserver(([entry]) =>
      setTabRowStuck(!entry.isIntersecting && entry.boundingClientRect.top < 0)
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [currentWeek, activeTab]);

  // On a past week each weekly tab's intro row says so (TabIntro, through
  // PastWeekContext). On phones the same marker joins the tab bar once the
  // shown tab's marker has scrolled away, so the two never show (with two
  // "Back" buttons) at once.
  const [pastNotice, setPastNotice] = useState<HTMLDivElement | null>(null);
  const [pastNoticeGone, setPastNoticeGone] = useState(false);
  const pastWeekInfo: PastWeekInfo | null = isCurrentWeek
    ? null
    : {
        currentWeek,
        onBack: () => onWeekChange(currentWeek),
        noticeRef: setPastNotice,
      };
  useEffect(() => {
    const notice = pastNotice;
    setPastNoticeGone(false);
    if (!notice) return undefined;
    const observer = new IntersectionObserver(([entry]) =>
      setPastNoticeGone(
        !entry.isIntersecting && entry.boundingClientRect.top < 0
      )
    );
    observer.observe(notice);
    return () => observer.disconnect();
  }, [pastNotice]);

  const onWeekChange = (week: number): void => {
    setSearchParams((params) => {
      if (week === currentWeek) params.delete("week");
      else params.set("week", String(week));
      return params;
    });
  };

  return (
    <Box
      sx={{
        width: "100%",
        maxWidth: { sm: "100%", md: "1700px" },
        // Room for the phone tab bar, so it never covers the page's end.
        pb: { xs: PHONE_TAB_BAR_OFFSET, md: 0 },
      }}
    >
      {activeTab !== null && (
        <>
          <Box
            component="a"
            href="#main-content"
            onClick={skipToContent}
            sx={{
              ...visuallyHidden,
              "&:focus": {
                clip: "auto",
                clipPath: "none",
                width: "auto",
                height: "auto",
                margin: 0,
                position: "fixed",
                top: 8,
                left: 8,
                zIndex: "tooltip",
                px: 2,
                py: 1,
                borderRadius: 2,
                bgcolor: "background.paper",
                color: "text.primary",
                fontWeight: 600,
                fontSize: "0.875rem",
                boxShadow: "0 6px 14px -6px hsla(220, 30%, 5%, 0.35)",
              },
            }}
          >
            Skip to content
          </Box>
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
              columnGap: { xs: 1, md: 2 },
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
            {showPlayerControls && selectedUser && (
              <Box
                // Beside the Week pill from lg. Below that the row can't
                // fit them, so they drop under it: under the card (right
                // aligned) from md, full width on phones.
                role="group"
                // The selected player isn't always the viewer (there's no
                // login), so the visible label stays neutral; the name sits
                // beside it, but screen readers need it in the group name.
                aria-label={`${selectedUser.name}'s picks`}
                sx={{
                  order: { xs: 3, lg: 0 },
                  width: { xs: "100%", lg: "auto" },
                  display: "flex",
                  alignItems: "center",
                  justifyContent: { xs: "flex-start", md: "flex-end" },
                  gap: 1,
                }}
              >
                <Box
                  component="span"
                  aria-hidden
                  sx={{
                    flexShrink: 0,
                    fontSize: "0.75rem",
                    lineHeight: 1.2,
                    fontWeight: 500,
                    color: "text.secondary",
                  }}
                >
                  Picks
                </Box>
                {UserGamePicksStack(
                  selectedUser.picks,
                  true,
                  selectedUser.has_submitted_picks
                )}
              </Box>
            )}
            {showPlayerControls && !metaReady && (
              // The Week pill and player picker, sized like the real ones;
              // still and faded once the load has failed.
              <Box
                sx={{
                  display: "contents",
                  "& .MuiSkeleton-root": {
                    opacity: metaStatus === "failed" ? 0.45 : 1,
                  },
                }}
              >
                <Skeleton
                  animation={metaStatus === "failed" ? false : "pulse"}
                  variant="rounded"
                  height={40}
                  sx={{ width: { xs: 72, md: 88 }, borderRadius: "999px" }}
                />
                <Skeleton
                  animation={metaStatus === "failed" ? false : "pulse"}
                  variant="rounded"
                  sx={{
                    height: { xs: 40, md: 59 },
                    width: { md: 300 },
                    flex: { xs: 1, md: "none" },
                    borderRadius: { xs: 1, md: "10px" },
                  }}
                />
              </Box>
            )}
            {metaReady && showPlayerControls && (
              // Kept on Records too: it sets the week the header's picks,
              // place and money are from.
              <WeekDropdown
                currentWeek={currentWeek}
                selectedWeek={selectedWeek}
                onWeekChange={onWeekChange}
              />
            )}
            {metaReady && showPlayerControls && (
              <UserSelectDropdown
                userList={userList}
                user={user}
                onUserChange={handleUserChange}
                open={userMenuOpen}
                onOpenChange={setUserMenuOpen}
                onMenuClosed={scrollToPendingRow}
                summary={isDesktop ? "card" : "compact"}
                standings={moneyStandings}
                asOfWeek={isCurrentWeek ? undefined : selectedWeek}
              />
            )}
            {cbsPoolUrl && (
              // On phones the tab row is the bottom bar, so the CBS link
              // joins the header row.
              <IconButton
                href={cbsPoolUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Open the pool on CBS Sports (new tab)"
                sx={{
                  display: { xs: "inline-flex", md: "none" },
                  width: 36,
                  height: 40,
                  mr: -0.5,
                  color: "text.secondary",
                }}
              >
                <OpenInNewIcon fontSize="small" />
              </IconButton>
            )}
          </Box>

          <Box ref={tabRowSentinel} aria-hidden sx={{ height: 0 }} />
          {/* Desktop only; phones get PhoneTabBar at the bottom. */}
          <Box
            component="nav"
            aria-label="Sections"
            sx={{
              mt: 1.5,
              borderBottom: 1,
              borderColor: "divider",
              display: { xs: "none", md: "flex" },
              alignItems: "center",
              // Out into the page's side margins, so rows don't show beside
              // the bar once it's stuck.
              mx: -3,
              px: 3,
              position: "sticky",
              top: 0,
              zIndex: "appBar",
              bgcolor: "background.paper",
              // Floats once stuck, so it gets the float shadow then.
              boxShadow: tabRowStuck
                ? "0 6px 14px -8px hsla(220, 30%, 5%, 0.25)"
                : "none",
              transition: "box-shadow 150ms ease-out",
            }}
          >
            <Tabs
              value={activeTab}
              variant="scrollable"
              slotProps={{ list: { role: undefined } }}
              scrollButtons="auto"
              sx={{
                flex: 1,
                minWidth: 0,
                "& .MuiTab-root": { px: 1 },
                // The scroller clips anything outside the tabs, so the
                // focus ring goes inside the tab instead of around it.
                "& .MuiTab-root:focus-visible": { outlineOffset: "-3px" },
              }}
            >
              <Tab label="User Picks" {...navTabProps("picks")} />
              <Tab label="Games" {...navTabProps("games")} />
              <Tab
                label={
                  <Badge
                    color="error"
                    variant="dot"
                    invisible={!hasLiveGame || activeTab === "scoreboard"}
                  >
                    Scoreboard
                    {hasLiveGame && activeTab !== "scoreboard" && (
                      <Box component="span" sx={visuallyHidden}>
                        , games in progress
                      </Box>
                    )}
                  </Badge>
                }
                {...navTabProps("scoreboard")}
              />
              <Tab label="Trends" {...navTabProps("trends")} />
              {/* Set apart like Admin: all-time data, not this week's. */}
              <Tab
                label="Records"
                {...navTabProps(RECORDS_TAB)}
                icon={<EmojiEventsIcon fontSize="small" />}
                iconPosition="start"
                sx={{
                  ml: 1,
                  pl: 1.5,
                  minWidth: 0,
                  // The theme gives every tab a transparent border on all
                  // four sides; only the left one is the divider.
                  borderLeftColor: "divider",
                  borderRadius: 0,
                  color: MONEY_GOLD,
                  "& .MuiTab-icon": { mr: 1 },
                  "&.Mui-selected": { color: MONEY_GOLD },
                }}
              />
              {/* Also rendered while on /admin itself so the Tabs value stays
                  valid even before (or if) the admin check comes back. */}
              {(isAdmin || activeTab === ADMIN_TAB) && (
                <Tab
                  label="Admin"
                  {...navTabProps(ADMIN_TAB)}
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
            {tabRowStuck && (
              <Typography
                variant="body2"
                sx={{
                  flexShrink: 0,
                  px: 1,
                  color: "text.secondary",
                  whiteSpace: "nowrap",
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {metaReady && activeTab !== ADMIN_TAB && (
                  <>
                    Week{" "}
                    <Box component="span" sx={{ color: "text.primary" }}>
                      {selectedWeek}
                    </Box>
                    {!isCurrentWeek && ", past week"}
                  </>
                )}
                {selectedUser &&
                  activeTab !== ADMIN_TAB &&
                  ` · ${selectedUser.name}`}
                {selectedUser?.place != null && activeTab !== ADMIN_TAB && (
                  <>
                    {" · "}
                    <Box
                      component="span"
                      sx={{ color: "text.primary", fontWeight: 600 }}
                    >
                      {ordinal(selectedUser.place)}
                    </Box>
                  </>
                )}
              </Typography>
            )}
            {cbsPoolUrl && (
              <Button
                href={cbsPoolUrl}
                target="_blank"
                rel="noopener noreferrer"
                size="small"
                aria-label="CBS Pool (opens in a new tab)"
                endIcon={<OpenInNewIcon />}
                sx={{ flexShrink: 0, whiteSpace: "nowrap" }}
              >
                CBS Pool
              </Button>
            )}
          </Box>

          <Box
            id="main-content"
            ref={mainContentRef}
            tabIndex={-1}
            sx={{ outline: "none" }}
          >
            <PastWeekContext.Provider value={pastWeekInfo}>
              {/* Each tab opens with a TabIntro (its heading and controls):
                the weekly tab components render their own, since the
                controls are theirs; the rest are here. */}
              {!metaReady && (
                <Box sx={{ mt: 2 }}>
                  <TabIntro title={TAB_TITLES[activeTab]} />
                  <AppShellStatus
                    metaStatus={metaStatus}
                    onRetry={retryMeta}
                    shape={TAB_SKELETONS[activeTab]}
                    cbsPoolUrl={cbsPoolUrl}
                  />
                </Box>
              )}
              {metaReady && (
                <Grid container spacing={2} columns={12} sx={{ mt: 2 }}>
                  <Grid
                    size={{ xs: 12, lg: 12 }}
                    sx={{ display: activeTab === "picks" ? "block" : "none" }}
                  >
                    <TabActiveContext.Provider value={activeTab === "picks"}>
                      <TabIntro title={TAB_TITLES.picks} week={selectedWeek} />
                    </TabActiveContext.Provider>
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
                    <TabActiveContext.Provider value={activeTab === "games"}>
                      <GamesCard week={selectedWeek} recap={recap} />
                    </TabActiveContext.Provider>
                  </Grid>
                  <Grid
                    size={{ xs: 12, lg: 12 }}
                    sx={{
                      display: activeTab === "scoreboard" ? "block" : "none",
                    }}
                  >
                    <TabActiveContext.Provider
                      value={activeTab === "scoreboard"}
                    >
                      <Scoreboard
                        week={selectedWeek}
                        userId={user}
                        totalUsers={userList.length}
                        recap={recap}
                      />
                    </TabActiveContext.Provider>
                  </Grid>
                  <Grid
                    size={{ xs: 12, lg: 12 }}
                    sx={{ display: activeTab === "trends" ? "block" : "none" }}
                  >
                    <TabActiveContext.Provider value={activeTab === "trends"}>
                      <TrendsSection
                        season={season}
                        week={selectedWeek}
                        recap={recap}
                        userList={userList}
                        userId={user}
                      />
                    </TabActiveContext.Provider>
                  </Grid>
                  {activeTab === RECORDS_TAB && (
                    <Grid size={{ xs: 12, lg: 12 }}>
                      <TabIntro title={TAB_TITLES[RECORDS_TAB]} />
                      <Suspense
                        fallback={
                          <TabSkeleton
                            shape="tiles"
                            label="Loading the records"
                          />
                        }
                      >
                        <RecordsSection season={season} userId={user} />
                      </Suspense>
                    </Grid>
                  )}
                  {/* Mounted only while open, so admin data is never polled in the
                background from the public tabs. */}
                  {activeTab === ADMIN_TAB && (
                    <Grid size={{ xs: 12, lg: 12 }}>
                      <Suspense
                        fallback={
                          <TabSkeleton
                            shape="rows"
                            label="Loading the admin page"
                          />
                        }
                      >
                        <AdminPanel />
                      </Suspense>
                    </Grid>
                  )}
                </Grid>
              )}
            </PastWeekContext.Provider>
          </Box>
          <PhoneTabBar
            activeTab={activeTab}
            onChange={goToTab}
            search={weekSearch}
            hasLiveGame={hasLiveGame}
            showAdmin={isAdmin || activeTab === ADMIN_TAB}
            pastWeek={
              !isCurrentWeek &&
              pastNoticeGone &&
              activeTab !== RECORDS_TAB &&
              activeTab !== ADMIN_TAB
                ? {
                    week: selectedWeek,
                    currentWeek,
                    onBack: () => onWeekChange(currentWeek),
                  }
                : undefined
            }
          />
        </>
      )}
    </Box>
  );
}
