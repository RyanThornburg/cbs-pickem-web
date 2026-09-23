import { Fragment } from "react";
import { flexRender } from "@tanstack/react-table";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TableSortLabel from "@mui/material/TableSortLabel";
import TableCell from "@mui/material/TableCell";
import Collapse from "@mui/material/Collapse";
import { grey } from "@mui/material/colors";
import { styled } from "@mui/material/styles";
import { UserGridWithTrendsProps } from "./types";
import { useUsersTable } from "./useUsersTable";
import { UserTrendPanel } from "./UserTrendPanel";

const StyledTableCellHeader = styled(TableCell)(({ theme }) => ({
  "&.MuiTableCell-head": {
    fontSize: "0.75rem",
    fontWeight: "bold",
    paddingLeft: 4,
    paddingRight: 4,
  },
}));

const StyledTableCell = styled(TableCell)(({ theme }) => ({
  "&.MuiTableCell-head": {
    fontSize: "0.75rem",
    fontWeight: "regular",
  },
  paddingLeft: 4,
  paddingRight: 4,
}));

const highlightSx = {
  bgcolor: (theme: any) =>
    theme.palette.mode === "dark" ? "#78909c" : "#f0f4c3",
};

export default function UserDataMobile({
  userList,
  userId,
  showSecondHalf,
  trends,
}: UserGridWithTrendsProps) {
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
      <Table size="small" aria-label="a dense table">
        <TableHead>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers
                .filter((header) => header.column.id !== "picks")
                .map((header) => (
                  <StyledTableCellHeader
                    key={header.id}
                    align={header.column.columnDef.meta?.align ?? "left"}
                  >
                    {header.column.getCanSort() ? (
                      <TableSortLabel
                        active={header.column.getIsSorted() !== false}
                        direction={header.column.getIsSorted() || "asc"}
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        {header.column.columnDef.meta?.mobileHeader ??
                          flexRender(header.column.columnDef.header, header.getContext())}
                      </TableSortLabel>
                    ) : (
                      header.column.columnDef.meta?.mobileHeader ??
                      flexRender(header.column.columnDef.header, header.getContext())
                    )}
                  </StyledTableCellHeader>
                ))}
            </TableRow>
          ))}
        </TableHead>
        <TableBody sx={{ mb: 2 }}>
          {table.getRowModel().rows.map((row) => {
            const cells = row.getVisibleCells();
            const picksCell = cells.find((cell) => cell.column.id === "picks");
            const mainCells = cells.filter((cell) => cell.column.id !== "picks");
            const isExpanded = expandedId === row.id;
            const isSelected = row.id === userId;
            const highlightClass = isSelected ? "highlight" : "";

            return (
              <Fragment key={row.id}>
                <TableRow
                  onClick={() => toggleExpanded(row.id)}
                  className={highlightClass}
                  sx={{
                    borderTop: `2px solid ${grey[300]}`,
                    cursor: "pointer",
                    ".highlight": highlightSx,
                    ...(isSelected ? highlightSx : {}),
                  }}
                >
                  {mainCells.map((cell) => (
                    <StyledTableCell
                      key={cell.id}
                      align={cell.column.columnDef.meta?.align ?? "left"}
                      sx={
                        cell.column.id === "name"
                          ? {
                              width: { xs: "35%", sm: "40%" },
                              maxWidth: { xs: "120px", sm: "140px" },
                            }
                          : undefined
                      }
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </StyledTableCell>
                  ))}
                </TableRow>
                {picksCell && (
                  <TableRow className={highlightClass} sx={{ ".highlight": highlightSx }}>
                    <StyledTableCell
                      style={{ paddingBottom: "10px", paddingTop: "4px" }}
                      colSpan={mainCells.length}
                    >
                      {flexRender(picksCell.column.columnDef.cell, picksCell.getContext())}
                    </StyledTableCell>
                  </TableRow>
                )}
                <TableRow>
                  <StyledTableCell
                    colSpan={mainCells.length}
                    sx={{ py: 0, border: isExpanded ? undefined : 0 }}
                  >
                    <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                      <UserTrendPanel trends={trends[row.id]} />
                    </Collapse>
                  </StyledTableCell>
                </TableRow>
              </Fragment>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
