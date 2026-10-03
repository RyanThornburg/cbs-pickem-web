import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import ButtonBase from "@mui/material/ButtonBase";
import HistoryIcon from "@mui/icons-material/History";
import { useEffect } from "react";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import FormatListBulletedIcon from "@mui/icons-material/FormatListBulleted";
import PersonOutlineIcon from "@mui/icons-material/PersonOutlined";
import ShowChartIcon from "@mui/icons-material/ShowChart";
import SportsFootballIcon from "@mui/icons-material/SportsFootballOutlined";
import { SvgIconComponent } from "@mui/icons-material";
import {
  ADMIN_TAB,
  AppTab,
  PLAYERS_TAB,
  RECORDS_TAB,
} from "../utils/defaultTab";
import { MONEY_GOLD } from "./UsersTable/StandingsStatus";
import { followTabLink, tabHref } from "./tabLinks";
import { focusRingColor } from "../shared-theme/themePrimitives";

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
  Icon: SvgIconComponent;
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
    { value: "picks", label: "Picks", Icon: FormatListBulletedIcon },
    { value: "nfl", label: "NFL", Icon: SportsFootballIcon },
    { value: "trends", label: "Trends", Icon: ShowChartIcon },
    {
      value: RECORDS_TAB,
      label: "Records",
      Icon: EmojiEventsIcon,
      color: MONEY_GOLD,
    },
    { value: PLAYERS_TAB, label: "You", Icon: PersonOutlineIcon },
    ...(showAdmin
      ? [
          {
            value: ADMIN_TAB,
            label: "Admin",
            Icon: AdminPanelSettingsIcon,
            color: "warning.dark",
          } as Item,
        ]
      : []),
  ];

  return (
    <Box
      component="nav"
      aria-label="Sections"
      sx={{
        display: { xs: "block", md: "none" },
        position: "fixed",
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: "appBar",
        pb: "env(safe-area-inset-bottom, 0px)",
        bgcolor: "background.paper",
        borderTop: 1,
        borderColor: "divider",
        // Floats above the page, so it gets the float shadow (upward).
        boxShadow: "0 -6px 14px -10px hsla(220, 30%, 5%, 0.25)",
      }}
    >
      {pastWeek && (
        <Box
          sx={{
            height: PAST_WEEK_STRIP_HEIGHT,
            display: "flex",
            alignItems: "center",
            gap: 1,
            pl: 2,
            pr: 1,
            borderBottom: 1,
            borderColor: "divider",
            // DESIGN.md slate-50, a quiet tone, not a warning.
            bgcolor: "hsl(220, 35%, 97%)",
            fontSize: "0.8125rem",
          }}
        >
          <HistoryIcon
            aria-hidden
            sx={{ fontSize: "1.1rem", color: "text.secondary" }}
          />
          <Box component="span" sx={{ flex: 1, minWidth: 0 }}>
            <Box component="span" sx={{ fontWeight: 600 }}>
              Week {pastWeek.week}
            </Box>
            <Box component="span" sx={{ color: "text.secondary" }}>
              {" "}
              · past week
            </Box>
          </Box>
          <Button
            size="small"
            onClick={pastWeek.onBack}
            sx={{ minHeight: 36, flexShrink: 0 }}
          >
            Back to week {pastWeek.currentWeek}
          </Button>
        </Box>
      )}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: `repeat(${items.length}, 1fr)`,
        }}
      >
        {items.map(({ value, label, Icon, color }) => {
          const selected = value === activeTab;
          const live = value === "nfl" && hasLiveGame && !selected;
          return (
            <ButtonBase
              key={value}
              component="a"
              href={tabHref(value, search)}
              onClick={(event) => followTabLink(event, value, onChange)}
              aria-current={selected ? "page" : undefined}
              aria-label={live ? `${label}, games in progress` : undefined}
              sx={{
                height: PHONE_TAB_BAR_HEIGHT,
                display: "grid",
                justifyItems: "center",
                alignContent: "center",
                gap: "2px",
                fontSize: "0.75rem",
                // A link inherits the body's line height; keep the button's.
                lineHeight: "normal",
                fontWeight: selected ? 700 : 500,
                // A section's own color (Records' gold) is on its icon only,
                // so only the selected item reads as "on".
                color: selected ? "text.primary" : "text.secondary",
                "&:focus-visible": {
                  outline: `3px solid ${focusRingColor}`,
                  outlineOffset: -3,
                },
              }}
            >
              <Box
                component="span"
                sx={{
                  position: "relative",
                  display: "inline-flex",
                  px: 1.75,
                  py: "2px",
                  borderRadius: 999,
                  // DESIGN.md slate-200: a filled pill marks the current tab.
                  bgcolor: selected ? "hsl(220, 20%, 88%)" : "transparent",
                }}
              >
                <Icon sx={{ fontSize: 22, color }} aria-hidden />
                {live && (
                  <Box
                    component="span"
                    aria-hidden
                    sx={{
                      position: "absolute",
                      top: 1,
                      right: 10,
                      width: 7,
                      height: 7,
                      borderRadius: "50%",
                      bgcolor: "error.main",
                      boxShadow: (theme) =>
                        `0 0 0 2px ${theme.palette.background.paper}`,
                    }}
                  />
                )}
              </Box>
              {label}
            </ButtonBase>
          );
        })}
      </Box>
    </Box>
  );
}
