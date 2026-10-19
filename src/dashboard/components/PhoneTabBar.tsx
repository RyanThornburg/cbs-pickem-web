import { useEffect } from "react";
import {
  ADMIN_TAB,
  AppTab,
  PLAYERS_TAB,
  RECORDS_TAB,
} from "../utils/defaultTab";
import { MONEY_GOLD } from "./UsersTable/StandingsStatus";
import { followTabLink, tabHref } from "./tabLinks";
import { Button } from "../ui/Button";
import { Icon, IconName } from "../ui/Icon";
import uiStyles from "../ui/ui.module.css";
import styles from "./PhoneTabBar.module.css";

// The bar's height above the phone's safe area. User Picks' pinned row sits
// on top of it, and the page leaves this much room at the bottom. While a
// past week is browsed the bar grows a strip saying so, and the offset
// follows it through a CSS variable.
export const PHONE_TAB_BAR_HEIGHT = 60;
const PAST_WEEK_STRIP_HEIGHT = 40;
const EXTRA_VAR = "--phone-tab-bar-extra";
export const PHONE_TAB_BAR_OFFSET = `calc(${PHONE_TAB_BAR_HEIGHT}px + var(${EXTRA_VAR}, 0px) + env(safe-area-inset-bottom, 0px))`;

export interface PastWeek {
  week: number;
  currentWeek: number;
  onBack: () => void;
}

interface Item {
  value: AppTab;
  label: string;
  icon: IconName;
  color?: string;
}

// Below md the tabs live in a bar fixed to the bottom of the screen, so any
// tab is one thumb tap away mid-scroll. You opens the selected player's page
// (or the list to pick one).
export function PhoneTabBar({
  activeTab,
  onChange,
  search,
  hasLiveGame,
  showAdmin,
  pastWeek,
}: {
  // null when the page isn't one of the tabs (another player's page).
  activeTab: AppTab | null;
  onChange: (value: AppTab) => void;
  // The browsed week's ?week=, carried into each tab's link.
  search: string;
  hasLiveGame: boolean;
  showAdmin: boolean;
  // Set while a past week is browsed on a weekly tab: the notice under the
  // tab row scrolls away, so the bar keeps saying it.
  pastWeek?: PastWeek;
}) {
  const showStrip = pastWeek !== undefined;
  useEffect(() => {
    const root = document.documentElement.style;
    root.setProperty(
      EXTRA_VAR,
      showStrip ? `${PAST_WEEK_STRIP_HEIGHT}px` : "0px"
    );
    return () => {
      root.removeProperty(EXTRA_VAR);
    };
  }, [showStrip]);

  const items: Item[] = [
    { value: "picks", label: "Picks", icon: "FormatListBulleted" },
    { value: "nfl", label: "NFL", icon: "SportsFootballOutlined" },
    { value: "trends", label: "Trends", icon: "ShowChart" },
    {
      value: RECORDS_TAB,
      label: "Records",
      icon: "EmojiEvents",
      color: MONEY_GOLD,
    },
    { value: PLAYERS_TAB, label: "You", icon: "PersonOutlined" },
    ...(showAdmin
      ? [
          {
            value: ADMIN_TAB,
            label: "Admin",
            icon: "AdminPanelSettings",
            // The warning palette's dark shade.
            color: "var(--warning-dark)",
          } as Item,
        ]
      : []),
  ];

  return (
    <nav aria-label="Sections" className={styles.bar}>
      {pastWeek && (
        <div className={styles.pastWeek}>
          <Icon name="History" size="inherit" className={styles.pastIcon} />
          <span className={styles.pastText}>
            <span className={styles.pastWeekName}>Week {pastWeek.week}</span>
            <span className={styles.muted}> · past week</span>
          </span>
          <Button
            size="small"
            onClick={pastWeek.onBack}
            style={{ flexShrink: 0 }}
          >
            Back to week {pastWeek.currentWeek}
          </Button>
        </div>
      )}
      <div
        className={styles.items}
        style={{ gridTemplateColumns: `repeat(${items.length}, 1fr)` }}
      >
        {items.map(({ value, label, icon, color }) => {
          const selected = value === activeTab;
          const live = value === "nfl" && hasLiveGame && !selected;
          return (
            <a
              key={value}
              href={tabHref(value, search)}
              onClick={(event) => followTabLink(event, value, onChange)}
              aria-current={selected ? "page" : undefined}
              aria-label={live ? `${label}, games in progress` : undefined}
              className={[
                uiStyles.plainButton,
                styles.item,
                selected && styles.selected,
              ]
                .filter(Boolean)
                .join(" ")}
            >
              {/* A section's own color (Records' gold) is on its icon only,
                  so only the selected item reads as "on". */}
              <span className={styles.pill}>
                <Icon
                  name={icon}
                  size="inherit"
                  className={styles.icon}
                  style={color ? { color } : undefined}
                />
                {live && <span aria-hidden className={styles.liveDot} />}
              </span>
              {label}
            </a>
          );
        })}
      </div>
    </nav>
  );
}
