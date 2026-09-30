import { Stadium } from "../types";
import { getVenueBadge } from "./venue";

const stadium = (overrides: Partial<Stadium>): Stadium => ({
  name: "Test Stadium",
  city: "Seattle",
  state: "WA",
  country: "USA",
  roof_type: "Open",
  ...overrides,
});

describe("getVenueBadge", () => {
  it("returns null for a US stadium with no neutral-site flag", () => {
    expect(getVenueBadge(stadium({}))).toBeNull();
    expect(getVenueBadge(stadium({}), false)).toBeNull();
  });

  it("returns null when the stadium is missing and the flag is unknown", () => {
    expect(getVenueBadge(undefined)).toBeNull();
  });

  it("flags an international stadium even without the neutral-site flag", () => {
    expect(
      getVenueBadge(
        stadium({ city: "London", state: undefined, country: "England" })
      )
    ).toEqual({ kind: "international", label: "London, England" });
  });

  it("prefers international over neutral when both apply", () => {
    expect(
      getVenueBadge(
        stadium({ city: "Rio de Janeiro", country: "Brazil" }),
        true
      )
    ).toEqual({ kind: "international", label: "Rio de Janeiro, Brazil" });
  });

  it("falls back to country alone when city is empty", () => {
    expect(getVenueBadge(stadium({ city: "", country: "Brazil" }))).toEqual({
      kind: "international",
      label: "Brazil",
    });
  });

  it("flags a domestic neutral site from the flag", () => {
    expect(
      getVenueBadge(stadium({ city: "Detroit", state: "MI" }), true)
    ).toEqual({ kind: "neutral", label: "Neutral site · Detroit, MI" });
  });

  it("labels a neutral site with no location detail", () => {
    expect(getVenueBadge(undefined, true)).toEqual({
      kind: "neutral",
      label: "Neutral site",
    });
  });
});
