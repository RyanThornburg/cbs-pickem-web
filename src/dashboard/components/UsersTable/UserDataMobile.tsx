import * as React from "react";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import { useEffect, useState } from "react";
import { RankedUser } from "../../types";
import Stack from "@mui/material/Stack";
import { grey } from "@mui/material/colors";
import TableCell from "@mui/material/TableCell";
import { UserGamePicksStack } from "./UserPickStack";
import { UserGridProps } from "./types";
import UserAvatar from "../UserAvatar";
import { styled } from "@mui/material/styles";
import { Box } from "@mui/material";
import { PlaceCell } from "./PlaceCell";

const StyledTableCellHeader = styled(TableCell)(({ theme }) => ({
  "&.MuiTableCell-head": {
    fontSize: "0.75rem",
    fontWeight: "bold",
  },
}));

const StyledTableCell = styled(TableCell)(({ theme }) => ({
  "&.MuiTableCell-head": {
    fontSize: "0.75rem",
    fontWeight: "regular",
  },
}));

interface UserRowProps {
  row: UserRow;
  isSelected: boolean;
  showSecondHalf: boolean;
}

interface UserRow {
  name: string;
  userScore: number;
  weekScore: number;
  secondHalf: number;
  userPicks: JSX.Element;
  id: string;
  place: number | null;
  secondHalfPlace: number | null;
}

function createUserData(user: RankedUser): UserRow {
  const {
    name,
    cumulative_score,
    weekly_score,
    trending_score,
    second_half_score,
    picks,
    id,
    place,
    second_half_place,
  } = user;
  const userScore = cumulative_score + trending_score;
  const weekScore = trending_score + weekly_score;
  const secondHalf = (second_half_score ?? 0) + trending_score;
  const userPicks = UserGamePicksStack(picks);
  return {
    name,
    userScore,
    weekScore,
    secondHalf,
    userPicks,
    id,
    place,
    secondHalfPlace: second_half_place,
  };
}

function UserPlace({ name, id }: UserRow) {
  return (
    <Stack
      sx={{
        alignItems: "center",
        justifyContent: "flex-start",
      }}
      direction="row"
      spacing={0.5}
    >
      <UserAvatar
        userName={name ?? ""}
        fontSize={"0.75rem"}
        size={24}
        userId={id}
      />
    </Stack>
  );
}

function Row({ row, isSelected, showSecondHalf }: UserRowProps) {
  return (
    <React.Fragment>
      <TableRow
        key={`userRow-${row.name.replace(" ", "")}`}
        id={`userRow-${row.name.replace(" ", "")}-${isSelected}`}
        className={isSelected ? "highlight" : ""}
        sx={{
          borderTop: `2px solid ${grey[300]}`,
          ".highlight": {
            bgcolor: "#f0f4c3",
          },
        }}
      >
        <StyledTableCell align="center">
          <PlaceCell place={row.place} />
        </StyledTableCell>
        {showSecondHalf && (
          <StyledTableCell align="center">
            <PlaceCell place={row.secondHalfPlace} />
          </StyledTableCell>
        )}
        <StyledTableCell
          component="th"
          scope="row"
          sx={{
            width: { xs: "35%", sm: "40%" },
            maxWidth: { xs: "120px", sm: "140px" },
          }}
        >
          {UserPlace(row)}
        </StyledTableCell>
        <StyledTableCell align="center">{row.userScore}</StyledTableCell>
        {showSecondHalf && (
          <StyledTableCell align="center">{row.secondHalf}</StyledTableCell>
        )}
        <StyledTableCell align="center">{row.weekScore}</StyledTableCell>
      </TableRow>
      <TableRow
        className={isSelected ? "highlight" : ""}
        id={`userScore-${row.name.replace(" ", "")}`}
        sx={{
          ".highlight": {
            bgcolor: (theme) =>
              theme.palette.mode === "dark" ? "#78909c" : "#f0f4c3",
          },
        }}
      >
        <StyledTableCell
          style={{ paddingBottom: "10px", paddingTop: "4px" }}
          colSpan={showSecondHalf ? 6 : 4}
        >
          {row.userPicks}
        </StyledTableCell>
      </TableRow>
    </React.Fragment>
  );
}

export default function UserDataMobile({
  userList,
  userId,
  showSecondHalf,
}: UserGridProps) {
  const [rows, setRows] = useState<UserRow[] | undefined>(undefined);

  useEffect(() => {
    if (userList.length > 0) {
      const mappedUsers = userList.map(createUserData);
      setRows(mappedUsers);
    }
  }, [userList]);

  if (!rows) {
    return null;
  }

  return (
    <TableContainer>
      <Table size="small" aria-label="a dense table">
        <TableHead>
          <TableRow>
            <StyledTableCellHeader align="center">Place</StyledTableCellHeader>
            {showSecondHalf && (
              <StyledTableCellHeader align="center">
                <Box sx={{ display: { xs: "none", sm: "block" } }}>
                  2nd Half Place
                </Box>
                <Box sx={{ display: { xs: "block", sm: "none" } }}>2H Plc</Box>
              </StyledTableCellHeader>
            )}
            <StyledTableCellHeader
              sx={{
                width: { xs: "35%", sm: "40%" }, // smaller on mobile, slightly larger on tablet+
                maxWidth: { xs: "120px", sm: "140px" }, // prevent it from getting too wide
              }}
            >
              Name
            </StyledTableCellHeader>
            <StyledTableCellHeader align="center">Score</StyledTableCellHeader>
            {showSecondHalf && (
              <StyledTableCellHeader align="center">
                <Box sx={{ display: { xs: "none", sm: "block" } }}>
                  2nd Half
                </Box>
                <Box sx={{ display: { xs: "block", sm: "none" } }}>2H</Box>
              </StyledTableCellHeader>
            )}
            <StyledTableCellHeader align="center">
              <Box sx={{ display: { xs: "none", sm: "block" } }}>Week</Box>
              <Box sx={{ display: { xs: "block", sm: "none" } }}>Wk</Box>
            </StyledTableCellHeader>
          </TableRow>
        </TableHead>
        <TableBody
          sx={{
            mb: 2,
            ".highlight": "#f0f4c3",
          }}
        >
          {rows.map((row) => (
            <Row
              key={`mobile-${row.name}`}
              isSelected={row.id === userId}
              row={row}
              showSecondHalf={showSecondHalf}
            />
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
