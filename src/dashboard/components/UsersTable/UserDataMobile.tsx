import { Fragment } from "react";
import { flexRender } from "@tanstack/react-table";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TableSortLabel from "@mui/material/TableSortLabel";
import TableCell from "@mui/material/TableCell";
import { grey } from "@mui/material/colors";
import { styled } from "@mui/material/styles";
import { UserGridWithTrendsProps } from "./types";
import { useUsersTable } from "./useUsersTable";
import { PaidLineRule } from "./PaidLineRule";
import { paidLineNote } from "./MoneyLines";
import { BadgeKey } from "./BadgeKey";
import { selectedRowSx } from "./selectedRowSx";
import { useNavigate } from "react-router-dom";
import { playerPath } from "../shared/PlayerLink";

const StyledTableCellHeader = styled(TableCell)(() => ({
  "&.MuiTableCell-head": {
    fontSize: "0.75rem",
    fontWeight: 700,
    paddingLeft: 4,
    paddingRight: 4,
  },
}));

const StyledTableCell = styled(TableCell)(() => ({
  "&.MuiTableCell-head": {
    fontSize: "0.75rem",
    fontWeight: "regular",
  },
  paddingLeft: 4,
  paddingRight: 4,
}));

export default function UserDataMobile({
  userList,
  userId,
  week,
  recap,
  showStreak,
  trends,
  moneyStandings,
}: UserGridWithTrendsProps) {
  const navigate = useNavigate();
  const openPlayer = (id: string) => {
    navigate(playerPath(id));
    window.scrollTo({ top: 0 });
  };
  const { table, paidLinesAfter } = useUsersTable({
    userList,
    trends,
    week,
    recap,
    showStreak,
  });

  return (
    <TableContainer>
      <Table size="small" aria-label="Standings and picks">
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
                        // An inactive arrow still takes ~22px per column,
                        // which the name needs at 360px (six columns from
                        // the 2nd half on).
                        hideSortIcon
                        active={header.column.getIsSorted() !== false}
                        direction={header.column.getIsSorted() || "asc"}
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        {header.column.columnDef.meta?.mobileHeader ??
                          flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                      </TableSortLabel>
                    ) : (
                      (header.column.columnDef.meta?.mobileHeader ??
                      flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      ))
                    )}
                    {header.column.id === "name" && <BadgeKey />}
                  </StyledTableCellHeader>
                ))}
            </TableRow>
          ))}
        </TableHead>
        <TableBody sx={{ mb: 2 }}>
          {table.getRowModel().rows.map((row, rowIndex) => {
            const cells = row.getVisibleCells();
            const picksCell = cells.find((cell) => cell.column.id === "picks");
            const mainCells = cells.filter(
              (cell) => cell.column.id !== "picks"
            );
            const isSelected = row.id === userId;

            return (
              <Fragment key={row.id}>
                <TableRow
                  data-user-row={row.id}
                  onClick={() => openPlayer(row.id)}
                  sx={[
                    { borderTop: `2px solid ${grey[300]}`, cursor: "pointer" },
                    isSelected && selectedRowSx,
                  ]}
                >
                  {mainCells.map((cell) => (
                    <StyledTableCell
                      key={cell.id}
                      align={cell.column.columnDef.meta?.align ?? "left"}
                      // The name takes whatever the number columns leave,
                      // so it truncates only when it really can't fit.
                      sx={
                        cell.column.id === "name"
                          ? { width: "100%", maxWidth: 0 }
                          : { width: "1%", whiteSpace: "nowrap" }
                      }
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </StyledTableCell>
                  ))}
                </TableRow>
                {picksCell && (
                  <TableRow
                    onClick={() => openPlayer(row.id)}
                    sx={[{ cursor: "pointer" }, isSelected && selectedRowSx]}
                  >
                    <StyledTableCell
                      style={{ paddingBottom: "10px", paddingTop: "4px" }}
                      colSpan={mainCells.length}
                    >
                      {flexRender(
                        picksCell.column.columnDef.cell,
                        picksCell.getContext()
                      )}
                    </StyledTableCell>
                  </TableRow>
                )}
                {paidLinesAfter(rowIndex).map((line) => (
                  <TableRow key={line.label}>
                    <StyledTableCell
                      colSpan={mainCells.length}
                      sx={{ py: 0, border: 0 }}
                    >
                      <PaidLineRule
                        label={line.label}
                        note={paidLineNote(moneyStandings, line.key)}
                      />
                    </StyledTableCell>
                  </TableRow>
                ))}
              </Fragment>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
