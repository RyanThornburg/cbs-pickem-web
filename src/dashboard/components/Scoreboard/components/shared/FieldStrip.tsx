import Box from "@mui/material/Box";
import { Game, Possession } from "../../../../types";
import { getBallSpot } from "../../utils/scoreboardUtils";
import { teamColor } from "../../utils/teamData";

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
  const offense =
    game.live?.possession === Possession.Home ? game.home_team : game.away_team;
  const endZone = (abbr: string) => (
    <Box
      sx={{
        bgcolor: teamColor(abbr),
        color: "rgba(255,255,255,0.9)",
        display: "grid",
        placeItems: "center",
        fontSize: Math.max(8, height * 0.42),
        fontWeight: 700,
        lineHeight: 1,
      }}
    >
      {abbr}
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
      sx={{
        display: "grid",
        gridTemplateColumns: "8% 84% 8%",
        height,
        borderRadius: "4px",
        overflow: "hidden",
        bgcolor: (theme) => (theme.palette.mode === "dark" ? "#1f5a33" : "#2f7a45"),
      }}
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
            <Box sx={{ position: "absolute", top: 0, bottom: 0, width: 2, left: `${spot.ballPct}%`, bgcolor: "#4aa3ff" }} />
            {spot.firstDownPct != null && (
              <Box sx={{ position: "absolute", top: 0, bottom: 0, width: 2, left: `${spot.firstDownPct}%`, bgcolor: "#ffd23f" }} />
            )}
            <Box
              sx={{
                position: "absolute",
                top: "50%",
                left: `${spot.ballPct}%`,
                width: height * 0.55,
                height: height * 0.38,
                borderRadius: "50%",
                bgcolor: "#8b4a1e",
                border: "1.5px solid #fff",
                transform: "translate(-50%, -50%)",
              }}
            />
          </>
        )}
      </Box>
      {endZone(game.home_team.abbr)}
    </Box>
  );
};
