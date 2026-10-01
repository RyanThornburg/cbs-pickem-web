import Box from "@mui/material/Box";
import { GameStatus, UserPick } from "../../types";
import { StatusColor } from "../../helper";
import Paper from "@mui/material/Paper";
import { styled } from "@mui/material/styles";
import { Divider, Stack, Typography } from "@mui/material";
import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import TrendingDownIcon from "@mui/icons-material/TrendingDown";
import { SvgIconComponent } from "@mui/icons-material";

const pickStatusKey = (pick: UserPick): keyof typeof StatusColor => {
  if (!pick.visible) return "TBD";
  if (pick.is_correct === true) return "CORRECT";
  if (pick.is_correct === false) return "INCORRECT";
  if (pick.trending_status && pick.trending_status in StatusColor) {
    return pick.trending_status as keyof typeof StatusColor;
  }
  return "NONE";
};

// Read by screen readers, not shown.
const visuallyHidden = {
  position: "absolute",
  width: 1,
  height: 1,
  margin: "-1px",
  padding: 0,
  border: 0,
  overflow: "hidden",
  clip: "rect(0 0 0 0)",
  whiteSpace: "nowrap",
} as const;

// A second channel besides the tile color (DESIGN.md's "Status Needs A
// Second Channel" rule): an icon for sighted users, words for screen readers.
// Final games say won/lost; live ones say covering/not covering, with the
// same trend arrows the Scoreboard's your-pick badge uses.
const pickResult = (
  pick: UserPick,
  isGameOver: boolean
): { label: string; Icon?: SvgIconComponent } => {
  if (!pick.visible) return { label: "pick not shown yet" };
  if (pick.is_correct === true) return { label: "won", Icon: CheckIcon };
  if (pick.is_correct === false) return { label: "lost", Icon: CloseIcon };
  if (!isGameOver && pick.trending_status === "CORRECT")
    return { label: "covering", Icon: TrendingUpIcon };
  if (!isGameOver && pick.trending_status === "INCORRECT")
    return { label: "not covering", Icon: TrendingDownIcon };
  return { label: "not started" };
};

const GamePickFormatted = (pick: UserPick, index: number, header: boolean) => {
  const team = pick.visible ? pick.team : "TBD";

  const fontWeight = "regular";
  const fontStyle = "normal";

  const isGameOver = pick.visible && pick.game_status === GameStatus.Final;
  const inProgress = pick.visible && pick.game_status === GameStatus.Inprogress;

  const statusKey = pickStatusKey(pick);
  const { label, Icon } = pickResult(pick, isGameOver);
  const statusColor = StatusColor[statusKey];

  const Item = styled(Paper)(({ theme }) => [
    {
      backgroundColor: statusColor.bgColor,
      ...theme.typography.body2,
      // Contains the visually hidden result text, which would otherwise be
      // placed against the page and widen it.
      position: "relative",
      padding: 0.5,
      width: 60,
      // The header row is tight at 1200-1400px, so its tiles fit their
      // content (abbreviation + result icon) instead of the table's 70px,
      // at the summary's own 13px until xl.
      [theme.breakpoints.up("lg")]: header
        ? {
            width: "auto",
            minWidth: 44,
            padding: "0 5px",
            fontSize: "0.8125rem",
          }
        : { width: 70 },
      [theme.breakpoints.up("xl")]: header ? { fontSize: "0.875rem" } : {},
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
      <Item>
        <Box
          component="span"
          sx={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "2px",
            maxWidth: "100%",
          }}
        >
          {team}
          {Icon && (
            <Icon aria-hidden sx={{ fontSize: "0.85em", flexShrink: 0 }} />
          )}
          <Box component="span" sx={visuallyHidden}>
            , {label}
          </Box>
        </Box>
      </Item>
    </Box>
  );
};

// GetUserByWeek already returns picks in the right order and padded to 5 (real
// visible picks first, then TBD placeholders, or empty if the user made no picks) --
// no further filtering/sorting needed here.
export const UserGamePicksStack = (
  picks: Array<UserPick>,
  header: boolean = false,
  // RankedUser.has_submitted_picks; undefined when the feed didn't say.
  submitted?: boolean
) => {
  const spacingSize = header ? 0.5 : 1;

  // The feed says this player hasn't submitted, as opposed to "TBD" tiles
  // (submitted, hidden until kickoff). If it doesn't say, show nothing.
  if (picks.length === 0) {
    if (submitted !== false) return null;
    return (
      <Typography variant="body2" sx={{ color: "text.secondary" }}>
        No picks yet
      </Typography>
    );
  }

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
