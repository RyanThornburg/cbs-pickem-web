import Box from "@mui/material/Box";
import Tooltip from "@mui/material/Tooltip";
import { Game, Possession } from "../../../../types";
import { getBallSpot } from "../../utils/scoreboardUtils";
import { teamColor } from "../../utils/teamData";
import { BALL_BROWN } from "./BallIcon";

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
    <Box
      aria-hidden
      sx={{
        bgcolor: teamColor(abbr),
        color: "#fff",
        display: "grid",
        placeItems: "center",
        fontSize: 12,
        fontWeight: 700,
        lineHeight: 1,
        overflow: "hidden",
      }}
    >
      {labelled && abbr}
    </Box>
  );

  return (
    <Box
      role="img"
      aria-label={
        spot
          ? `Ball on the ${spot.label}${spot.driveStartLabel ? `, drive started at the ${spot.driveStartLabel}` : ""}`
          : "No ball spot"
      }
      sx={(theme) => ({
        display: "grid",
        gridTemplateColumns: "8% 84% 8%",
        height,
        borderRadius: "4px",
        overflow: "hidden",
        bgcolor: "#2f7a45",
        ...theme.applyStyles("dark", { bgcolor: "#1f5a33" }),
      })}
    >
      {endZone(game.away_team.abbr)}
      <Box
        sx={{
          position: "relative",
          opacity: spot ? 1 : 0.55,
          backgroundImage:
            "repeating-linear-gradient(90deg, transparent 0 calc(10% - 1px), rgba(255,255,255,0.3) calc(10% - 1px) 10%)",
        }}
      >
        {spot && (
          <>
            {spot.driveStartPct != null && (
              <Box
                sx={{
                  position: "absolute",
                  top: "22%",
                  bottom: "22%",
                  left: `${Math.min(spot.driveStartPct, spot.ballPct)}%`,
                  width: `${Math.abs(spot.ballPct - spot.driveStartPct)}%`,
                  bgcolor: teamColor(offense.abbr),
                  opacity: 0.75,
                  boxShadow: "0 0 0 1px rgba(255,255,255,0.5)",
                  borderRadius: "2px",
                }}
              />
            )}
            <Box
              sx={{
                position: "absolute",
                top: 0,
                bottom: 0,
                width: 2,
                left: `${spot.ballPct}%`,
                bgcolor: "#4aa3ff",
              }}
            />
            {spot.firstDownPct != null && (
              <Box
                sx={{
                  position: "absolute",
                  top: 0,
                  bottom: 0,
                  width: 2,
                  left: `${spot.firstDownPct}%`,
                  bgcolor: "#ffd23f",
                }}
              />
            )}
            <Tooltip
              title={ballTooltip}
              arrow
              placement="top"
              enterTouchDelay={0}
              leaveTouchDelay={3000}
            >
              {/* Invisible hit area around the ball -- the ball itself is too
                  small to hover or tap reliably */}
              <Box
                tabIndex={0}
                aria-label={ballTooltip}
                sx={{
                  position: "absolute",
                  top: "50%",
                  left: `${spot.ballPct}%`,
                  width: Math.max(24, height * 1.4),
                  height: Math.max(24, height * 1.4),
                  transform: "translate(-50%, -50%)",
                  display: "grid",
                  placeItems: "center",
                  cursor: "default",
                  zIndex: 1,
                  "&:focus-visible": {
                    outline: "2px solid #fff",
                    borderRadius: "50%",
                  },
                }}
              >
                <Box
                  sx={{
                    width: height * 0.55,
                    height: height * 0.38,
                    borderRadius: "50%",
                    bgcolor: BALL_BROWN,
                    border: "1.5px solid #fff",
                  }}
                />
              </Box>
            </Tooltip>
          </>
        )}
      </Box>
      {endZone(game.home_team.abbr)}
    </Box>
  );
};
