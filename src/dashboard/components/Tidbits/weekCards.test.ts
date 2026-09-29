import { Tidbit } from "../../types";
import { cardGroupOf, groupIntoCards, MAX_CARDS, selectWeekCards } from "./weekCards";

const t = (id: string, overrides: Partial<Tidbit> = {}): Tidbit => ({
  id,
  kind: id.split(":")[0],
  category: "pool",
  scope: "week",
  score: 1,
  headline: id,
  short: id,
  sample_size: null,
  data: {},
  ...overrides,
});

// Real week 3 order (version 2 key, 2026-09-29).
const WEEK3 = [
  t("winless_week"),
  t("pool_split:side:away", { scope: "season" }),
  t("pool_split:slot:monday", { scope: "season" }),
  t("pool_split:slot:sunday_night", { scope: "season" }),
  t("pool_split:division:yes", { scope: "season" }),
  t("pool_split:fav:favorite", { scope: "season" }),
  t("chaos_index"),
  t("upset_of_week"),
  t("pool_accuracy"),
  t("biggest_mover:up"),
  t("biggest_mover:down"),
  t("popular_picks:season", { scope: "season" }),
  t("crowd_record:season", { scope: "season" }),
  t("cover_streak:cover", { scope: "season" }),
  t("cover_streak:miss", { scope: "season" }),
  t("spread_mattered"),
  t("crowd_record"),
  t("popular_picks"),
  t("spread_mattered:season", { scope: "season" }),
  t("perfect_week"),
];

describe("cardGroupOf", () => {
  it("splits spread_mattered by scope and routes league kinds by category", () => {
    expect(cardGroupOf(t("spread_mattered"))).toBe("spreadWeek");
    expect(cardGroupOf(t("spread_mattered:season", { scope: "season" }))).toBe("spreadSeason");
    expect(cardGroupOf(t("home_road_covers:league", { category: "league" }))).toBe("league");
    expect(cardGroupOf(t("twins:3-7"))).toBe("other");
  });
});

describe("groupIntoCards", () => {
  it("folds a group's tidbits into one card at its best rank", () => {
    const cards = groupIntoCards(WEEK3);
    expect(cards.map((c) => c.key).slice(0, 4)).toEqual(["accuracy", "splits", "chaos", "upset"]);
    expect(cards.find((c) => c.key === "splits")?.tidbits).toHaveLength(5);
    expect(cards.find((c) => c.key === "accuracy")?.tidbits.map((x) => x.id)).toEqual([
      "winless_week",
      "pool_accuracy",
      "perfect_week",
    ]);
  });

  it("gives each unknown kind its own card", () => {
    const cards = groupIntoCards([t("twins:3-7"), t("oppos:3-7"), t("twins:1-2")]);
    expect(cards.map((c) => c.key)).toEqual(["twins:3-7", "oppos:3-7", "twins:1-2"]);
  });
});

describe("selectWeekCards", () => {
  it("picks week 3's cards: chaos and accuracy first, then groups not shown elsewhere", () => {
    expect(selectWeekCards(WEEK3).map((c) => c.key)).toEqual([
      "chaos",
      "accuracy",
      "splits",
      "crowd",
      "spreadSeason",
    ]);
  });

  it("caps the number of cards", () => {
    const many = [t("chaos_index"), t("pool_accuracy"), ...Array.from({ length: 8 }, (_, i) => t(`twins:${i}`))];
    const cards = selectWeekCards(many);
    expect(cards).toHaveLength(MAX_CARDS);
    expect(cards.slice(0, 2).map((c) => c.group)).toEqual(["chaos", "accuracy"]);
  });

  it("fills with badge groups only while there are fewer than 4 cards", () => {
    const early = [t("upset_of_week"), t("pool_accuracy"), t("biggest_mover:up"), t("spread_mattered"), t("cover_streak:cover")];
    expect(selectWeekCards(early).map((c) => c.key)).toEqual(["accuracy", "upset", "movers", "spreadWeek"]);
  });

  it("handles an empty list", () => {
    expect(selectWeekCards([])).toEqual([]);
  });
});
