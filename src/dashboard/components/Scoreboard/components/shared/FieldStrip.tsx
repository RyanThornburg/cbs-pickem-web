import { Tooltip } from "../../../../ui/Tooltip";
import { Game, Possession } from "../../../../types";
import { getBallSpot } from "../../utils/scoreboardUtils";
import { teamColor } from "../../utils/teamData";
import { BALL_BROWN } from "./BallIcon";
import styles from "./FieldStrip.module.css";

interface Props {
  game: Game;
  height?: number;
}

// Away end zone on the left, home on the right (away is listed first
// everywhere on the scoreboard). Blue line = line of scrimmage, yellow =
// first-down marker, shaded band in the offense's color = the current drive
// from where it started to the ball. With no current spot the empty field still shows, so
// compact rows keep their shape.
export const FieldStrip = ({ game, height = 22 }: Props) => {
  const spot = getBallSpot(game);
  const possession = game.live?.possession;
  const offense =
    possession === Possession.Home ? game.home_team : game.away_team;
  // "🏈 DEN ball · LAR 37" -- who has it and the spot as the feed prints it
  const ballTooltip = spot
    ? possession
      ? `🏈 ${offense.abbr} ball · ${spot.label}`
      : `🏈 Ball on the ${spot.label}`
    : "";
  // End zones are labelled only on the taller card strip: on the 16px
  // compact strip the letters came out 8px, too small to read. The strip is
  // one image to screen readers, so the labels are decoration either way.
  const labelled = height >= 20;
  const endZone = (abbr: string) => (
    <div
      aria-hidden
      className={styles.endZone}
      style={{ backgroundColor: teamColor(abbr) }}
    >
      {labelled && abbr}
    </div>
  );
  const hitArea = Math.max(24, height * 1.4);

  return (
    <div
      role="img"
      aria-label={
        spot
          ? `Ball on the ${spot.label}${spot.driveStartLabel ? `, drive started at the ${spot.driveStartLabel}` : ""}`
          : "No ball spot"
      }
      className={styles.strip}
      style={{ height }}
    >
      {endZone(game.away_team.abbr)}
      <div className={styles.field} style={{ opacity: spot ? 1 : 0.55 }}>
        {spot && (
          <>
            {spot.driveStartPct != null && (
              <div
                className={styles.drive}
                style={{
                  left: `${Math.min(spot.driveStartPct, spot.ballPct)}%`,
                  width: `${Math.abs(spot.ballPct - spot.driveStartPct)}%`,
                  backgroundColor: teamColor(offense.abbr),
                }}
              />
            )}
            <div
              className={`${styles.marker} ${styles.scrimmage}`}
              style={{ left: `${spot.ballPct}%` }}
            />
            {spot.firstDownPct != null && (
              <div
                className={`${styles.marker} ${styles.firstDown}`}
                style={{ left: `${spot.firstDownPct}%` }}
              />
            )}
            <Tooltip title={ballTooltip} arrow side="top">
              {/* Invisible hit area around the ball -- the ball itself is too
                  small to hover or tap reliably */}
              <div
                tabIndex={0}
                aria-label={ballTooltip}
                className={styles.ballHit}
                style={{
                  left: `${spot.ballPct}%`,
                  width: hitArea,
                  height: hitArea,
                }}
              >
                <div
                  className={styles.ball}
                  style={{
                    width: height * 0.55,
                    height: height * 0.38,
                    backgroundColor: BALL_BROWN,
                  }}
                />
              </div>
            </Tooltip>
          </>
        )}
      </div>
      {endZone(game.home_team.abbr)}
    </div>
  );
};
