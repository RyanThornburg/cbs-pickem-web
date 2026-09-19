import Box from "@mui/material/Box";
import { GameStatus, UserPick } from "../../types";
import { StatusColor } from "../../helper";
import Paper from "@mui/material/Paper";
import { styled } from "@mui/material/styles";
import { Divider, Stack } from "@mui/material";

const pickStatusKey = (pick: UserPick): keyof typeof StatusColor => {
  if (!pick.visible) return "TBD";
  if (pick.is_correct === true) return "CORRECT";
  if (pick.is_correct === false) return "INCORRECT";
  if (pick.trending_status && pick.trending_status in StatusColor) {
    return pick.trending_status as keyof typeof StatusColor;
  }
  return "NONE";
};

const GamePickFormatted = (pick: UserPick, index: number) => {
  const team = pick.visible ? pick.team : "TBD";

  let fontWeight = "regular";
  let fontStyle = "normal";

  const isGameOver = pick.visible && pick.game_status === GameStatus.Final;
  const inProgress = pick.visible && pick.game_status === GameStatus.Inprogress;

  const statusKey = pickStatusKey(pick);
  const statusColor = StatusColor[statusKey];

  const Item = styled(Paper)(({ theme }) => [
    {
      backgroundColor: statusColor.bgColor,
      ...theme.typography.body2,
      padding: 0.5,
      [theme.breakpoints.only("xs")]: {
        padding: 0.3,
      },
      width: 60,
      [theme.breakpoints.up("lg")]: {
        width: 70,
      },
      textAlign: "center",
      color: theme.palette.text.primary,
      [theme.breakpoints.only("xs")]: {
        fontSize: ".75rem",
      },
      fontWeight: fontWeight,
      fontStyle: fontStyle,
      ...theme.applyStyles("dark", { backgroundColor: statusColor.bgBack }),
    },
    statusKey === "CORRECT" && {
      backgroundColor: theme.palette.primary[50],
    },
    isGameOver && {
      border: `thin solid ${statusColor.borderColor}`,
    },
    inProgress && {
      border: `dashed ${statusColor.borderInProgressColor}`,
      fontStyle: "italic",
    },
  ]);

  return (
    <Box key={index}>
      <Item>{team}</Item>
    </Box>
  );
};

// GetUserByWeek already returns picks in the right order and padded to 5 (real
// visible picks first, then TBD placeholders, or empty if the user made no picks) --
// no further filtering/sorting needed here.
export const UserGamePicksStack = (
  picks: Array<UserPick>,
  header: boolean = false
) => {
  const spacingSize = header ? 0.5 : 1;

  return (
    <Stack
      sx={{
        justifyContent: "flex-start",
        alignItems: "center",
      }}
      direction="row"
      spacing={{ xs: 0.35, md: spacingSize }}
      divider={<Divider orientation="vertical" flexItem />}
    >
      {picks.map(GamePickFormatted)}
    </Stack>
  );
};
