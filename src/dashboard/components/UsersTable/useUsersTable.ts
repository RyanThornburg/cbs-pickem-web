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

// Shared sort + expand state for both the desktop and mobile UsersTable
// variants -- each renders its own markup (widths, abbreviated mobile
// headers) off the same table instance so sorting logic isn't duplicated.
// Row expansion (for UserTrendPanel) is plain local state rather than
// tanstack's row-expansion feature, since only one row is ever open at a
// time -- a Set/tree model would be more than this needs.
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
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const toggleExpanded = (id: string) => {
    setExpandedId((current) => (current === id ? null : id));
  };

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
    // Read by the name cell's expand button (usersTableColumns.tsx).
    meta: { expandedId, toggleExpanded },
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

  return { table, expandedId, toggleExpanded, paidLinesAfter };
};
