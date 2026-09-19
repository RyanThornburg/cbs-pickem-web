import { getInitialTab, isPrimaryTab, setStoredTab } from "./defaultTab";

describe("getInitialTab", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("falls back to picks on a true cold start (nothing stored)", () => {
    expect(getInitialTab()).toBe("picks");
  });

  it("returns whatever tab was last stored", () => {
    setStoredTab("scoreboard");
    expect(getInitialTab()).toBe("scoreboard");
  });

  it("ignores a garbage stored value and falls back to picks", () => {
    localStorage.setItem("activeTab", "not-a-real-tab");
    expect(getInitialTab()).toBe("picks");
  });
});

describe("isPrimaryTab", () => {
  it("accepts the four known tabs", () => {
    expect(isPrimaryTab("picks")).toBe(true);
    expect(isPrimaryTab("games")).toBe(true);
    expect(isPrimaryTab("scoreboard")).toBe(true);
    expect(isPrimaryTab("trends")).toBe(true);
  });

  it("rejects anything else", () => {
    expect(isPrimaryTab("odds")).toBe(false);
    expect(isPrimaryTab(undefined)).toBe(false);
  });
});
