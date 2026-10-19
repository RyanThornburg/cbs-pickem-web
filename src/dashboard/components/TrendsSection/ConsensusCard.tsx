import { useMemo } from "react";
import { Tooltip } from "@mui/material";
import { GameCoverResult } from "../../data/weekGames";
import { OneSidedGame, WeekTrends } from "../../types";
import { TeamLogo } from "../shared/TeamLogo";
import { Icon } from "../../ui/Icon";
import styles from "./ConsensusCard.module.css";

export type Props = {
  trends: WeekTrends;
  gameResults: Map<number, GameCoverResult>;
};

type Side = {
  id: number;
  abbr: string;
  name: string;
  pick_count: number;
  pct: number;
};

type GameConsensus = {
  game_id: number;
  leader: Side;
  trailer: Side;
  oneSided?: OneSidedGame;
};

const buildGameConsensus = (trends: WeekTrends): GameConsensus[] => {
  const byGame = new Map<number, Side[]>();

  trends.pick_popularity.forEach((p) => {
    const sides = byGame.get(p.game_id) ?? [];
    sides.push({
      id: p.id,
      abbr: p.abbr,
      name: p.name,
      pick_count: p.pick_count,
      pct: p.pct_of_game_pickers,
    });
    byGame.set(p.game_id, sides);
  });

  trends.cold_teams.forEach((c) => {
    const sides = byGame.get(c.game_id) ?? [];
    if (!sides.some((s) => s.id === c.id)) {
      sides.push({
        id: c.id,
        abbr: c.abbr,
        name: c.name,
        pick_count: 0,
        pct: 0,
      });
    }
    byGame.set(c.game_id, sides);
  });

  const oneSidedByGame = new Map(
    trends.one_sided_games.map((g) => [g.game_id, g])
  );

  return Array.from(byGame.entries())
    .filter(([, sides]) => sides.length === 2)
    .map(([game_id, sides]) => {
      const [leader, trailer] = [...sides].sort(
        (a, b) => b.pick_count - a.pick_count
      );
      return {
        game_id,
        leader,
        trailer,
        oneSided: oneSidedByGame.get(game_id),
      };
    })
    .sort((a, b) => {
      if (b.leader.pick_count !== a.leader.pick_count) {
        return b.leader.pick_count - a.leader.pick_count;
      }
      return (
        b.leader.pick_count +
        b.trailer.pick_count -
        (a.leader.pick_count + a.trailer.pick_count)
      );
    });
};

const cx = (...names: (string | false | undefined)[]) =>
  names.filter(Boolean).join(" ");

// One row per game: the less-picked side on the left, the more-picked side
// on the right, a neutral bar between them (darker for the bigger side;
// red, green and team colors would read as a result), and the bigger
// side's share of the pool on the far right (bold when the data calls it a
// one-sided game). Once a game is final the side that covered gets a ✓ and
// the other fades.
export default function ConsensusCard({ trends, gameResults }: Props) {
  const games = useMemo(() => buildGameConsensus(trends), [trends]);

  if (games.length === 0) return null;

  return (
    <div className={styles.list}>
      {games.map(({ game_id, leader, trailer, oneSided }) => {
        const cover = gameResults.get(game_id);
        const trailerCovered =
          cover?.isFinal && cover.coveringTeamId === trailer.id;
        const leaderCovered =
          cover?.isFinal && cover.coveringTeamId === leader.id;
        const leaderCurrentlyCovering = cover?.coveringTeamId === leader.id;
        // Bold tracks the live cover (and stays on once final); the checkmark
        // and fade only apply once the result is locked in.
        const trailerCurrentlyCovering = cover?.coveringTeamId === trailer.id;

        return (
          <div key={game_id}>
            <div className={styles.row}>
              <TeamLogo abbr={trailer.abbr} size={22} />
              <div
                className={cx(
                  styles.side,
                  cover?.isFinal && !trailerCovered && styles.faded
                )}
              >
                <div className={styles.sideAbbr}>
                  <div
                    className={cx(
                      styles.caption,
                      trailerCurrentlyCovering && styles.bold
                    )}
                  >
                    {trailer.abbr}
                  </div>
                  {trailerCovered && (
                    <Icon
                      name="CheckCircleOutlined"
                      label="covered"
                      className={styles.check}
                    />
                  )}
                </div>
                <div
                  className={cx(
                    styles.caption,
                    trailerCurrentlyCovering && styles.bold
                  )}
                >
                  {trailer.pick_count}
                </div>
              </div>
              <div
                role="img"
                aria-label={`${trailer.name} ${trailer.pick_count} picks, ${leader.name} ${leader.pick_count} picks`}
                className={styles.bar}
              >
                {trailer.pick_count > 0 && (
                  <Tooltip
                    title={`${trailer.name}: ${trailer.pick_count} picks`}
                  >
                    <div
                      className={styles.trailerBar}
                      style={{ flexGrow: Math.max(trailer.pct, 0.02) }}
                    />
                  </Tooltip>
                )}
                <Tooltip title={`${leader.name}: ${leader.pick_count} picks`}>
                  <div
                    className={styles.leaderBar}
                    style={{ flexGrow: Math.max(leader.pct, 0.02) }}
                  />
                </Tooltip>
              </div>
              <div
                className={cx(
                  styles.side,
                  styles.leaderSide,
                  cover?.isFinal && !leaderCovered && styles.faded
                )}
              >
                <div className={cx(styles.sideAbbr, styles.leaderAbbr)}>
                  {leaderCovered && (
                    <Icon
                      name="CheckCircleOutlined"
                      label="covered"
                      className={styles.check}
                    />
                  )}
                  <div
                    className={cx(
                      styles.caption,
                      leaderCurrentlyCovering && styles.bold
                    )}
                  >
                    {leader.abbr}
                  </div>
                </div>
                <div
                  className={cx(
                    styles.caption,
                    leaderCurrentlyCovering && styles.bold
                  )}
                >
                  {leader.pick_count}
                </div>
              </div>
              <TeamLogo abbr={leader.abbr} size={22} />
              {/* No color here: a lopsided split isn't a win or a loss. */}
              <span
                className={cx(
                  styles.caption,
                  styles.share,
                  oneSided ? styles.strong : styles.muted
                )}
              >
                {Math.round(leader.pct * 100)}%
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
