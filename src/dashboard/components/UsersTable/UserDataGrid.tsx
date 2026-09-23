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
import { UserTrendPanel } from "./UserTrendPanel";

const highlightSx = {
  bgcolor: (theme: any) =>
    theme.palette.mode === "dark" ? "#78909c" : "#f0f4c3",
};

const UserDataGrid = ({
  userList,
  userId,
  showSecondHalf,
  trends,
}: UserGridWithTrendsProps) => {
  const { table, expandedId, toggleExpanded } = useUsersTable({
    userList,
    trends,
    showSecondHalf,
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
                      {flexRender(header.column.columnDef.header, header.getContext())}
                    </TableSortLabel>
                  ) : (
                    flexRender(header.column.columnDef.header, header.getContext())
                  )}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableHead>
        <TableBody>
          {table.getRowModel().rows.map((row) => {
            const isExpanded = expandedId === row.id;
            const isSelected = row.id === userId;

            return (
              <Fragment key={row.id}>
                <TableRow
                  hover
                  onClick={() => toggleExpanded(row.id)}
                  className={isSelected ? "highlight" : ""}
                  sx={{
                    cursor: "pointer",
                    ".highlight": highlightSx,
                    ...(isSelected ? highlightSx : {}),
                  }}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      align={cell.column.columnDef.meta?.align ?? "left"}
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
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
              </Fragment>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default UserDataGrid;
