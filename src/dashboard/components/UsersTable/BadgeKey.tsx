import { ReactNode, useState } from "react";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import Popover from "@mui/material/Popover";
import Typography from "@mui/material/Typography";
import HelpOutlineIcon from "@mui/icons-material/HelpOutlineOutlined";
import { GameStatus, UserPick } from "../../types";
import { MoverBadge, PerfectWeekBadge } from "../Recap/PlayerBadges";
import { DefendingChampionBadge } from "./DefendingChampionBadge";
import { StreakBadge } from "./StreakBadge";
import { FormTile } from "./WeeklyFormIcon";
import { PickTile } from "./UserPickStack";
import { MONEY_GOLD } from "./StandingsStatus";
import { WEEKLY_FORM_HOT_PCT, WEEKLY_FORM_COLD_PCT } from "./usersTableUtils";

const sample = (
  is_correct: boolean | null,
  game_status: GameStatus,
  trending_status?: string
): UserPick => ({
  game_id: 0,
  team: "BUF",
  is_correct,
  trending_status,
  game_status,
  visible: true,
});

const SAMPLE_MOVE = { user_id: 0, name: "" };

const tbd: UserPick = {
  game_id: 0,
  team: "",
  is_correct: null,
  game_status: GameStatus.Scheduled,
  visible: false,
};

function Row({ mark, children }: { mark: ReactNode; children: ReactNode }) {
  return (
    <Box
      component="li"
      sx={{
        display: "grid",
        gridTemplateColumns: "4.5rem minmax(0, 1fr)",
        columnGap: 1.5,
        alignItems: "center",
        py: 0.5,
      }}
    >
      <Box sx={{ display: "flex", gap: 0.5, alignItems: "center" }}>{mark}</Box>
      <Typography variant="body2">{children}</Typography>
    </Box>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Box component="section" sx={{ "& + &": { mt: 1.5 } }}>
      <Typography
        component="h3"
        variant="caption"
        sx={{ fontWeight: 700, color: "text.secondary" }}
      >
        {title}
      </Typography>
      <Box component="ul" sx={{ listStyle: "none", m: 0, p: 0 }}>
        {children}
      </Box>
    </Box>
  );
}

const pct = (n: number) => `${Math.round(n * 100)}%`;

// The one place every mark on User Picks is explained at once, next to the
// Name header. Each mark also explains itself on tap or focus; this is for
// learning them all, and for touch users who'd otherwise tap each in turn.
export function BadgeKey() {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);

  return (
    <>
      <IconButton
        size="small"
        aria-label="What the marks mean"
        aria-haspopup="dialog"
        aria-expanded={Boolean(anchor)}
        onClick={(event) => {
          event.stopPropagation();
          setAnchor(event.currentTarget);
        }}
        sx={{ ml: 0.25, width: 28, height: 28, color: "text.secondary" }}
      >
        <HelpOutlineIcon sx={{ fontSize: "1.1rem" }} />
      </IconButton>
      <Popover
        open={Boolean(anchor)}
        anchorEl={anchor}
        onClose={() => setAnchor(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
        slotProps={{
          paper: {
            role: "dialog",
            "aria-label": "What the marks mean",
            sx: {
              p: 2,
              width: 340,
              maxWidth: "calc(100vw - 32px)",
              textAlign: "left",
            },
          },
        }}
      >
        <Section title="Next to a name">
          <Row
            mark={
              <>
                <MoverBadge
                  plain
                  move={{
                    ...SAMPLE_MOVE,
                    change: 3,
                    rank_before: 9,
                    rank_after: 6,
                  }}
                />
                <MoverBadge
                  plain
                  move={{
                    ...SAMPLE_MOVE,
                    change: -4,
                    rank_before: 4,
                    rank_after: 8,
                  }}
                />
              </>
            }
          >
            Moved up or down 3+ places since last week
          </Row>
          <Row mark={<StreakBadge plain weeks={2} />}>
            Hot streak: straight weeks going 4 of 5 or better (shown on the
            current week)
          </Row>
          <Row mark={<PerfectWeekBadge plain perfect />}>
            Went 5-0 this week
          </Row>
          <Row mark={<DefendingChampionBadge plain season={2025} />}>
            Defending champion
          </Row>
        </Section>
        <Section title="Week column">
          <Row mark={<FormTile form="hot" />}>
            Hot week: {pct(WEEKLY_FORM_HOT_PCT)}+ of decided picks won or
            covering
          </Row>
          <Row mark={<FormTile form="cold" />}>
            Cold week: {pct(WEEKLY_FORM_COLD_PCT)} or less
          </Row>
          <Row mark={<FormTile form="neutral" />}>
            In between, or too early to call
          </Row>
        </Section>
        <Section title="Picks">
          <Row mark={<PickTile pick={sample(true, GameStatus.Final)} />}>
            Won
          </Row>
          <Row mark={<PickTile pick={sample(false, GameStatus.Final)} />}>
            Lost
          </Row>
          <Row
            mark={
              <PickTile pick={sample(null, GameStatus.Inprogress, "CORRECT")} />
            }
          >
            Live, covering right now (dashed edge)
          </Row>
          <Row
            mark={
              <PickTile
                pick={sample(null, GameStatus.Inprogress, "INCORRECT")}
              />
            }
          >
            Live, not covering right now
          </Row>
          <Row mark={<PickTile pick={tbd} />}>
            Picked, hidden until the first kickoff
          </Row>
        </Section>
        <Section title="Scores and places">
          <Row
            mark={
              <Typography variant="body2" component="span">
                9
                <Box
                  component="span"
                  sx={{
                    ml: 0.5,
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    color: "success.main",
                  }}
                >
                  +2
                </Box>
              </Typography>
            }
          >
            9 settled points, plus 2 picks covering right now
          </Row>
          <Row
            mark={
              <Box
                sx={{
                  width: "100%",
                  borderTop: `1.5px dashed ${MONEY_GOLD}`,
                }}
              />
            }
          >
            Paid line: everyone above it is in the money (shown when sorted by
            place)
          </Row>
        </Section>
      </Popover>
    </>
  );
}
