import Paper from "@mui/material/Paper";
import { RankedUser } from "../../types";
import { useCurrentWeek } from "../CurrentWeekContext";
import { leaderList } from "./leadersUtils";
import { CardHead, Rows } from "./SecondHalfLeaders";

type Props = {
  userList: RankedUser[];
  userId?: string;
  week: number;
};

// Before the 2nd half starts, 1st-half and overall standings are the same
// points in the same order, so one card shows both prizes: everyone through
// the overall paid places, with a line at each cutoff. From the 2nd-half
// start week SecondHalfLeaders takes over.
export default function FirstHalfLeaders({ userList, userId, week }: Props) {
  const { paidPlaces } = useCurrentWeek();
  const list = leaderList(userList, "overall", paidPlaces.overall, userId);
  // Nothing to rank yet (week 1 before any results): everyone is tied at 0.
  if (!list.rows.some((row) => row.score + row.covering > 0)) return null;

  // The 1st-half line goes under the last row inside its cutoff, unless
  // that's the whole list (then it would sit on the overall line).
  const lastFirstHalf = list.rows.reduce(
    (last, row, i) => (row.place <= paidPlaces.first_half ? i : last),
    -1
  );
  const linesAfter = new Map<number, string>();
  if (lastFirstHalf >= 0 && lastFirstHalf < list.rows.length - 1) {
    linesAfter.set(lastFirstHalf, `1st half pays top ${paidPlaces.first_half}`);
  }

  return (
    <Paper
      variant="outlined"
      // The width of one of SecondHalfLeaders' two cards, so the switch at
      // the 2nd-half start week doesn't change its size.
      sx={{
        px: { xs: 1.5, sm: 1.75 },
        py: 1.5,
        mb: 1.5,
        textAlign: "left",
        maxWidth: { sm: "calc(50% - 6px)" },
      }}
    >
      <CardHead title="Leaders" sub={`Week ${week} · 1st half`} />
      <Rows
        list={list}
        userId={userId}
        linesAfter={linesAfter}
        endLine={`Overall pays top ${paidPlaces.overall}`}
      />
    </Paper>
  );
}
