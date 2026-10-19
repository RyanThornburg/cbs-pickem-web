import { useMemo, useState } from "react";
import { GameCoverResult } from "../../data/weekGames";
import { SeasonAllAlonePick } from "../../types";
import UserAvatar from "../UserAvatar";
import { CoverResultIcon, selectedRowClass } from "./AllAloneCard";
import { TeamLogo } from "../shared/TeamLogo";
import { Button } from "../../ui/Button";
import styles from "./SeasonAllAloneCard.module.css";

export type Props = {
  allAlonePicksSeason: SeasonAllAlonePick[];
  gameResults: Map<string, GameCoverResult>;
  selectedUserId?: string;
};

// Newest first; the latest few, with the rest one tap away (no scroll box
// inside the page).
const INITIAL_ROWS = 5;

export default function SeasonAllAloneCard({
  allAlonePicksSeason,
  gameResults,
  selectedUserId,
}: Props) {
  const [showAll, setShowAll] = useState(false);
  const sorted = useMemo(
    () =>
      [...allAlonePicksSeason].sort((a, b) => b.week_number - a.week_number),
    [allAlonePicksSeason]
  );

  if (sorted.length === 0) {
    return (
      <p className={styles.empty}>
        Nobody has been the only one on a team yet this season.
      </p>
    );
  }

  const rows = showAll ? sorted : sorted.slice(0, INITIAL_ROWS);

  return (
    <div>
      <div className={styles.list}>
        {rows.map((pick) => {
          const cover = gameResults.get(`${pick.week_number}:${pick.game_id}`);
          const covered =
            cover?.isFinal && cover.coveringTeamId === pick.picked_team_id;
          const you = String(pick.user_id) === selectedUserId;

          return (
            <div
              key={`${pick.week_number}-${pick.game_id}-${pick.user_id}`}
              className={[styles.row, you && selectedRowClass]
                .filter(Boolean)
                .join(" ")}
            >
              <span className={styles.week}>Wk {pick.week_number}</span>
              <UserAvatar
                userName={pick.name}
                userId={String(pick.user_id)}
                includeName={false}
                size={24}
              />
              <p className={styles.name}>
                {pick.name}
                {you && " (you)"}
              </p>
              <div className={styles.team}>
                <TeamLogo abbr={pick.abbr} size={18} />
                <p className={styles.abbr}>{pick.abbr}</p>
              </div>
              <span className={styles.split}>1 vs {pick.opposing_count}</span>
              <div className={styles.result}>
                {cover?.isFinal && <CoverResultIcon covered={!!covered} />}
              </div>
            </div>
          );
        })}
      </div>
      {sorted.length > INITIAL_ROWS && (
        <Button
          size="small"
          onClick={() => setShowAll((s) => !s)}
          aria-expanded={showAll}
          className={styles.toggle}
        >
          {showAll ? "Show fewer" : `Show all ${sorted.length}`}
        </Button>
      )}
    </div>
  );
}
