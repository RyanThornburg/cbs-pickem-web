import { useState } from "react";
import Box from "@mui/material/Box";
import Tooltip from "@mui/material/Tooltip";
import ClickAwayListener from "@mui/material/ClickAwayListener";
import Typography from "@mui/material/Typography";
import { Game, UserId } from "../../../../types";
import { UserAvatar } from "../../../UserAvatar";
import { getCover, Side } from "../../utils/scoreboardUtils";
import { TeamLogo } from "../../../shared/TeamLogo";

interface Props {
  game: Game;
  userId?: string;
  totalUsers?: number;
  compact?: boolean;
  // False when an empty pick list only means picks aren't public yet (see
  // picksRevealed in scoreboardUtils) -- then nothing is shown.
  picksRevealed?: boolean;
}

const byName = (a: UserId, b: UserId) => a.name.localeCompare(b.name);

const PickerList = ({
  abbr,
  users,
  userId,
}: {
  abbr: string;
  users: UserId[];
  userId?: string;
}) => (
  <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5, minWidth: 0 }}>
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 0.75,
        fontWeight: 700,
        fontSize: "0.875rem",
      }}
    >
      <TeamLogo abbr={abbr} size={18} />
      {abbr} · {users.length}
    </Box>
    {users.length === 0 ? (
      <Typography
        variant="caption"
        sx={{ fontStyle: "italic", color: "text.secondary" }}
      >
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
          <UserAvatar userId={user.id} userName={user.name} size={18} />
        </Box>
      ))
    )}
  </Box>
);

// Who picked each side, colored by who's winning the pick right now. Every
// picker's name is in the tooltip -- hover on desktop, tap on mobile.
export const PickSplitBar = ({
  game,
  userId,
  totalUsers,
  compact,
  picksRevealed = true,
}: Props) => {
  const [open, setOpen] = useState(false);
  const away = game.picks.away;
  const home = game.picks.home;
  const total = away.length + home.length;

  if (total === 0) {
    if (!picksRevealed) return null;
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
  // Each side's label takes the green/red of its half of the bar, a step
  // darker so the text stays readable: winning (or won) the pick vs. losing
  // (or lost) it.
  const labelColor = (side: Side) =>
    !cover || cover.side === null
      ? "text.secondary"
      : cover.side === side
        ? "success.dark"
        : "error.dark";
  const count = (
    side: Side,
    abbr: string,
    n: number,
    align: "left" | "right"
  ) => (
    <Box
      component="span"
      sx={{
        display: "inline-flex",
        gap: 0.5,
        alignItems: "center",
        flexDirection: align === "right" ? "row-reverse" : "row",
        color: labelColor(side),
        fontWeight: cover?.side ? 600 : 400,
      }}
    >
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
    </Box>
  );

  return (
    <ClickAwayListener onClickAway={() => setOpen(false)}>
      <Box>
        <Tooltip
          open={open}
          onOpen={() => setOpen(true)}
          onClose={() => setOpen(false)}
          placement="top"
          arrow
          slotProps={{
            tooltip: {
              sx: {
                bgcolor: "background.paper",
                color: "text.primary",
                border: 1,
                borderColor: "divider",
                boxShadow: 6,
                p: 1.5,
                maxWidth: 440,
              },
            },
          }}
          title={
            <Box
              sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}
            >
              <PickerList
                abbr={game.away_team.abbr}
                users={away}
                userId={userId}
              />
              <PickerList
                abbr={game.home_team.abbr}
                users={home}
                userId={userId}
              />
            </Box>
          }
        >
          <Box
            role="button"
            tabIndex={0}
            aria-label={`${away.length} picked ${game.away_team.abbr}, ${home.length} picked ${game.home_team.abbr}. Show names.`}
            onClick={() => setOpen((o) => !o)}
            onKeyDown={(e) =>
              (e.key === "Enter" || e.key === " ") && setOpen((o) => !o)
            }
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
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                gap: 1,
                fontSize: "0.8125rem",
                color: "text.secondary",
              }}
            >
              {count("away", game.away_team.abbr, away.length, "left")}
              {!compact && totalUsers ? (
                <span>
                  {total} of {totalUsers} picked this game
                </span>
              ) : null}
              {count("home", game.home_team.abbr, home.length, "right")}
            </Box>
            <Box
              sx={{
                display: "flex",
                height: 6,
                borderRadius: 3,
                overflow: "hidden",
                bgcolor: "action.hover",
              }}
            >
              <Box
                sx={{
                  width: `${(away.length / total) * 100}%`,
                  bgcolor: colorFor("away"),
                }}
              />
              <Box
                sx={{
                  width: `${(home.length / total) * 100}%`,
                  bgcolor: colorFor("home"),
                  opacity: 0.85,
                }}
              />
            </Box>
          </Box>
        </Tooltip>
      </Box>
    </ClickAwayListener>
  );
};
