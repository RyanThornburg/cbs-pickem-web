import { getInitialTab, isPrimaryTab, setStoredTab } from "./defaultTab";

describe("getInitialTab", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("falls back to picks on a true cold start (nothing stored)", () => {
    expect(getInitialTab()).toBe("picks");
  });

  it("returns whatever tab was last stored", () => {
    setStoredTab("trends");
    expect(getInitialTab()).toBe("trends");
  });

  it("lands a stored Games or Scoreboard tab on the NFL tab", () => {
    localStorage.setItem("activeTab", "scoreboard");
    expect(getInitialTab()).toBe("nfl");
    localStorage.setItem("activeTab", "games");
    expect(getInitialTab()).toBe("nfl");
  });

  it("ignores a garbage stored value and falls back to picks", () => {
    localStorage.setItem("activeTab", "not-a-real-tab");
    expect(getInitialTab()).toBe("picks");
  });
});

describe("isPrimaryTab", () => {
  it("accepts the three known tabs", () => {
    expect(isPrimaryTab("picks")).toBe(true);
    expect(isPrimaryTab("nfl")).toBe(true);
    expect(isPrimaryTab("trends")).toBe(true);
  });

  it("rejects anything else", () => {
    expect(isPrimaryTab("odds")).toBe(false);
    expect(isPrimaryTab("scoreboard")).toBe(false);
    expect(isPrimaryTab(undefined)).toBe(false);
  });
});
