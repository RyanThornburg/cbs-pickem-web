import { useEffect, useRef, useState } from "react";
import { Game, GameDetails, PlayerLine } from "../../../../types";
import { TeamLogo } from "../../../shared/TeamLogo";
import { STAT_BAR_COLORS } from "../../utils/teamStats";
import {
  PlayerStatGroup,
  PlayerStatGroupId,
  availableGroups,
  statCell,
} from "../../utils/playerStats";
import { Button } from "../../../../ui/Button";
import { SegmentedControl } from "../../../../ui/SegmentedControl";
import uiStyles from "../../../../ui/ui.module.css";
import styles from "./PlayerStats.module.css";

// Every player's line from the details key, one stat group at a time, both
// teams away first (keyed by the box score's blue and orange, like the team
// stats above). Only shown once the key has players; a group with nobody
// on either team isn't offered.

const cx = (...names: (string | false)[]) => names.filter(Boolean).join(" ");

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
  const pinned = cx(styles.pinned, scrolls && styles.solid);
  const cut = group.top != null && !all && rows.length > group.top;
  const shown = cut ? rows.slice(0, group.top) : rows;
  return (
    <div className={styles.team}>
      <div className={styles.teamHead}>
        <TeamLogo abbr={abbr} size={18} decorative />
        {abbr}
        <div
          aria-hidden
          className={styles.teamStripe}
          style={{ backgroundColor: color }}
        />
      </div>
      {/* Scrolls sideways on its own on a phone, the name pinned. */}
      <div ref={scrollRef} className={styles.scroll}>
        <table className={styles.table}>
          <caption className={uiStyles.visuallyHidden}>
            {abbr} {group.label.toLowerCase()}
          </caption>
          <thead>
            <tr>
              <th
                scope="col"
                className={cx(styles.cell, styles.left, pinned, styles.colHead)}
              >
                {group.id === "returns" ? "Returner" : "Player"}
              </th>
              {group.columns.map((column) => (
                <th
                  scope="col"
                  key={column.key}
                  title={column.title}
                  className={cx(styles.cell, styles.colHead)}
                >
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {shown.length === 0 ? (
              <tr>
                <td
                  colSpan={group.columns.length + 1}
                  className={cx(styles.cell, styles.left, styles.none)}
                >
                  None
                </td>
              </tr>
            ) : (
              shown.map((player) => (
                <tr key={`${player.name}-${player.stats.kind ?? ""}`}>
                  <th
                    scope="row"
                    title={player.name}
                    className={cx(
                      styles.cell,
                      styles.left,
                      styles.name,
                      pinned
                    )}
                  >
                    {player.name}
                  </th>
                  {group.columns.map((column) => (
                    <td key={column.key} className={styles.cell}>
                      {statCell(player.stats[column.key])}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {cut && (
        <Button
          size="small"
          onClick={() => setAll(true)}
          className={styles.showAll}
        >
          Show all {rows.length}
        </Button>
      )}
    </div>
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
    <div className={styles.root}>
      <span className={styles.title}>Player stats</span>
      {/* Seven groups don't fit a phone, so the switch scrolls sideways. */}
      <div className={styles.groupScroll}>
        <SegmentedControl
          value={group.id}
          onChange={setPicked}
          label="Player stat group"
          className={styles.groups}
          segments={groups.map((g) => ({ value: g.id, children: g.label }))}
        />
      </div>
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
    </div>
  );
}
