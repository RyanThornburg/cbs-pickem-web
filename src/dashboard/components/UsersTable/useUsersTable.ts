import { useMemo, useState } from "react";
import {
  getCoreRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
} from "@tanstack/react-table";
import { RankedUser, UserSeasonTrends } from "../../types";
import { buildUsersTableColumns, toUsersTableRow } from "./usersTableColumns";

interface UseUsersTableArgs {
  userList: RankedUser[];
  trends: Record<string, UserSeasonTrends>;
  showSecondHalf: boolean;
}

// Shared sort + expand state for both the desktop and mobile UsersTable
// variants -- each renders its own markup (widths, abbreviated mobile
// headers) off the same table instance so sorting logic isn't duplicated.
// Row expansion (for UserTrendPanel) is plain local state rather than
// tanstack's row-expansion feature, since only one row is ever open at a
// time -- a Set/tree model would be more than this needs.
export const useUsersTable = ({ userList, trends, showSecondHalf }: UseUsersTableArgs) => {
  const [sorting, setSorting] = useState<SortingState>([{ id: "place", desc: false }]);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const data = useMemo(
    () => userList.map((user) => toUsersTableRow(user, trends)),
    [userList, trends]
  );
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

  const toggleExpanded = (id: string) => {
    setExpandedId((current) => (current === id ? null : id));
  };

  return { table, expandedId, toggleExpanded };
};
