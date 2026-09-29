import { Tidbit } from "../../types";

// Trends › Week shows at most MAX_CARDS tidbit cards, chosen by a fixed rule
// so the section can't get cluttered (every tidbit is still in the "All
// tidbits" list under the cards):
//   1. Always: chaos index (from 8 finals on) and pool accuracy.
//   2. Then groups not shown anywhere else, in the data's rank order.
//   3. Groups already shown as badges elsewhere (upset and spread flips on
//      the Scoreboard, movers on User Picks, streaks on Games) only fill in
//      while there are fewer than MIN_CARDS.
export const MAX_CARDS = 6;
export const MIN_CARDS = 4;

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
const SHOWN_ELSEWHERE: CardGroup[] = ["upset", "movers", "spreadWeek", "streaks"];

export const cardGroupOf = (t: Tidbit): CardGroup => {
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
  // Stable React key: the group, or the tidbit id for one-off kinds.
  key: string;
  group: CardGroup;
  // The group's tidbits, in rank order.
  tidbits: Tidbit[];
}

// Groups tidbits into cards (each card at the rank of its best tidbit).
export const groupIntoCards = (tidbits: Tidbit[]): WeekCard[] => {
  const cards: WeekCard[] = [];
  const byKey = new Map<string, WeekCard>();
  tidbits.forEach((t) => {
    const group = cardGroupOf(t);
    // Twins, oppos and any kind this UI doesn't know yet get a card each.
    const key = group === "other" ? t.id : group;
    const existing = byKey.get(key);
    if (existing) {
      existing.tidbits.push(t);
    } else {
      const card = { key, group, tidbits: [t] };
      byKey.set(key, card);
      cards.push(card);
    }
  });
  return cards;
};

export const selectWeekCards = (tidbits: Tidbit[]): WeekCard[] => {
  const cards = groupIntoCards(tidbits);
  const always = ALWAYS.flatMap((g) => cards.filter((c) => c.group === g));
  const rest = cards.filter((c) => !ALWAYS.includes(c.group) && !SHOWN_ELSEWHERE.includes(c.group));
  const fillers = cards.filter((c) => SHOWN_ELSEWHERE.includes(c.group));

  const chosen = [...always, ...rest].slice(0, MAX_CARDS);
  for (const filler of fillers) {
    if (chosen.length >= MIN_CARDS) break;
    chosen.push(filler);
  }
  return chosen;
};
