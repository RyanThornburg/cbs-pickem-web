import TeamData from "./team_data.json";

// Team abbreviations are normalized to team_data.json's keys upstream (see
// src/dashboard/data/weekGames.ts's toTeam) -- this is just the last-resort fallback
// for a team that's still missing from team_data.json entirely.
const FALLBACK_TEAM_DATA = {
  icon: undefined as string | undefined,
  color: "666666",
  alternateColor: "999999",
};

export const getTeamData = (abbr: string) => {
  const teamData = TeamData[abbr as keyof typeof TeamData];
  if (!teamData) {
    console.warn(`No team_data.json entry for team abbreviation "${abbr}"`);
    return FALLBACK_TEAM_DATA;
  }
  return teamData;
};

export const teamColor = (abbr: string): string =>
  `#${getTeamData(abbr).color}`;
