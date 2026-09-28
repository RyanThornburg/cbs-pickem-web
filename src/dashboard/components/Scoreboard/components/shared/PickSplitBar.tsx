import { useState } from "react";
import Box from "@mui/material/Box";
import Tooltip from "@mui/material/Tooltip";
import ClickAwayListener from "@mui/material/ClickAwayListener";
import Typography from "@mui/material/Typography";
import { Game, UserId } from "../../../../types";
import { UserAvatar } from "../../../UserAvatar";
import { getCover, Side } from "../../utils/scoreboardUtils";
import { TeamLogo } from "./TeamLogo";

interface Props {
  game: Game;
  userId?: string;
  totalUsers?: number;
  compact?: boolean;
}

const byName = (a: UserId, b: UserId) => a.name.localeCompare(b.name);

const PickerList = ({ abbr, users, userId }: { abbr: string; users: UserId[]; userId?: string }) => (
  <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5, minWidth: 0 }}>
    <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, fontWeight: 700, fontSize: "0.85rem" }}>
      <TeamLogo abbr={abbr} size={18} />
      {abbr} · {users.length}
    </Box>
    {users.length === 0 ? (
      <Typography variant="caption" sx={{ fontStyle: "italic", color: "text.secondary" }}>
        Nobody
      </Typography>
    ) : (
      [...users].sort(byName).map((user) => (
        <Box
          key={user.id}
          sx={{
            fontWeight: user.id === userId ? 700 : 400,
            color: user.id === userId ? "primary.main" : "text.primary",
          }}
        >
          <UserAvatar userId={user.id} userName={user.name} size={18} fontSize="0.78rem" />
        </Box>
      ))
    )}
  </Box>
);

// Who picked each side, colored by who's winning the pick right now. Every
// picker's name is in the tooltip -- hover on desktop, tap on mobile.
export const PickSplitBar = ({ game, userId, totalUsers, compact }: Props) => {
  const [open, setOpen] = useState(false);
  const away = game.picks.away;
  const home = game.picks.home;
  const total = away.length + home.length;

  if (total === 0) {
    return (
      <Typography variant="caption" sx={{ color: "text.secondary" }}>
        Nobody picked this game
      </Typography>
    );
  }

  const cover = getCover(game);
  const colorFor = (side: Side) =>
    !cover || cover.side === null
      ? "text.disabled"
      : cover.side === side
      ? "success.main"
      : "error.main";
  const count = (abbr: string, n: number, mine: boolean, align: "left" | "right") => (
    <Box component="span" sx={{ display: "inline-flex", gap: 0.5, alignItems: "center", flexDirection: align === "right" ? "row-reverse" : "row" }}>
      <span>
        {align === "left" ? (
          <>
            {abbr} <b>{n}</b>
          </>
        ) : (
          <>
            <b>{n}</b> {abbr}
          </>
        )}
      </span>
      {mine && (
        <Box component="span" sx={{ fontSize: "0.7rem", fontWeight: 700, color: "primary.main" }}>
          You
        </Box>
      )}
    </Box>
  );
  const mySide = away.some((u) => u.id === userId)
    ? "away"
    : home.some((u) => u.id === userId)
    ? "home"
    : null;

  return (
    <ClickAwayListener onClickAway={() => setOpen(false)}>
      <Box>
        <Tooltip
          open={open}
          onOpen={() => setOpen(true)}
          onClose={() => setOpen(false)}
          placement="top"
          arrow
          slotProps={{ tooltip: { sx: { bgcolor: "background.paper", color: "text.primary", border: 1, borderColor: "divider", boxShadow: 6, p: 1.5, maxWidth: 440 } } }}
          title={
            <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
              <PickerList abbr={game.away_team.abbr} users={away} userId={userId} />
              <PickerList abbr={game.home_team.abbr} users={home} userId={userId} />
            </Box>
          }
        >
          <Box
            role="button"
            tabIndex={0}
            aria-label={`${away.length} picked ${game.away_team.abbr}, ${home.length} picked ${game.home_team.abbr}. Show names.`}
            onClick={() => setOpen((o) => !o)}
            onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && setOpen((o) => !o)}
            sx={{
              cursor: "pointer",
              display: "flex",
              flexDirection: "column",
              gap: 0.5,
              borderRadius: 1,
              p: "2px",
              "&:focus-visible": { outline: 2, outlineColor: "primary.main" },
            }}
          >
            <Box sx={{ display: "flex", justifyContent: "space-between", gap: 1, fontSize: "0.8rem", color: "text.secondary" }}>
              {count(game.away_team.abbr, away.length, mySide === "away", "left")}
              {!compact && totalUsers ? <span>{total} of {totalUsers} picked this game</span> : null}
              {count(game.home_team.abbr, home.length, mySide === "home", "right")}
            </Box>
            <Box sx={{ display: "flex", height: 6, borderRadius: 3, overflow: "hidden", bgcolor: "action.hover" }}>
              <Box sx={{ width: `${(away.length / total) * 100}%`, bgcolor: colorFor("away") }} />
              <Box sx={{ width: `${(home.length / total) * 100}%`, bgcolor: colorFor("home"), opacity: 0.85 }} />
            </Box>
          </Box>
        </Tooltip>
      </Box>
    </ClickAwayListener>
  );
};
