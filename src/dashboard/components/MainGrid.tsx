import {
  lazy,
  startTransition,
  Suspense,
  useEffect,
  useLayoutEffect,
  useMemo,
  useOptimistic,
  useRef,
  useState,
} from "react";
import {
  useLocation,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";

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
  LEGACY_NFL_TABS,
  PLAYERS_TAB,
  RECORDS_TAB,
  getInitialTab,
  isPrimaryTab,
  setStoredTab,
} from "../utils/defaultTab";
import NflViewSwitch, { NflViewContext } from "./Nfl/NflViewSwitch";
import { useTrackBackTargets } from "./shared/backTarget";
import StandingsView from "./Nfl/StandingsView";
import TeamPage from "./Nfl/TeamPage";
import {
  NflView,
  defaultNflView,
  isNflView,
  readNflChoice,
  saveNflChoice,
} from "./Nfl/nflView";
import PlayerChooser from "./Players/PlayerChooser";
import PlayerPage from "./Players/PlayerPage";
import UsersTable from "./UsersTable";
import { UserGamePicksStack } from "./UsersTable/UserPickStack";
import { useMoneyStandings } from "./UsersTable/useMoneyStandings";
import { ordinal } from "../helper";
import { PhoneTabBar } from "./PhoneTabBar";
import RecapStrip from "./Recap/RecapStrip";
import SegmentLeaders from "./Leaders/SegmentLeaders";
import { shownSegment } from "../utils/payPeriods";
import { useCurrentWeek } from "./CurrentWeekContext";
import { useIsAdmin, useSelectedUser, useWeekData } from "./useWeekData";
import { TabActiveContext, followTabLink, tabHref } from "./tabLinks";
import { useStableHandler } from "./shared/useStableHandler";
import { playerPath } from "./shared/PlayerLink";
import type { View as TrendsView } from "./TrendsSection";
import { Button } from "../ui/Button";
import { Icon } from "../ui/Icon";
import { IconButton } from "../ui/IconButton";
import { Skeleton } from "../ui/Skeleton";
import { UP_MD, useMediaQuery } from "../ui/useMediaQuery";
import uiStyles from "../ui/ui.module.css";
import { DesktopTabs } from "./DesktopTabs";
import tabStyles from "./DesktopTabs.module.css";
import styles from "./MainGrid.module.css";

// All-time records and the owner-only admin page aren't weekly, and most
// visits never open them, so they load on first open.
const RecordsSection = lazy(() => import("./RecordsSection"));
const AdminPanel = lazy(() => import("./AdminPanel"));

// What each tab's loading placeholder looks like (see TabSkeleton).
const TAB_SKELETONS: Record<AppTab, TabSkeletonShape> = {
  picks: "rows",
  nfl: "cards",
  trends: "cards",
  [RECORDS_TAB]: "tiles",
  [ADMIN_TAB]: "rows",
  [PLAYERS_TAB]: "rows",
};

const TAB_TITLES: Record<AppTab, string> = {
  picks: "User Picks",
  nfl: "NFL",
  trends: "Trends",
  [RECORDS_TAB]: "Records",
  [ADMIN_TAB]: "Admin",
  [PLAYERS_TAB]: "You",
};

// The same element every render, so the memoized views it sits in don't
// re-render for it; its state comes through NflViewContext.
const VIEW_SWITCH = <NflViewSwitch />;

const NFL_VIEW_TITLES: Record<NflView, string> = {
  games: "Games",
  live: "Live",
  standings: "Standings",
};

