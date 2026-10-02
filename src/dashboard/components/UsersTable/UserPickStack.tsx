import Box from "@mui/material/Box";
import { GameStatus, UserPick } from "../../types";
import { StatusColor, visuallyHidden } from "../../helper";
import Paper from "@mui/material/Paper";
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

// One pick: the fill carries the result, the edge carries the game's state
// (none before kickoff, dashed and italic while live, solid when final), and
// an icon plus hidden text repeat the result without color. Also drawn in
// the badge key.
export const PickTile = ({
  pick,
  header = false,
}: {
  pick: UserPick;
  header?: boolean;
}) => {
  const team = pick.visible ? pick.team : "TBD";
  const isGameOver = pick.visible && pick.game_status === GameStatus.Final;
  const inProgress = pick.visible && pick.game_status === GameStatus.Inprogress;

  const { label, Icon } = pickResult(pick, isGameOver);
  const statusColor = StatusColor[pickStatusKey(pick)];

  return (
    <Paper
      sx={[
        {
          typography: "body2",
          bgcolor: statusColor.bgColor,
          // Contains the visually hidden result text, which would otherwise
          // be placed against the page and widen it.
          position: "relative",
          // The header row is tight at 1200-1400px, so its tiles fit their
          // content (abbreviation + result icon) instead of the table's
          // 70px, at the summary's own 13px until xl. On phones the five
          // tiles share the row's width instead, so they fit at 360px.
          padding: header ? { xs: "0.5px", lg: "0 5px" } : "0.5px",
          width: { xs: "100%", sm: 60, lg: header ? "auto" : 70 },
          minWidth: header ? { lg: 44 } : undefined,
          fontSize: header
            ? { xs: ".75rem", sm: "0.875rem", lg: "0.8125rem", xl: "0.875rem" }
            : { xs: ".75rem", sm: "0.875rem" },
          textAlign: "center",
          color: "text.primary",
        },
        isGameOver && { border: `thin solid ${statusColor.borderColor}` },
        inProgress && {
          border: `dashed ${statusColor.borderInProgressColor}`,
          fontStyle: "italic",
        },
        (theme) => theme.applyStyles("dark", { bgcolor: statusColor.bgBack }),
      ]}
    >
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
    </Paper>
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
      // Hairlines between the table's tiles; the header's spaced pills don't
      // need them (they dropped in and out at fractional offsets).
      divider={
        header ? undefined : (
          <Divider
            orientation="vertical"
            flexItem
            sx={{ display: { xs: "none", sm: "block" } }}
          />
        )
      }
    >
      {picks.map((pick) => (
        <Box
          key={pick.game_id}
          sx={{ flex: { xs: "1 1 0", sm: "none" }, minWidth: 0 }}
        >
          <PickTile pick={pick} header={header} />
        </Box>
      ))}
    </Stack>
  );
};
