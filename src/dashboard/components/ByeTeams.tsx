import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import { getTeamData } from "../utils/teamAssets";
import { TeamLink } from "./shared/TeamLink";
import { TeamLogo } from "./shared/TeamLogo";

// "On bye" box at the bottom of Games and Scoreboard. Renders nothing in a
// week where every team plays.
export const ByeTeams = ({ teams }: { teams: string[] }) => {
  if (!teams.length) return null;
  return (
    <Paper variant="outlined" sx={{ mt: 2, px: 1.75, py: 1.25 }}>
      <Typography
        variant="overline"
        sx={{
          display: "block",
          fontWeight: 700,
          color: "text.secondary",
          letterSpacing: "0.08em",
          lineHeight: 1.5,
          mb: 0.75,
        }}
      >
        On bye · {teams.length} {teams.length === 1 ? "team" : "teams"}
      </Typography>
      <Box
        sx={{ display: "flex", flexWrap: "wrap", columnGap: 2.5, rowGap: 1 }}
      >
        {teams.map((abbr) => (
          <TeamLink key={abbr} abbr={abbr} sx={{ gap: 0.75 }}>
            <TeamLogo abbr={abbr} size={22} decorative />
            <Typography sx={{ fontWeight: 700, fontSize: "0.875rem" }}>
              {abbr}
            </Typography>
            <Typography
              sx={{
                fontSize: "0.8rem",
                color: "text.secondary",
                display: { xs: "none", sm: "block" },
              }}
            >
              {getTeamData(abbr).name}
            </Typography>
          </TeamLink>
        ))}
      </Box>
    </Paper>
  );
};
