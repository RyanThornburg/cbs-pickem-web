import { RecapCoverStreak } from "../../types";

// Active cover/miss streaks of 3+ for a game's teams, as one line under the
// matchup (from the week's recap). Its own line rather than inside each
// team row, which is too narrow for it on desktop.
export default function CoverStreaks({ streaks }: { streaks: (RecapCoverStreak | undefined)[] }) {
  const shown = streaks.filter((s): s is RecapCoverStreak => !!s);
  if (!shown.length) return null;
  return (
    <div className="gc-streaks">
      {shown.map((s) => (
        <span key={s.team.id} className={`gc-streak ${s.streak_type}`}>
          {s.team.abbr} {s.streak_type === "cover" ? "covered" : "missed"} {s.length} straight
        </span>
      ))}
    </div>
  );
}
