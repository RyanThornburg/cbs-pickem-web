import { Fragment } from "react";
import { flexRender } from "@tanstack/react-table";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TableSortLabel from "@mui/material/TableSortLabel";
import { UserGridWithTrendsProps } from "./types";
import { useUsersTable } from "./useUsersTable";
import Box from "@mui/material/Box";
import { PaidLineRule } from "./PaidLineRule";
import { timeFormat } from "./StandingsStatus";
import { paidLineNote } from "./MoneyLines";
import { BadgeKey } from "./BadgeKey";
import { selectedRowSx } from "./selectedRowSx";
import { useNavigate } from "react-router-dom";
import { playerPath } from "../shared/PlayerLink";

const UserDataGrid = ({
  userList,
  userId,
  week,
  recap,
  showStreak,
  trends,
  moneyStandings,
  leaderboardStatus,
}: UserGridWithTrendsProps) => {
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
                  {header.column.id === "name" && <BadgeKey />}
                  {/* The last refresh, in the header row's spare room. The
                      phone table has none, so it shows nowhere there. */}
                  {header.column.id === "picks" &&
                    leaderboardStatus.updatedAt &&
                    !leaderboardStatus.failed && (
                      <Box
                        component="span"
                        sx={{
                          float: "right",
                          fontWeight: 400,
                          color: "text.secondary",
                          whiteSpace: "nowrap",
                        }}
                      >
                        Updated {timeFormat.format(leaderboardStatus.updatedAt)}
                      </Box>
                    )}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableHead>
        <TableBody>
          {table.getRowModel().rows.map((row, rowIndex) => {
            const isSelected = row.id === userId;

            return (
              <Fragment key={row.id}>
                <TableRow
                  hover
                  data-user-row={row.id}
                  onClick={() => openPlayer(row.id)}
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
                {paidLinesAfter(rowIndex).map((line) => (
                  <TableRow key={line.label}>
                    <TableCell
                      colSpan={row.getVisibleCells().length}
                      sx={{ py: 0, border: 0 }}
                    >
                      <PaidLineRule
                        label={line.label}
                        note={paidLineNote(moneyStandings, line.key)}
                      />
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
