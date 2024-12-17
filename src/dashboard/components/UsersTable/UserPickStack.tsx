import Box from "@mui/material/Box";
import { GameStatus, Pick, PickStatus } from "../../types";
import { StatusColor } from "../../helper";
import Paper from "@mui/material/Paper";
import { styled } from "@mui/material/styles";
import { Divider, Stack } from "@mui/material";

const GamePickFormatted = (pick: Pick, index: number) => {
  const team = pick.visible
    ? pick.team
    : pick.pick_status === PickStatus.Missing
    ? "N/A"
    : pick.game_status === GameStatus.Scheduled
    ? "TBD"
    : "???";

  let fontWeight = "regular";
  let fontStyle = "normal";

  const isGameOver = pick.visible && pick.game_status === GameStatus.Final;
  const inProgress = pick.visible && pick.game_status === GameStatus.Inprogress;

  const statusColor =
    StatusColor[(pick.pick_status as keyof typeof StatusColor) ?? "TBD"];

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
    pick.pick_status === "CORRECT" && {
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

export const UserGamePicksStack = (
  picks: Array<Pick>,
  header: boolean = false
) => {
  const spacingSize = header ? 0.5 : 1;
  const visiblePicks = picks.filter((pick) => pick.visible);
  const hiddenPicks = picks.filter((pick) => !pick.visible);
  // Combine them, taking all visible picks and enough non-visible picks to reach 5 total
  // const combinedPicks = [
  //   ...visiblePicks,
  //   ...hiddenPicks.slice(0, Math.max(0, 5 - visiblePicks.length)),
  // ].slice(0, 5);

  const allFinal = visiblePicks.every((pick) => pick.game_status === "FINAL");

  // Combine the picks
  let combinedPicks = [
    ...visiblePicks,
    ...hiddenPicks.slice(0, Math.max(0, 5 - visiblePicks.length)),
  ];

  // If all visible picks are FINAL, sort TBD before FINAL
  if (allFinal) {
    combinedPicks = combinedPicks.sort((a, b) => {
      // Put TBD games first
      if (
        a.game_status === GameStatus.Scheduled &&
        b.game_status === GameStatus.Final
      )
        return -1;
      if (
        a.game_status === GameStatus.Final &&
        b.game_status === GameStatus.Scheduled
      )
        return 1;

      // For games with same status, maintain original order
      return 0;
    });
  }

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
      {combinedPicks && combinedPicks.map(GamePickFormatted)}
    </Stack>
  );
};
