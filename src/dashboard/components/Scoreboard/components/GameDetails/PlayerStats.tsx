import { useEffect, useRef, useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import Typography from "@mui/material/Typography";
import { Game, GameDetails, PlayerLine } from "../../../../types";
import { visuallyHidden } from "../../../../helper";
import { TeamLogo } from "../../../shared/TeamLogo";
import { STAT_BAR_COLORS } from "../../utils/teamStats";
import {
  PlayerStatGroup,
  PlayerStatGroupId,
  availableGroups,
  statCell,
} from "../../utils/playerStats";

// Every player's line from the details key, one stat group at a time, both
// teams away first (keyed by the box score's blue and orange, like the team
// stats above). Only shown once the key has players; a group with nobody
// on either team isn't offered.

const cellSx = {
  py: 0.75,
  px: 0.75,
  textAlign: "right",
  whiteSpace: "nowrap",
  borderBottom: 1,
  borderColor: "divider",
} as const;

function TeamTable({
  abbr,
  color,
  group,
  rows,
}: {
  abbr: string;
  color: string;
  group: PlayerStatGroup;
  rows: PlayerLine[];
}) {
  const [all, setAll] = useState(false);
  // The name column is pinned with a solid fill only while the table is
  // wider than its box; otherwise it stays clear, so a card's own tint (the
  // your-game gradient on compact rows) shows through evenly.
  const scrollRef = useRef<HTMLDivElement>(null);
  const [scrolls, setScrolls] = useState(false);
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const check = () => setScrolls(el.scrollWidth > el.clientWidth + 1);
    check();
    const ro = new ResizeObserver(check);
    ro.observe(el);
    return () => ro.disconnect();
  }, [all, group.id]);
  const pinned = {
    position: "sticky",
    left: 0,
    bgcolor: scrolls ? "background.paper" : "transparent",
  } as const;
  const cut = group.top != null && !all && rows.length > group.top;
  const shown = cut ? rows.slice(0, group.top) : rows;
  return (
    <Box sx={{ minWidth: 0 }}>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 0.75,
          fontWeight: 700,
          fontSize: "0.8125rem",
          mb: 0.25,
        }}
      >
        <TeamLogo abbr={abbr} size={18} decorative />
        {abbr}
        <Box
          aria-hidden
          sx={{ width: 18, height: 3, borderRadius: 2, bgcolor: color }}
        />
      </Box>
      {/* Scrolls sideways on its own on a phone, the name pinned. */}
      <Box ref={scrollRef} sx={{ overflowX: "auto" }}>
        <Box
          component="table"
          sx={{
            width: "100%",
            borderCollapse: "collapse",
            fontSize: "0.8125rem",
            fontVariantNumeric: "tabular-nums",
          }}
        >
          <Box component="caption" sx={visuallyHidden}>
            {abbr} {group.label.toLowerCase()}
          </Box>
          <thead>
            <tr>
              <Box
                component="th"
                scope="col"
                sx={{
                  ...cellSx,
                  textAlign: "left",
                  ...pinned,
                  fontSize: "0.75rem",
                  color: "text.secondary",
                }}
              >
                {group.id === "returns" ? "Returner" : "Player"}
              </Box>
              {group.columns.map((column) => (
                <Box
                  component="th"
                  scope="col"
                  key={column.key}
                  title={column.title}
                  sx={{
                    ...cellSx,
                    fontSize: "0.75rem",
                    color: "text.secondary",
                  }}
                >
                  {column.label}
                </Box>
              ))}
            </tr>
          </thead>
          <tbody>
            {shown.length === 0 ? (
              <tr>
                <Box
                  component="td"
                  colSpan={group.columns.length + 1}
                  sx={{ ...cellSx, textAlign: "left", color: "text.secondary" }}
                >
                  None
                </Box>
              </tr>
            ) : (
              shown.map((player) => (
                <tr key={`${player.name}-${player.stats.kind ?? ""}`}>
                  <Box
                    component="th"
                    scope="row"
                    title={player.name}
                    sx={{
                      ...cellSx,
                      textAlign: "left",
                      fontWeight: 600,
                      ...pinned,
                      maxWidth: "14ch",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {player.name}
                  </Box>
                  {group.columns.map((column) => (
                    <Box component="td" key={column.key} sx={cellSx}>
                      {statCell(player.stats[column.key])}
                    </Box>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </Box>
      </Box>
      {cut && (
        <Button
          size="small"
          onClick={() => setAll(true)}
          sx={{ mt: 0.25, minHeight: 32 }}
        >
          Show all {rows.length}
        </Button>
      )}
    </Box>
  );
}

export function PlayerStats({
  game,
  players,
}: {
  game: Game;
  players: NonNullable<GameDetails["players"]>;
}) {
  const groups = availableGroups(players);
  const [picked, setPicked] = useState<PlayerStatGroupId>("passing");
  if (groups.length === 0) return null;
  const group = groups.find((g) => g.id === picked) ?? groups[0];

  return (
    // Capped so eight defense columns don't spread across a full-width row.
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        gap: 1.25,
        maxWidth: 720,
      }}
    >
      <Typography
        variant="overline"
        sx={{ color: "text.secondary", lineHeight: 1.6, fontWeight: 700 }}
      >
        Player stats
      </Typography>
      {/* Seven groups don't fit a phone, so the switch scrolls sideways. */}
      <Box sx={{ overflowX: "auto", mx: -0.5, px: 0.5, pb: 0.25 }}>
        <ToggleButtonGroup
          size="small"
          exclusive
          value={group.id}
          onChange={(_, next: PlayerStatGroupId | null) =>
            next && setPicked(next)
          }
          aria-label="Player stat group"
          sx={{ flexWrap: "nowrap" }}
        >
          {groups.map((g) => (
            <ToggleButton key={g.id} value={g.id} sx={{ whiteSpace: "nowrap" }}>
              {g.label}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
      </Box>
      <TeamTable
        key={`away-${group.id}`}
        abbr={game.away_team.abbr}
        color={STAT_BAR_COLORS.away}
        group={group}
        rows={group.rows(players.away)}
      />
      <TeamTable
        key={`home-${group.id}`}
        abbr={game.home_team.abbr}
        color={STAT_BAR_COLORS.home}
        group={group}
        rows={group.rows(players.home)}
      />
    </Box>
  );
}
