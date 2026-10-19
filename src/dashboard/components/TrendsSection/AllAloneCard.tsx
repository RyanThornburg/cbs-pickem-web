import { GameCoverResult } from "../../data/weekGames";
import { AllAlonePick } from "../../types";
import UserAvatar from "../UserAvatar";
import { TeamLogo } from "../shared/TeamLogo";
import { Icon } from "../../ui/Icon";
import styles from "./AllAloneCard.module.css";

export type Props = {
  allAlonePicks: AllAlonePick[];
  gameResults: Map<number, GameCoverResult>;
  selectedUserId?: string;
};

// The selected player's row, as on User Picks (DESIGN.md selected-lime).
export const selectedRowClass = styles.selected;

// Final-game result for a pick: a drawn icon plus its word for screen
// readers, so it doesn't rest on color alone.
export function CoverResultIcon({ covered }: { covered: boolean }) {
  return covered ? (
    <Icon
      name="CheckCircleOutlined"
      size="small"
      label="Covered"
      className={styles.covered}
    />
  ) : (
    <Icon
      name="Close"
      size="small"
      label="Didn't cover"
      className={styles.missed}
    />
  );
}

export default function AllAloneCard({
  allAlonePicks,
  gameResults,
  selectedUserId,
}: Props) {
  if (allAlonePicks.length === 0) return null;

  return (
    <div className={styles.list}>
      {allAlonePicks.map((pick) => {
        const cover = gameResults.get(pick.game_id);
        const covered =
          cover?.isFinal && cover.coveringTeamId === pick.picked_team_id;
        const you = String(pick.user_id) === selectedUserId;

        return (
          <div
            key={`${pick.game_id}-${pick.user_id}`}
            className={[styles.row, you && styles.selected]
              .filter(Boolean)
              .join(" ")}
          >
            <UserAvatar
              userName={pick.name}
              userId={String(pick.user_id)}
              includeName={false}
              size={28}
            />
            <div className={styles.text}>
              <p className={styles.name}>
                {pick.name}
                {you && " (you)"}
              </p>
              <div className={styles.team}>
                <TeamLogo abbr={pick.abbr} size={18} />
                <span className={styles.note}>
                  Only one on {pick.abbr} · {pick.opposing_count} took the other
                  side
                </span>
              </div>
            </div>
            {cover?.isFinal && <CoverResultIcon covered={!!covered} />}
          </div>
        );
      })}
    </div>
  );
}
