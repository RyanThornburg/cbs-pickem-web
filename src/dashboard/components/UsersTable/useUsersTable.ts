import { useMemo, useState } from "react";
import {
  getCoreRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
} from "@tanstack/react-table";
import { RankedUser, UserSeasonTrends, WeekRecap } from "../../types";
import { moversByUserId, perfectWeekUserIds } from "../Recap/recapBadges";
import { buildUsersTableColumns, toUsersTableRow } from "./usersTableColumns";
import { useCurrentWeek } from "../CurrentWeekContext";
import { paidLines } from "./usersTableUtils";
import { shownSegment } from "../../utils/payPeriods";

interface UseUsersTableArgs {
  userList: RankedUser[];
  trends: Record<string, UserSeasonTrends>;
  // The browsed week, which picks the segment columns and paid lines.
  week: number;
  recap?: WeekRecap;
  showStreak: boolean;
}

// Shared sort state for both the desktop and mobile UsersTable variants --
// each renders its own markup (widths, abbreviated mobile headers) off the
// same table instance so sorting logic isn't duplicated. A row opens the
// player's page (it used to expand a trend panel, now on that page).
export const useUsersTable = ({
  userList,
  trends,
  week,
  recap,
  showStreak,
}: UseUsersTableArgs) => {
  const [sorting, setSorting] = useState<SortingState>([
    { id: "place", desc: false },
  ]);

  const { periods } = useCurrentWeek();
  const segment = shownSegment(periods, week);

  const data = useMemo(() => {
    const movers = moversByUserId(recap);
    const perfect = perfectWeekUserIds(recap);
    return userList.map((user) =>
      toUsersTableRow(
        user,
        trends,
        {
          move: movers.get(user.id),
          perfectWeek: perfect.has(user.id),
          showStreak,
        },
        { periods, week }
      )
    );
  }, [userList, trends, recap, showStreak, periods, week]);
  const columns = useMemo(() => buildUsersTableColumns(segment), [segment]);

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnVisibility: {
        segment_place: segment !== null,
        segment_score: segment !== null,
      },
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getRowId: (row) => row.id,
  });

  const rows = table.getRowModel().rows;
  const lines = paidLines(
    rows.map((row) => row.original),
    sorting[0],
    periods,
    week
  );
  // Paid lines to draw under the row at this index in the sorted rows.
  const paidLinesAfter = (rowIndex: number) => lines.get(rowIndex) ?? [];

  return { table, paidLinesAfter };
};
