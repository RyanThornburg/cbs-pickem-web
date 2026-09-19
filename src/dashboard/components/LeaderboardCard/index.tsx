import { memo, useCallback, useMemo } from "react";
import Looks3Icon from "@mui/icons-material/Looks3";
import LooksOneIcon from "@mui/icons-material/LooksOne";
import LooksTwoIcon from "@mui/icons-material/LooksTwo";
import Looks4 from "@mui/icons-material/Looks4";
import Looks5 from "@mui/icons-material/Looks5";
import {
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import Stack from "@mui/material/Stack";
import { RankedUser } from "../../types";
import UserAvatar from "../UserAvatar";

const iconLookup = {
  1: <LooksOneIcon color="success" />,
  2: <LooksTwoIcon color="primary" />,
  3: <Looks3Icon color="secondary" />,
  4: <Looks4 color="warning" />,
  5: <Looks5 color="error" />,
} as const;

export type StatsLeaderboardProps = {
  userList: RankedUser[];
  isSecondHalf: boolean;
  userId: string;
};

// Memoize UserRow component since it's used in a loop
const UserRow = memo(({ name, userId }: { name: string; userId: string }) => (
  <Stack
    sx={{
      alignItems: "center",
    }}
    direction="row"
    spacing={2}
  >
    <UserAvatar
      userName={name}
      userId={userId}
      size={{ xs: 24, lg: 28 }}
      fontSize={{ xs: "0.75rem", sm: "0.875rem", lg: "1rem" }}
    />
  </Stack>
));

UserRow.displayName = "UserRow";

// Memoize TableHeader component
const TableHeader = memo(() => (
  <TableHead>
    <TableRow>
      <TableCell>Place</TableCell>
      <TableCell>Name</TableCell>
      <TableCell>Score</TableCell>
    </TableRow>
  </TableHead>
));

TableHeader.displayName = "TableHeader";

const StatsLeaderboard = ({
  userList,
  isSecondHalf,
  userId,
}: StatsLeaderboardProps) => {
  // Filter and sort users in one pass
  const users = useMemo(() => {
    return userList
      .filter((user) =>
        isSecondHalf
          ? (user?.second_half_place ?? 99) <= 5
          : (user?.place ?? 99) <= 5
      )
      .sort((a, b) => {
        const aRank = isSecondHalf
          ? a?.second_half_place ?? 99
          : a?.place ?? 99;
        const bRank = isSecondHalf
          ? b?.second_half_place ?? 99
          : b?.place ?? 99;

        if (aRank !== bRank) {
          return aRank - bRank;
        }
        return a.name.toUpperCase().localeCompare(b.name.toUpperCase());
      });
  }, [userList, isSecondHalf]);

  const getScore = useCallback(
    (user: RankedUser) => {
      return (
        (isSecondHalf ? user.second_half_score ?? 0 : user.cumulative_score) +
        user.trending_score
      );
    },
    [isSecondHalf]
  );

  return (
    <Card variant="outlined" sx={{ height: "100%", flexGrow: 1 }}>
      <CardContent>
        <Typography sx={{ color: "text.secondary" }}>
          {isSecondHalf ? "Second Half" : "Overall"} Leaderboard
        </Typography>
        <TableContainer style={{ maxHeight: 165 }}>
          <Table size="small">
            <TableHeader />
            <TableBody>
              {users.map((row: RankedUser) => (
                <TableRow
                  key={row.id}
                  sx={{
                    "&:last-child td, &:last-child th": { border: 0 },
                    bgcolor:
                      row.id === userId
                        ? (theme) =>
                            theme.palette.mode === "dark"
                              ? "#78909c"
                              : "#f0f4c3"
                        : "inherit",
                  }}
                >
                  <TableCell align="center" component="th" scope="row">
                    {
                      iconLookup[
                        isSecondHalf
                          ? (row.second_half_place! as keyof typeof iconLookup)
                          : (row.place as keyof typeof iconLookup)
                      ]
                    }
                  </TableCell>
                  <TableCell>
                    <UserRow name={row.name} userId={row.id} />
                  </TableCell>
                  <TableCell align="center">{getScore(row)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </CardContent>
    </Card>
  );
};

export default memo(StatsLeaderboard);
