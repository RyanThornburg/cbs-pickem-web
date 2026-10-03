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

interface UseUsersTableArgs {
  userList: RankedUser[];
  trends: Record<string, UserSeasonTrends>;
  showSecondHalf: boolean;
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
  showSecondHalf,
  recap,
  showStreak,
}: UseUsersTableArgs) => {
  const [sorting, setSorting] = useState<SortingState>([
    { id: "place", desc: false },
  ]);

  const data = useMemo(() => {
    const movers = moversByUserId(recap);
    const perfect = perfectWeekUserIds(recap);
    return userList.map((user) =>
      toUsersTableRow(user, trends, {
        move: movers.get(user.id),
        perfectWeek: perfect.has(user.id),
        showStreak,
      })
    );
  }, [userList, trends, recap, showStreak]);
  const columns = useMemo(() => buildUsersTableColumns(), []);

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnVisibility: {
        second_half_place: showSecondHalf,
        second_half_score: showSecondHalf,
      },
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getRowId: (row) => row.id,
  });

  const { paidPlaces } = useCurrentWeek();
  const rows = table.getRowModel().rows;
  const lines = paidLines(
    rows.map((row) => row.original),
    sorting[0],
    paidPlaces,
    showSecondHalf
  );
  // Paid lines to draw under the row at this index in the sorted rows.
  const paidLinesAfter = (rowIndex: number) => lines.get(rowIndex) ?? [];

  return { table, paidLinesAfter };
};
