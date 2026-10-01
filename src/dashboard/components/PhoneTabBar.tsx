import Box from "@mui/material/Box";
import ButtonBase from "@mui/material/ButtonBase";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import FormatListBulletedIcon from "@mui/icons-material/FormatListBulleted";
import ScoreboardIcon from "@mui/icons-material/ScoreboardOutlined";
import ShowChartIcon from "@mui/icons-material/ShowChart";
import SportsFootballIcon from "@mui/icons-material/SportsFootballOutlined";
import { SvgIconComponent } from "@mui/icons-material";
import { ADMIN_TAB, AppTab, RECORDS_TAB } from "../utils/defaultTab";
import { MONEY_GOLD } from "./UsersTable/StandingsStatus";

// The bar's height above the phone's safe area. User Picks' pinned row sits
// on top of it, and the page leaves this much room at the bottom.
export const PHONE_TAB_BAR_HEIGHT = 60;
export const PHONE_TAB_BAR_OFFSET = `calc(${PHONE_TAB_BAR_HEIGHT}px + env(safe-area-inset-bottom, 0px))`;

interface Item {
  value: AppTab;
  label: string;
  Icon: SvgIconComponent;
  color?: string;
}

// Below md the tabs live in a bar fixed to the bottom of the screen, so any
// tab is one thumb tap away mid-scroll. "Scoreboard" reads "Live" here.
export function PhoneTabBar({
  activeTab,
  onChange,
  hasLiveGame,
  showAdmin,
}: {
  activeTab: AppTab;
  onChange: (value: AppTab) => void;
  hasLiveGame: boolean;
  showAdmin: boolean;
}) {
  const items: Item[] = [
    { value: "picks", label: "Picks", Icon: FormatListBulletedIcon },
    { value: "games", label: "Games", Icon: SportsFootballIcon },
    { value: "scoreboard", label: "Live", Icon: ScoreboardIcon },
    { value: "trends", label: "Trends", Icon: ShowChartIcon },
    {
      value: RECORDS_TAB,
      label: "Records",
      Icon: EmojiEventsIcon,
      color: MONEY_GOLD,
    },
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
        display: { xs: "grid", md: "none" },
        gridTemplateColumns: `repeat(${items.length}, 1fr)`,
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
      {items.map(({ value, label, Icon, color }) => {
        const selected = value === activeTab;
        const live = value === "scoreboard" && hasLiveGame && !selected;
        return (
          <ButtonBase
            key={value}
            onClick={() => onChange(value)}
            aria-current={selected ? "page" : undefined}
            aria-label={live ? `${label}, games in progress` : undefined}
            sx={{
              height: PHONE_TAB_BAR_HEIGHT,
              display: "grid",
              justifyItems: "center",
              alignContent: "center",
              gap: "2px",
              fontSize: "0.75rem",
              fontWeight: selected ? 700 : 500,
              color: color ?? (selected ? "text.primary" : "text.secondary"),
              "&:focus-visible": {
                outline: "3px solid hsl(210, 98%, 42%)",
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
                bgcolor: selected ? "grey.100" : "transparent",
              }}
            >
              <Icon sx={{ fontSize: 22 }} aria-hidden />
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
  );
}