export default function MainGrid() {
  useTrackBackTargets();
  const { metaStatus, retryMeta, currentWeek, season, periods, cbsPoolUrl } =
    useCurrentWeek();
  // Until meta first loads there's no season or week, so the header and
  // tabs render around placeholders instead of the page staying blank.
  const metaReady = metaStatus === "ready";
  const { tab, teamSlug, playerId } = useParams<{
    tab: string;
    teamSlug: string;
    playerId: string;
  }>();
  const { pathname, key: locationKey } = useLocation();
  // Team pages (/nfl/teams/buf) sit under the NFL tab; player pages
  // (/players/:id, and /players for the selected player) are the You tab's.
  const routeTab = teamSlug
    ? "nfl"
    : pathname.startsWith("/players")
      ? PLAYERS_TAB
      : tab;
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
  // The prize segment with its own columns and leader card this week (the
  // 2nd half from week 10 in 2026), or null.
  const selectedSegment = shownSegment(periods, selectedWeek);
  const {
    userList,
    leaderboardStatus,
    retryLeaderboard,
    recap,
    hasLiveGame,
    liveKnown,
    weekComplete,
  } = useWeekData(season, selectedWeek);
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
  const isDesktop = useMediaQuery(UP_MD);
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

  const activeTab: AppTab | null = isPrimaryTab(routeTab)
    ? routeTab
    : routeTab === ADMIN_TAB ||
        routeTab === RECORDS_TAB ||
        routeTab === PLAYERS_TAB
      ? routeTab
      : null;
  // The player whose page is open: /players/:id, or the selected player on
  // plain /players. The You tab is only lit on the selected player's page.
  const pagePlayerId =
    activeTab === PLAYERS_TAB ? (playerId ?? user) || undefined : undefined;
  // The same money lines for whoever's page is open.
  const pageMoneyStandings = useMoneyStandings(
    userList,
    pagePlayerId ?? "",
    selectedWeek,
    weekComplete
  );
  const navTab: AppTab | null =
    activeTab === PLAYERS_TAB && playerId && playerId !== user
      ? null
      : activeTab;
  // navTab, or the tab just tapped while it renders (see goToTab).
  const [shownTab, setShownTab] = useOptimistic(navTab);

  // The NFL tab's view lives in ?view=. Plain /nfl picks one: a view
  // chosen by hand earlier in the visit, else the day's rule (Live while a
  // game is on or from the Sunday deadline through Monday, Games
  // otherwise), which waits for the live check unless the clock already
  // says Live.
  const viewParam = searchParams.get("view");
  const urlNflView = isNflView(viewParam) ? viewParam : null;
  const onNflList = activeTab === "nfl" && !teamSlug;
  const ruleView =
    liveKnown || defaultNflView(new Date(), false) === "live"
      ? defaultNflView(new Date(), hasLiveGame)
      : null;
  const pendingNflView = readNflChoice() ?? ruleView;
  const nflView: NflView | null = urlNflView ?? pendingNflView;
  useEffect(() => {
    if (!onNflList || urlNflView || !pendingNflView) return;
    setSearchParams(
      (params) => {
        params.set("view", pendingNflView);
        return params;
      },
      { replace: true }
    );
  }, [onNflList, urlNflView, pendingNflView, setSearchParams]);
  // Tab and NFL view changes scroll to the top once the new page is in
  // (the layout effect below).
  const scrollTopOnCommit = useRef(false);
  // A tapped view lights up in the switch at once (an optimistic value);
  // the view itself renders in a transition, so the tap paints right away.
  const [shownNflView, setShownNflView] = useOptimistic(nflView);
  const changeNflView = useStableHandler((view: NflView) => {
    saveNflChoice(view);
    startTransition(() => {
      setShownNflView(view);
      setSearchParams((params) => {
        params.set("view", view);
        return params;
      });
    });
    scrollTopOnCommit.current = true;
  });
  const nflViewState = useMemo(
    () => ({ view: shownNflView, onChange: changeNflView, hasLiveGame }),
    [shownNflView, changeNflView, hasLiveGame]
  );
  // Trends' Week/Season (?view=) is read here and handed down, see
  // TrendsSection's props.
  const trendsUrlView = routeTab === "trends" ? viewParam : null;
  const changeTrendsView = useStableHandler((view: TrendsView) => {
    setSearchParams(
      (params) => {
        params.set("view", view);
        return params;
      },
      { replace: true }
    );
  });
  const openPlayer = useStableHandler((id: string) => {
    navigate(playerPath(id));
    window.scrollTo({ top: 0 });
  });
  // Pipeline status has nothing to do with a week or a player, so the admin
  // page drops the dropdowns and the selected-player header.
  const showPlayerControls = activeTab !== ADMIN_TAB;
  // The header (Week pill, player card with its money lines, picks) is the
  // same on every tab but Admin, so it never changes shape when you switch.

  // /:tab only matches known routes explicitly (see the "*" catch-all in
  // App.tsx), but the param itself could still be anything -- redirect an
  // unrecognized value back through "/" so it re-resolves to the stored
  // tab (or the cold-start default) instead of rendering a blank tab.
  // The old Games and Scoreboard tabs land on the matching NFL view, with
  // the browsed week.
  useEffect(() => {
    if (activeTab !== null) return;
    const legacyView = tab ? LEGACY_NFL_TABS[tab] : undefined;
    if (legacyView) {
      const params = new URLSearchParams(searchParams);
      params.set("view", legacyView);
      navigate(`/nfl?${params}`, { replace: true });
      return;
    }
    navigate(`/${getInitialTab()}`, { replace: true });
  }, [activeTab, navigate, tab, searchParams]);

  // Phones don't show the site name, so the browser tab carries it, and a
  // tab change reads as a page change.
  // Team and player pages name themselves once their data is in.
  const pageTitle =
    activeTab === "nfl" && nflView && !teamSlug
      ? NFL_VIEW_TITLES[nflView]
      : activeTab !== null && !teamSlug && !pagePlayerId
        ? TAB_TITLES[activeTab]
        : null;
  useEffect(() => {
    if (pageTitle) {
      document.title = `${pageTitle} · Morlocked Pick'em`;
    }
  }, [pageTitle]);

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
  // Each desktop tab is a link to its route (see tabLinks.ts), in the tab
  // order like any link; DesktopTabs draws the row and the underline.
  const navTabProps = (value: AppTab, className?: string) => ({
    href: tabHref(value, weekSearch),
    onClick: (event: React.MouseEvent) => followTabLink(event, value, goToTab),
    "aria-current": shownTab === value ? ("page" as const) : undefined,
    "data-tab": value,
    className: [
      tabStyles.tab,
      shownTab === value && tabStyles.selected,
      className,
    ]
      .filter(Boolean)
      .join(" "),
  });

  useLayoutEffect(() => {
    if (!scrollTopOnCommit.current) return;
    scrollTopOnCommit.current = false;
    window.scrollTo({ top: 0 });
  }, [locationKey]);

  // Skips the header and tab row to the active tab's content.
  const mainContentRef = useRef<HTMLDivElement>(null);
  const skipToContent = (event: React.MouseEvent) => {
    event.preventDefault();
    mainContentRef.current?.focus();
  };
  // A new tab starts at its top, not at the old tab's scroll position.
  // The tapped tab lights up at once (shownTab, set in goToTab) and the
  // tab itself renders in a transition, so the tap paints without waiting
  // for it; the scroll waits for the new tab, so the old one doesn't jump
  // first.
  const goToTab = (value: AppTab) => {
    if (isPrimaryTab(value)) {
      setStoredTab(value);
    }
    startTransition(() => {
      setShownTab(value);
      navigate({ pathname: `/${value}`, search: weekSearch });
    });
    scrollTopOnCommit.current = true;
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
  const backToCurrentWeek = useStableHandler(() => onWeekChange(currentWeek));
  // Memoized: every TabIntro reads it, including those in memoized tabs.
  const pastWeekInfo: PastWeekInfo | null = useMemo(
    () =>
      isCurrentWeek
        ? null
        : { currentWeek, onBack: backToCurrentWeek, noticeRef: setPastNotice },
    [isCurrentWeek, currentWeek, backToCurrentWeek]
  );
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
    <div className={styles.page}>
      {activeTab !== null && (
        <>
          <a
            href="#main-content"
            onClick={skipToContent}
            className={styles.skipLink}
          >
            Skip to content
          </a>
          {/* Desktop: a small site name, then the week's picks, the Week
              pill and the player card (place, score, money lines). Phones
              drop the visible site name (the browser tab carries it) and
              put the Week pill and player picker on one row, picks below
              (also below from md to lg, where the row can't fit them). */}
          <header className={styles.header}>
            <h1 className={styles.siteName}>
              Morlocked <span className={styles.siteNameEnd}>Pick'em</span>
            </h1>
            {showPlayerControls && selectedUser && (
              <div
                // Beside the Week pill from lg. Below that the row can't
                // fit them, so they drop under it: under the card (right
                // aligned) from md, full width on phones.
                role="group"
                // The selected player isn't always the viewer (there's no
                // login), so the visible label stays neutral; the name sits
                // beside it, but screen readers need it in the group name.
                aria-label={`${selectedUser.name}'s picks`}
                className={styles.headerPicks}
              >
                <span aria-hidden className={styles.headerPicksLabel}>
                  Picks
                </span>
                {UserGamePicksStack(
                  selectedUser.picks,
                  true,
                  selectedUser.has_submitted_picks
                )}
              </div>
            )}
            {showPlayerControls && !metaReady && (
              // The Week pill and player picker, sized like the real ones;
              // still and faded once the load has failed.
              <>
                <Skeleton
                  variant="rounded"
                  animate={metaStatus !== "failed"}
                  className={[
                    styles.weekSkeleton,
                    metaStatus === "failed" && styles.failedSkeleton,
                  ]
                    .filter(Boolean)
                    .join(" ")}
                />
                <Skeleton
                  variant="rounded"
                  animate={metaStatus !== "failed"}
                  className={[
                    styles.playerSkeleton,
                    metaStatus === "failed" && styles.failedSkeleton,
                  ]
                    .filter(Boolean)
                    .join(" ")}
                />
              </>
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
                segment={selectedSegment}
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
                className={styles.phoneCbsLink}
              >
                <Icon name="OpenInNew" size="small" />
              </IconButton>
            )}
          </header>

          <div ref={tabRowSentinel} aria-hidden className={styles.sentinel} />
          {/* Desktop only; phones get PhoneTabBar at the bottom. */}
          <nav
            aria-label="Sections"
            className={[styles.tabRow, tabRowStuck && styles.tabRowStuck]
              .filter(Boolean)
              .join(" ")}
          >
            <DesktopTabs selected={shownTab}>
              <a {...navTabProps("picks")}>User Picks</a>
              <a {...navTabProps("nfl")}>
                <span className={tabStyles.badge}>
                  NFL
                  {hasLiveGame && activeTab !== "nfl" && (
                    <span className={uiStyles.visuallyHidden}>
                      , games in progress
                    </span>
                  )}
                  <span
                    aria-hidden
                    className={[
                      tabStyles.dot,
                      (!hasLiveGame || activeTab === "nfl") &&
                        tabStyles.dotHidden,
                    ]
                      .filter(Boolean)
                      .join(" ")}
                  />
                </span>
              </a>
              <a {...navTabProps("trends")}>Trends</a>
              <a {...navTabProps(PLAYERS_TAB)}>You</a>
              {/* Set apart like Admin: all-time data, not this week's. */}
              <a
                {...navTabProps(
                  RECORDS_TAB,
                  `${tabStyles.divided} ${tabStyles.records}`
                )}
              >
                <Icon name="EmojiEvents" size="small" />
                Records
              </a>
              {/* Also rendered while on /admin itself, before (or if) the
                  admin check comes back. */}
              {(isAdmin || activeTab === ADMIN_TAB) && (
                <a
                  {...navTabProps(
                    ADMIN_TAB,
                    `${tabStyles.divided} ${tabStyles.admin}`
                  )}
                >
                  <Icon name="AdminPanelSettings" size="small" />
                  Admin
                </a>
              )}
            </DesktopTabs>
            {tabRowStuck && (
              <p className={styles.stuckLine}>
                {metaReady && activeTab !== ADMIN_TAB && (
                  <>
                    Week <span className={styles.ink}>{selectedWeek}</span>
                    {!isCurrentWeek && ", past week"}
                  </>
                )}
                {selectedUser &&
                  activeTab !== ADMIN_TAB &&
                  ` · ${selectedUser.name}`}
                {selectedUser?.place != null && activeTab !== ADMIN_TAB && (
                  <>
                    {" · "}
                    <span className={styles.stuckPlace}>
                      {ordinal(selectedUser.place)}
                    </span>
                  </>
                )}
              </p>
            )}
            {cbsPoolUrl && (
              <Button
                href={cbsPoolUrl}
                target="_blank"
                rel="noopener noreferrer"
                size="small"
                aria-label="CBS Pool (opens in a new tab)"
                endIcon={<Icon name="OpenInNew" />}
                style={{ flexShrink: 0, whiteSpace: "nowrap" }}
              >
                CBS Pool
              </Button>
            )}
          </nav>

          <div
            id="main-content"
            ref={mainContentRef}
            tabIndex={-1}
            className={styles.mainContent}
          >
            <NflViewContext.Provider value={nflViewState}>
              <PastWeekContext.Provider value={pastWeekInfo}>
                {/* Each tab opens with a TabIntro (its heading and controls):
                the weekly tab components render their own, since the
                controls are theirs; the rest are here. */}
                {!metaReady && (
                  <div className={styles.shellBody}>
                    <TabIntro title={TAB_TITLES[activeTab]} />
                    <AppShellStatus
                      metaStatus={metaStatus}
                      onRetry={retryMeta}
                      shape={TAB_SKELETONS[activeTab]}
                      cbsPoolUrl={cbsPoolUrl}
                    />
                  </div>
                )}
                {metaReady && (
                  <div className={styles.tabPanels}>
                    <div
                      className={styles.tabPanel}
                      hidden={activeTab !== "picks"}
                    >
                      <TabActiveContext.Provider value={activeTab === "picks"}>
                        <TabIntro
                          title={TAB_TITLES.picks}
                          week={selectedWeek}
                        />
                      </TabActiveContext.Provider>
                      {!user && userList.length > 0 && (
                        <PickYourselfHint onChoose={openUserMenu} />
                      )}
                      {selectedSegment && (
                        <SegmentLeaders
                          userList={userList}
                          userId={user}
                          week={selectedWeek}
                          segment={selectedSegment}
                        />
                      )}
                      <RecapStrip recap={recap} isCurrentWeek={isCurrentWeek} />
                      <UsersTable
                        userList={userList}
                        leaderboardStatus={leaderboardStatus}
                        onRetryLeaderboard={retryLeaderboard}
                        userId={user}
                        week={selectedWeek}
                        season={season}
                        recap={recap}
                        showStreak={isCurrentWeek}
                        moneyStandings={moneyStandings}
                        onOpenPlayer={openPlayer}
                      />
                    </div>
                    {/* NFL: Games and Live stay mounted while hidden (their
                      polls pause), like the other weekly tabs; Standings and
                      team pages mount only while open. */}
                    <div className={styles.tabPanel} hidden={!onNflList}>
                      {onNflList && nflView === null && (
                        <>
                          <TabIntro title="NFL" week={selectedWeek} />
                          <TabSkeleton shape="cards" label="Loading" />
                        </>
                      )}
                      <div hidden={nflView !== "games"}>
                        <TabActiveContext.Provider
                          value={onNflList && nflView === "games"}
                        >
                          <GamesCard
                            week={selectedWeek}
                            recap={recap}
                            viewSwitch={VIEW_SWITCH}
                          />
                        </TabActiveContext.Provider>
                      </div>
                      <div hidden={nflView !== "live"}>
                        <TabActiveContext.Provider
                          value={onNflList && nflView === "live"}
                        >
                          <Scoreboard
                            week={selectedWeek}
                            userId={user}
                            totalUsers={userList.length}
                            recap={recap}
                            viewSwitch={VIEW_SWITCH}
                          />
                        </TabActiveContext.Provider>
                      </div>
                      {onNflList && nflView === "standings" && (
                        <StandingsView
                          season={season}
                          userId={user}
                          userName={selectedUser?.name}
                          intro={VIEW_SWITCH}
                        />
                      )}
                    </div>
                    {activeTab === "nfl" && teamSlug && (
                      <div className={styles.tabPanel}>
                        <TeamPage
                          season={season}
                          slug={teamSlug}
                          currentWeek={currentWeek}
                          userId={user}
                          userName={selectedUser?.name}
                        />
                      </div>
                    )}
                    {activeTab === PLAYERS_TAB && (
                      <div className={styles.tabPanel}>
                        {pagePlayerId ? (
                          <PlayerPage
                            key={pagePlayerId}
                            season={season}
                            currentWeek={currentWeek}
                            periods={periods}
                            playerId={pagePlayerId}
                            selectedId={user}
                            userList={userList}
                            moneyStandings={pageMoneyStandings}
                            onSelect={onUserChange}
                          />
                        ) : (
                          <PlayerChooser
                            userList={userList}
                            onChoose={(id) => {
                              onUserChange(id);
                              window.scrollTo({ top: 0 });
                            }}
                          />
                        )}
                      </div>
                    )}
                    <div
                      className={styles.tabPanel}
                      hidden={activeTab !== "trends"}
                    >
                      <TabActiveContext.Provider value={activeTab === "trends"}>
                        <TrendsSection
                          season={season}
                          week={selectedWeek}
                          recap={recap}
                          userList={userList}
                          userId={user}
                          urlView={trendsUrlView}
                          onUrlViewChange={changeTrendsView}
                        />
                      </TabActiveContext.Provider>
                    </div>
                    {activeTab === RECORDS_TAB && (
                      <div className={styles.tabPanel}>
                        <TabIntro title={TAB_TITLES[RECORDS_TAB]} />
                        <Suspense
                          fallback={
                            <TabSkeleton
                              shape="tiles"
                              label="Loading the records"
                            />
                          }
                        >
                          <RecordsSection
                            season={season}
                            userId={user}
                            onChoosePlayer={openUserMenu}
                          />
                        </Suspense>
                      </div>
                    )}
                    {/* Mounted only while open, so admin data is never polled in the
                background from the public tabs. */}
                    {activeTab === ADMIN_TAB && (
                      <div className={styles.tabPanel}>
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
                      </div>
                    )}
                  </div>
                )}
              </PastWeekContext.Provider>
            </NflViewContext.Provider>
          </div>
          <PhoneTabBar
            activeTab={shownTab}
            onChange={goToTab}
            search={weekSearch}
            hasLiveGame={hasLiveGame}
            showAdmin={isAdmin || activeTab === ADMIN_TAB}
            pastWeek={
              !isCurrentWeek &&
              pastNoticeGone &&
              activeTab !== RECORDS_TAB &&
              activeTab !== ADMIN_TAB &&
              activeTab !== PLAYERS_TAB &&
              !teamSlug
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
    </div>
  );
}
