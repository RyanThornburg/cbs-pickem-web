import { RecapItem } from "../../types";

// Trends › Week shows at most MAX_CARDS item cards (one row on desktop),
// chosen by a fixed rule so the section can't get cluttered (every item is
// still in the "All N items" list):
//   1. Always: chaos index (from 8 finals on) and pool accuracy.
//   2. Then groups not shown anywhere else, in the data's rank order.
//   3. Only while there are fewer than MAX_CARDS: the pool splits card (a
//      tall, dense card), then groups already shown as badges elsewhere
//      (upset and spread flips on the Scoreboard, movers on User Picks,
//      streaks on Games).
export const MAX_CARDS = 4;

export type CardGroup =
  | "chaos"
  | "accuracy"
  | "crowd"
  | "spreadSeason"
  | "splits"
  | "league"
  | "upset"
  | "movers"
  | "spreadWeek"
  | "streaks"
  | "other";

const ALWAYS: CardGroup[] = ["chaos", "accuracy"];
const FALLBACK: CardGroup[] = ["splits"];
const SHOWN_ELSEWHERE: CardGroup[] = [
  "upset",
  "movers",
  "spreadWeek",
  "streaks",
];

export const cardGroupOf = (t: RecapItem): CardGroup => {
  switch (t.kind) {
    case "chaos_index":
      return "chaos";
    case "pool_accuracy":
    case "perfect_week":
    case "winless_week":
      return "accuracy";
    case "crowd_record":
    case "popular_picks":
      return "crowd";
    case "spread_mattered":
      return t.scope === "season" ? "spreadSeason" : "spreadWeek";
    case "pool_split":
      return "splits";
    case "upset_of_week":
      return "upset";
    case "biggest_mover":
      return "movers";
    case "cover_streak":
      return "streaks";
  }
  if (t.category === "league") return "league";
  return "other";
};

export interface WeekCard {
  // Stable React key: the group, or the item id for one-off kinds.
  key: string;
  group: CardGroup;
  // The group's items, in rank order.
  items: RecapItem[];
}

// Groups items into cards (each card at the rank of its best item).
export const groupIntoCards = (items: RecapItem[]): WeekCard[] => {
  const cards: WeekCard[] = [];
  const byKey = new Map<string, WeekCard>();
  items.forEach((t) => {
    const group = cardGroupOf(t);
    // Twins, oppos and any kind this UI doesn't know yet get a card each.
    const key = group === "other" ? t.id : group;
    const existing = byKey.get(key);
    if (existing) {
      existing.items.push(t);
    } else {
      const card = { key, group, items: [t] };
      byKey.set(key, card);
      cards.push(card);
    }
  });
  return cards;
};

export const selectWeekCards = (items: RecapItem[]): WeekCard[] => {
  const cards = groupIntoCards(items);
  const always = ALWAYS.flatMap((g) => cards.filter((c) => c.group === g));
  const low = [...FALLBACK, ...SHOWN_ELSEWHERE];
  const rest = cards.filter(
    (c) => !ALWAYS.includes(c.group) && !low.includes(c.group)
  );
  const fallback = cards.filter((c) => FALLBACK.includes(c.group));
  const fillers = cards.filter((c) => SHOWN_ELSEWHERE.includes(c.group));
  return [...always, ...rest, ...fallback, ...fillers].slice(0, MAX_CARDS);
};
