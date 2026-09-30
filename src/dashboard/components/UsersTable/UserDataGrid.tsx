import { Fragment } from "react";
import { flexRender } from "@tanstack/react-table";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TableSortLabel from "@mui/material/TableSortLabel";
import Collapse from "@mui/material/Collapse";
import { UserGridWithTrendsProps } from "./types";
import { useUsersTable } from "./useUsersTable";
import { PaidLineRule } from "./PaidLineRule";
import { UserTrendPanel } from "./UserTrendPanel";
import { selectedRowSx } from "./selectedRowSx";

const UserDataGrid = ({
  userList,
  userId,
  showSecondHalf,
  recap,
  showStreak,
  trends,
}: UserGridWithTrendsProps) => {
  const { table, expandedId, toggleExpanded, paidLinesAfter } = useUsersTable({
    userList,
    trends,
    showSecondHalf,
    recap,
    showStreak,
  });

  if (userList.length === 0) {
    return null;
  }

  return (
    <TableContainer>
      <Table size="small">
        <TableHead>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableCell
                  key={header.id}
                  align={header.column.columnDef.meta?.align ?? "left"}
                  sx={{ fontSize: "0.75rem", fontWeight: "bold" }}
                >
                  {header.column.getCanSort() ? (
                    <TableSortLabel
                      active={header.column.getIsSorted() !== false}
                      direction={header.column.getIsSorted() || "asc"}
                      onClick={header.column.getToggleSortingHandler()}
                    >
                      {flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                    </TableSortLabel>
                  ) : (
                    flexRender(
                      header.column.columnDef.header,
                      header.getContext()
                    )
                  )}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableHead>
        <TableBody>
          {table.getRowModel().rows.map((row, rowIndex) => {
            const isExpanded = expandedId === row.id;
            const isSelected = row.id === userId;

            return (
              <Fragment key={row.id}>
                <TableRow
                  hover
                  onClick={() => toggleExpanded(row.id)}
                  sx={[{ cursor: "pointer" }, isSelected && selectedRowSx]}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      align={cell.column.columnDef.meta?.align ?? "left"}
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
                <TableRow>
                  <TableCell
                    colSpan={row.getVisibleCells().length}
                    sx={{ py: 0, border: isExpanded ? undefined : 0 }}
                  >
                    <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                      <UserTrendPanel trends={trends[row.id]} />
                    </Collapse>
                  </TableCell>
                </TableRow>
                {paidLinesAfter(rowIndex).map((line) => (
                  <TableRow key={line.label}>
                    <TableCell
                      colSpan={row.getVisibleCells().length}
                      sx={{ py: 0, border: 0 }}
                    >
                      <PaidLineRule label={line.label} />
                    </TableCell>
                  </TableRow>
                ))}
              </Fragment>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default UserDataGrid;
