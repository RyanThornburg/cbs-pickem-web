import { MONEY_GOLD } from "./StandingsStatus";
import { ShownMoneyStanding } from "./usersTableUtils";
import styles from "./MoneyLines.module.css";

export const pts = (n: number) => `${n} pt${n === 1 ? "" : "s"}`;
const weeksLeft = (n: number) => `${n} wk${n === 1 ? "" : "s"} left`;

// One line per prize the player is in, or within reach of: "1st half  In
// the money · top 3" or "Overall  2 pts out · 15 wks left". The words carry
// the meaning; gold only marks "in the money".
export function MoneyLines({ standings }: { standings: ShownMoneyStanding[] }) {
  return (
    <span className={styles.lines}>
      {standings.map((standing) => (
        <span key={standing.key} className={styles.line}>
          <span className={styles.muted}>{standing.prize}</span>
          <span>
            {standing.inMoney ? (
              <span className={styles.strong} style={{ color: MONEY_GOLD }}>
                In the money
              </span>
            ) : (
              <span className={styles.strong}>{pts(standing.ptsOut)} out</span>
            )}
            <span className={styles.muted}>
              {" · "}
              {standing.inMoney
                ? `top ${standing.cutoff}`
                : weeksLeft(standing.weeksLeft)}
            </span>
          </span>
        </span>
      ))}
    </span>
  );
}

// The note on a paid line for a player chasing that prize, or nothing.
export const paidLineNote = (
  standings: ShownMoneyStanding[],
  key: ShownMoneyStanding["key"]
): string | undefined => {
  const standing = standings.find((s) => s.key === key);
  return standing && !standing.inMoney
    ? `you're ${pts(standing.ptsOut)} back`
    : undefined;
};
