import TeamData from "./team_data.json";
import { normalizeTeamAbbr } from "../../../utils/teamAssets";

// The last-resort fallback for a team still missing from team_data.json
// after normalizing its abbreviation.
const FALLBACK_TEAM_DATA = {
  icon: undefined as string | undefined,
  color: "666666",
  alternateColor: "999999",
};

export const getTeamData = (abbr: string) => {
  // Feeds that skip weekGames.ts (standings, team profiles) still send
  // JAX and LA, so normalize here too.
  const teamData = TeamData[normalizeTeamAbbr(abbr) as keyof typeof TeamData];
  if (!teamData) {
    console.warn(`No team_data.json entry for team abbreviation "${abbr}"`);
    return FALLBACK_TEAM_DATA;
  }
  return teamData;
};

export const teamColor = (abbr: string): string =>
  `#${getTeamData(abbr).color}`;
