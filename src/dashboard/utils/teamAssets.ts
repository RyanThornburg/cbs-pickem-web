import TeamData from "../components/Scoreboard/utils/team_data.json";

type TeamAsset = { icon: string | undefined; color: string; name: string };

// The KV feed's team abbreviations don't always match team_data.json's ESPN-derived
// keys -- normalized once here so every consumer (logos, colors, and weekGames.ts's
// Team joins) sees the same abbreviation.
export const TEAM_ABBR_ALIASES: Record<string, string> = {
  JAX: "JAC",
  WSH: "WAS",
  LA: "LAR",
};

const FALLBACK_TEAM_DATA = (abbr: string): TeamAsset => ({
  icon: undefined,
  color: "666666",
  name: abbr,
});

export const normalizeTeamAbbr = (abbr: string): string =>
  TEAM_ABBR_ALIASES[abbr] ?? abbr;

export const getTeamData = (abbr: string): TeamAsset => {
  const normalized = normalizeTeamAbbr(abbr);
  return (
    TeamData[normalized as keyof typeof TeamData] ?? FALLBACK_TEAM_DATA(abbr)
  );
};

export const getTeamLogoSrc = (abbr: string): string | undefined => {
  const icon = getTeamData(abbr).icon;
  return icon ? require(`../icons/${icon}`) : undefined;
};
