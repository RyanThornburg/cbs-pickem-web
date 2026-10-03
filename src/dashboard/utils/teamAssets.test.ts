import TeamData from "../components/Scoreboard/utils/team_data.json";
import { teamBandColors } from "./teamAssets";

const contrastOnWhite = (hex: string) => {
  const [r, g, b] = [0, 2, 4].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 1.05 / (0.2126 * r + 0.7152 * g + 0.0722 * b + 0.05);
};

describe("teamBandColors", () => {
  it("keeps a dark team color as is", () => {
    expect(teamBandColors("BUF")).toEqual({ band: "00338d", stripe: "d50a0a" });
  });

  it("darkens a light team color until white text reads at 4.5:1", () => {
    const { band } = teamBandColors("NO");
    expect(band).not.toBe("d3bc8d");
    expect(contrastOnWhite(band)).toBeGreaterThanOrEqual(4.5);
  });

  it("gives every team a band white text can sit on", () => {
    Object.keys(TeamData).forEach((abbr) => {
      expect(contrastOnWhite(teamBandColors(abbr).band)).toBeGreaterThanOrEqual(
        4.5
      );
    });
  });

  it("swaps a white alternate for a darker shade of the band", () => {
    const { band, stripe } = teamBandColors("NYJ");
    expect(stripe).not.toBe("ffffff");
    expect(stripe).not.toBe(band);
  });

  it("reads feed abbreviations through the aliases", () => {
    expect(teamBandColors("JAX")).toEqual(teamBandColors("JAC"));
  });
});
