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

const hexToRgb = (hex: string): [number, number, number] => {
  const n = parseInt(hex.replace("#", ""), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};

// WCAG relative luminance, 0 (black) - 1 (white)
const luminance = (hex: string): number => {
  const [r, g, b] = hexToRgb(hex).map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.04) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

const distance = (a: string, b: string): number => {
  const [x, y] = [hexToRgb(a), hexToRgb(b)];
  return Math.hypot(x[0] - y[0], x[1] - y[1], x[2] - y[2]);
};

// Colors for two teams' stat bars: each team's primary unless it would
// disappear on the background (near-black in dark mode, near-white in light)
// or match the other team, then its alternate.
export const matchupBarColors = (
  awayAbbr: string,
  homeAbbr: string,
  mode: "light" | "dark"
): { away: string; home: string } => {
  const visible = (hex: string) =>
    mode === "dark" ? luminance(hex) > 0.04 : luminance(hex) < 0.8;
  const options = (abbr: string) => {
    const { color, alternateColor } = getTeamData(abbr);
    const all = [`#${color}`, `#${alternateColor}`];
    const ok = all.filter(visible);
    return ok.length ? ok : all;
  };
  const awayOptions = options(awayAbbr);
  const homeOptions = options(homeAbbr);
  const home = homeOptions[0];
  const away =
    awayOptions.find((c) => distance(c, home) > 90) ?? awayOptions[0];
  return { away, home };
};
