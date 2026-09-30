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

const GamePickFormatted = (pick: UserPick, index: number, header: boolean) => {
  const team = pick.visible ? pick.team : "TBD";

  const fontWeight = "regular";
  const fontStyle = "normal";

  const isGameOver = pick.visible && pick.game_status === GameStatus.Final;
  const inProgress = pick.visible && pick.game_status === GameStatus.Inprogress;

  const statusKey = pickStatusKey(pick);
  const statusColor = StatusColor[statusKey];

  const Item = styled(Paper)(({ theme }) => [
    {
      backgroundColor: statusColor.bgColor,
      ...theme.typography.body2,
      padding: 0.5,
      width: 60,
      // The header row is tight at 1200-1400px, and a team abbreviation
      // needs far less than the table's 70px.
      [theme.breakpoints.up("lg")]: {
        width: header ? 48 : 70,
      },
      // On phones the five tiles share the row's width instead, so they fit
      // at 360px (fixed 60px tiles overflowed the table).
      [theme.breakpoints.only("xs")]: {
        width: "100%",
        fontSize: ".75rem",
      },
      textAlign: "center",
      color: theme.palette.text.primary,
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
    <Box key={index} sx={{ flex: { xs: "1 1 0", sm: "none" }, minWidth: 0 }}>
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
        width: { xs: "100%", sm: "auto" },
      }}
      direction="row"
      spacing={{ xs: 0.5, sm: 0.35, md: spacingSize }}
      divider={
        <Divider
          orientation="vertical"
          flexItem
          sx={{ display: { xs: "none", sm: "block" } }}
        />
      }
    >
      {picks.map((pick, index) => GamePickFormatted(pick, index, header))}
    </Stack>
  );
};
