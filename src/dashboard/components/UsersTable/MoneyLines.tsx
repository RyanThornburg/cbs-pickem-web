import Box from "@mui/material/Box";
import { MONEY_GOLD } from "./StandingsStatus";
import { ShownMoneyStanding } from "./usersTableUtils";

export const pts = (n: number) => `${n} pt${n === 1 ? "" : "s"}`;
const weeksLeft = (n: number) => `${n} wk${n === 1 ? "" : "s"} left`;

// One line per prize the player is in, or within reach of: "1st half  In
// the money · top 3" or "Overall  2 pts out · 15 wks left". The words carry
// the meaning; gold only marks "in the money".
export function MoneyLines({ standings }: { standings: ShownMoneyStanding[] }) {
  return (
    <Box
      component="span"
      sx={{
        display: "grid",
        gridTemplateColumns: "auto auto",
        columnGap: 1.25,
        fontSize: "0.8125rem",
        lineHeight: 1.4,
        whiteSpace: "nowrap",
        textAlign: "left",
      }}
    >
      {standings.map((standing) => (
        <Box component="span" key={standing.key} sx={{ display: "contents" }}>
          <Box component="span" sx={{ color: "text.secondary" }}>
            {standing.prize}
          </Box>
          <Box component="span">
            {standing.inMoney ? (
              <Box component="span" sx={{ color: MONEY_GOLD, fontWeight: 600 }}>
                In the money
              </Box>
            ) : (
              <Box component="span" sx={{ fontWeight: 600 }}>
                {pts(standing.ptsOut)} out
              </Box>
            )}
            <Box component="span" sx={{ color: "text.secondary" }}>
              {" · "}
              {standing.inMoney
                ? `top ${standing.cutoff}`
                : weeksLeft(standing.weeksLeft)}
            </Box>
          </Box>
        </Box>
      ))}
    </Box>
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
