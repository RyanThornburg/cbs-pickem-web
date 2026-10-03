import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import { useState } from "react";
import { NflStandings, TeamRef, UserTeamRecord } from "../../types";
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
      fontSize: "0.75rem",
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

const hasGames = (entry?: UserTeamRecord) =>
  !!entry && entry.picked.picks + entry.against.picks > 0;

// One team's tile: the player's record picking them ("For") and picking
// their opponent ("Vs"), tinted by the two together.
const TeamTile = ({
  team,
  entry,
}: {
  team: TeamRef;
  entry?: UserTeamRecord;
}) => {
  const both = teamGamesRecord(entry);
  return (
    <TeamLink
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
        !hasGames(entry) && { opacity: 0.5 },
        TONE_SX[toneOf(both.wins, both.losses)],
      ]}
    >
      <TeamLogo abbr={team.abbr} size={20} decorative />
      <Box component="span" sx={{ fontWeight: 600, fontSize: "0.75rem" }}>
        {team.abbr}
      </Box>
      {line("For", entry?.picked)}
      {line("Vs", entry?.against)}
    </TeamLink>
  );
};

// The teams the player has picked, either side, most games first. "Show
// all 32" lays every team out like the standings, a column per division,
// so the gaps are visible too.
export function TeamGrid({
  standings,
  teams,
}: {
  standings: NflStandings;
  teams: UserTeamRecord[];
}) {
  const [showAll, setShowAll] = useState(false);
  const divisions = standings.conferences.flatMap((c) => c.divisions);
  const picked = teams
    .filter(hasGames)
    .sort(
      (a, b) =>
        b.picked.picks + b.against.picks - (a.picked.picks + a.against.picks)
    );
  const all = showAll || picked.length === 0;

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
      {all ? (
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
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  color: "text.secondary",
                  textAlign: "center",
                }}
              >
                {division.name}
              </Typography>
              {division.teams.map(({ team }) => (
                <TeamTile
                  key={team.id}
                  team={team}
                  entry={teams.find((t) => t.team.id === team.id)}
                />
              ))}
            </Box>
          ))}
        </Box>
      ) : (
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(76px, 1fr))",
            gap: 0.75,
          }}
        >
          {picked.map((entry) => (
            <TeamTile key={entry.team.id} team={entry.team} entry={entry} />
          ))}
        </Box>
      )}
      {picked.length > 0 && (
        <Button
          size="small"
          onClick={() => setShowAll((v) => !v)}
          sx={{ alignSelf: "flex-start" }}
        >
          {showAll ? "Only teams picked" : "Show all 32"}
        </Button>
      )}
    </Box>
  );
}
