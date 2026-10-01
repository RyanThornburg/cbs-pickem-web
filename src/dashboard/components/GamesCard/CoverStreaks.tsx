import { RecapCoverStreak } from "../../types";

// Active cover/miss streaks of 3+ for a game's teams, as one line under the
// matchup (from the week's recap). Its own line rather than inside each
// team row, which is too narrow for it on desktop.
export default function CoverStreaks({
  streaks,
}: {
  streaks: (RecapCoverStreak | undefined)[];
}) {
  const shown = streaks.filter((s): s is RecapCoverStreak => !!s);
  if (!shown.length) return null;
  return (
    <div className="gc-streaks">
      {shown.map((s) => (
        <span key={s.team.id} className={`gc-streak ${s.streak_type}`}>
          {/* "missed 3 straight" could mean anything; say what didn't
              happen. Both start "N straight" so they line up side by side. */}
          {s.streak_type === "cover"
            ? `${s.team.abbr}: ${s.length} straight covers`
            : `${s.team.abbr}: ${s.length} straight without a cover`}
        </span>
      ))}
    </div>
  );
}
