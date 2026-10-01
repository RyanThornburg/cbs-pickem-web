import { useEffect, useState } from "react";
import Box from "@mui/material/Box";
import ButtonBase from "@mui/material/ButtonBase";
import { RankedUser } from "../../types";
import { ordinal } from "../../helper";
import UserAvatar from "../UserAvatar";
import { ScoreWithCovering } from "./ScoreWithCovering";
import { pts } from "./MoneyLines";
import { selectedRowSx } from "./selectedRowSx";
import { ShownMoneyStanding } from "./usersTableUtils";
import { PHONE_TAB_BAR_OFFSET } from "../PhoneTabBar";
import { focusRingColor } from "../../shared-theme/themePrimitives";

// The prize most worth a line: one you're in, else the closest chase.
const pinnedNote = (standings: ShownMoneyStanding[]) => {
  const inMoney = standings.find((s) => s.inMoney);
  if (inMoney) return `In the ${inMoney.prize.toLowerCase()} money`;
  const chasing = [...standings].sort((a, b) => a.ptsOut - b.ptsOut)[0];
  return chasing
    ? `${pts(chasing.ptsOut)} to the ${chasing.prize.toLowerCase()} money`
    : null;
};

// Below md, the selected player's row sticks to the bottom of the screen
// while their real row is scrolled out of view, with the money note the
// header has no room for. Tapping it scrolls to the real row.
export function PinnedPlayerRow({
  user,
  standings,
}: {
  user: RankedUser | undefined;
  standings: ShownMoneyStanding[];
}) {
  const [rowInView, setRowInView] = useState(true);
  const userId = user?.id;

  useEffect(() => {
    if (!userId) return undefined;
    // Both table variants render a row for the player, but only the one
    // on screen ever intersects; the other is display: none.
    const rows = document.querySelectorAll<HTMLElement>(
      `[data-user-row="${CSS.escape(userId)}"]`
    );
    if (!rows.length) return undefined;
    const visible = new Set<Element>();
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) =>
        entry.isIntersecting
          ? visible.add(entry.target)
          : visible.delete(entry.target)
      );
      setRowInView(visible.size > 0);
    });
    rows.forEach((row) => observer.observe(row));
    return () => observer.disconnect();
  }, [userId, standings]);

  if (!user || rowInView) return null;

  const note = pinnedNote(standings);
  const scrollToRow = () => {
    const row = [
      ...document.querySelectorAll<HTMLElement>(
        `[data-user-row="${CSS.escape(user.id)}"]`
      ),
    ].find((el) => el.offsetParent !== null);
    const reduce = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    row?.scrollIntoView({
      block: "center",
      behavior: reduce ? "auto" : "smooth",
    });
  };

  return (
    <Box
      sx={{
        display: { xs: "block", md: "none" },
        position: "sticky",
        // Just above the phone tab bar.
        bottom: PHONE_TAB_BAR_OFFSET,
        zIndex: 2,
        mt: 1,
        bgcolor: "background.paper",
        borderTop: 1,
        borderColor: "divider",
        // Floats above the table, so it gets the float shadow (upward).
        boxShadow: "0 -6px 14px -6px hsla(220, 30%, 5%, 0.18)",
      }}
    >
      <ButtonBase
        onClick={scrollToRow}
        aria-label={`Go to your row: ${user.place ? `${ordinal(user.place)}, ` : ""}${user.name}${note ? `, ${note}` : ""}`}
        sx={[
          {
            width: "100%",
            display: "grid",
            gridTemplateColumns: "2rem minmax(0, 1fr) auto",
            alignItems: "center",
            columnGap: 1,
            rowGap: 0.25,
            px: 1,
            py: 0.75,
            textAlign: "left",
            fontSize: "0.875rem",
            "&:focus-visible": {
              outline: `3px solid ${focusRingColor}`,
              outlineOffset: -3,
            },
          },
          selectedRowSx,
        ]}
      >
        <Box
          component="span"
          sx={{ textAlign: "center", fontVariantNumeric: "tabular-nums" }}
        >
          {user.place ?? "–"}
        </Box>
        <UserAvatar
          userName={user.name}
          userId={user.id}
          size={22}
          fontSize="0.875rem"
        />
        <Box
          component="span"
          sx={{ fontWeight: 600, fontVariantNumeric: "tabular-nums" }}
        >
          <ScoreWithCovering
            total={user.cumulative_score + user.trending_score}
            covering={user.trending_score}
          />
        </Box>
        {note && (
          <Box
            component="span"
            sx={{
              gridColumn: "2 / 4",
              fontSize: "0.75rem",
              fontWeight: 600,
            }}
          >
            {note}
          </Box>
        )}
      </ButtonBase>
    </Box>
  );
}
