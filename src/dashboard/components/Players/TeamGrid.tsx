import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { NflStandings, UserTeamRecord } from "../../types";
import { TeamLink } from "../shared/TeamLink";
import { TeamLogo } from "../shared/TeamLogo";
import { Tone, teamGamesRecord, toneOf } from "./playerUtils";

const TONE_SX: Record<Tone, object> = {
  good: { bgcolor: "#f1f8f2", borderColor: "#a5d6a7" },
  bad: { bgcolor: "#fdf0f0", borderColor: "#ef9a9a" },
  neutral: {},
};

const line = (label: string, record?: { wins: number; losses: number }) => (
  <Box
    component="span"
    sx={{
      fontSize: "0.6875rem",
      color: "text.secondary",
      whiteSpace: "nowrap",
      fontVariantNumeric: "tabular-nums",
    }}
  >
    {label}{" "}
    <Box component="b" sx={{ color: "text.primary", fontWeight: 600 }}>
      {record && record.wins + record.losses > 0
        ? `${record.wins}-${record.losses}`
        : "–"}
    </Box>
  </Box>
);

// All 32 teams laid out like the standings (a column per division): the
// player's record picking each team ("For") and picking their opponent
// ("Vs"). Tinted by the two together, the team's games either way.
export function TeamGrid({
  standings,
  teams,
}: {
  standings: NflStandings;
  teams: UserTeamRecord[];
}) {
  const divisions = standings.conferences.flatMap((c) => c.divisions);
  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: {
          xs: "repeat(4, minmax(0, 1fr))",
          lg: "repeat(8, minmax(0, 1fr))",
        },
        gap: 0.75,
      }}
    >
      {divisions.map((division) => (
        <Box
          key={division.name}
          role="group"
          aria-label={division.name}
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: 0.5,
            minWidth: 0,
          }}
        >
          <Typography
            aria-hidden
            sx={{
              fontSize: "0.6875rem",
              fontWeight: 600,
              color: "text.secondary",
              textAlign: "center",
            }}
          >
            {division.name}
          </Typography>
          {division.teams.map(({ team }) => {
            const entry = teams.find((t) => t.team.id === team.id);
            const both = teamGamesRecord(entry);
            return (
              <TeamLink
                key={team.id}
                abbr={team.abbr}
                sx={[
                  {
                    flexDirection: "column",
                    gap: "1px",
                    py: 0.75,
                    border: 1,
                    borderColor: "hsl(220, 20%, 88%)",
                    borderRadius: 1.5,
                    bgcolor: "background.paper",
                    "&:hover": {
                      borderColor: "primary.main",
                      textDecoration: "none",
                    },
                  },
                  !entry && { opacity: 0.5 },
                  TONE_SX[toneOf(both.wins, both.losses)],
                ]}
              >
                <TeamLogo abbr={team.abbr} size={20} decorative />
                <Box
                  component="span"
                  sx={{ fontWeight: 600, fontSize: "0.75rem" }}
                >
                  {team.abbr}
                </Box>
                {line("For", entry?.picked)}
                {line("Vs", entry?.against)}
              </TeamLink>
            );
          })}
        </Box>
      ))}
    </Box>
  );
}
