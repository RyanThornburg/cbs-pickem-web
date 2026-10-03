import TeamData from "../components/Scoreboard/utils/team_data.json";

// Every team logo, bundled by Vite and keyed by path ("../icons/ARI.png").
const TEAM_ICONS = import.meta.glob<string>("../icons/*.png", {
  eager: true,
  import: "default",
});

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
  return icon ? TEAM_ICONS[`../icons/${icon}`] : undefined;
};

// "Buffalo Bills", for a team page heading; the abbreviation if unknown.
export const getTeamFullName = (abbr: string): string => {
  const entry = TeamData[normalizeTeamAbbr(abbr) as keyof typeof TeamData];
  return entry?.displayName ?? abbr;
};

// sRGB relative luminance of a "rrggbb" hex, for the contrast check below.
const luminance = (hex: string): number => {
  const [r, g, b] = [0, 2, 4].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

const darken = (hex: string, amount: number): string =>
  [0, 2, 4]
    .map((i) =>
      Math.round(parseInt(hex.slice(i, i + 2), 16) * (1 - amount))
        .toString(16)
        .padStart(2, "0")
    )
    .join("");

// The team page's header band: the team's color behind white text,
// darkened just enough for 4.5:1 where the team color is light (NO gold,
// CIN orange, TEN powder blue), and the alternate color as a stripe under
// it. Hex without "#", like team_data.json.
export const teamBandColors = (
  abbr: string
): { band: string; stripe: string } => {
  const data = TeamData[normalizeTeamAbbr(abbr) as keyof typeof TeamData] as
    { color: string; alternateColor?: string } | undefined;
  let band = data?.color ?? FALLBACK_TEAM_DATA(abbr).color;
  for (
    let step = 0;
    step < 20 && 1.05 / (luminance(band) + 0.05) < 4.5;
    step++
  ) {
    band = darken(band, 0.08);
  }
  const alt = data?.alternateColor;
  // A white or near-band alternate would vanish; fall back to the band's
  // own darker shade.
  const stripe =
    alt && alt.toLowerCase() !== "ffffff" && alt.toLowerCase() !== band
      ? alt
      : darken(band, 0.35);
  return { band, stripe };
};
