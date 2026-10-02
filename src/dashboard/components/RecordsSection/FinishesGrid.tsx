import { useLayoutEffect, useMemo, useRef, useState } from "react";
import {
  Box,
  ButtonBase,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { HistoricalRecords } from "../../types";
import { ordinal } from "../../helper";
import {
  byAllTimeRank,
  CareerRow,
  closedSeasons,
  FinishTier,
  finishTier,
} from "./recordsUtils";
import {
  FINISH_TIER_LABELS,
  FINISH_TIER_STYLE,
  INCOMPLETE_HATCH,
  youRowSx,
} from "./recordsTheme";

type Props = {
  data: HistoricalRecords;
  rows: CareerRow[];
  userId: string;
};

const TIERS: FinishTier[] = [1, 2, 3, 4, 5, 6];
const SAMPLE_RANK: Record<FinishTier, number> = {
  1: 1,
  2: 2,
  3: 3,
  4: 4,
  5: 7,
  6: 14,
};

// The legend draws each tier the way the grid does.
const Sample = ({ tier }: { tier: FinishTier }) => {
  const s = FINISH_TIER_STYLE[tier];
  return (
    <Box
      component="span"
      aria-hidden
      sx={{
        display: "inline-grid",
        placeItems: "center",
        minWidth: 22,
        height: 18,
        px: 0.25,
        borderRadius: "4px",
        fontSize: "0.75rem",
        fontWeight: s.weight,
        bgcolor: s.bg,
        color: s.fg,
        boxShadow: s.ring ? `inset 0 0 0 1px ${s.ring}` : undefined,
      }}
    >
      {SAMPLE_RANK[tier]}
    </Box>
  );
};

const stickySx = {
  position: "sticky",
  left: 0,
  zIndex: 1,
  bgcolor: "background.paper",
} as const;

// Every player's finish in every season, players in all-time order (fixed,
// whatever the All-time table is sorted by). Opens scrolled to the newest
// seasons, so phones see this year's players first. Tapping a finish shows
// its score in the line above the grid.
export default function FinishesGrid({ data, rows, userId }: Props) {
  const theme = useTheme();
  const years = closedSeasons(data);
  const incomplete = (year: number) => data.years[String(year)]?.incomplete;
  const ordered = useMemo(() => [...rows].sort(byAllTimeRank), [rows]);
  const [detail, setDetail] = useState<string | null>(null);
  const canHover = useMediaQuery("(hover: hover)");

  const scroller = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const el = scroller.current;
    if (el) el.scrollLeft = el.scrollWidth;
  }, []);

  return (
    <Stack spacing={1.25}>
      <Stack
        direction="row"
        sx={{
          flexWrap: "wrap",
          columnGap: 1.75,
          rowGap: 0.75,
          alignItems: "center",
        }}
      >
        {TIERS.map((tier) => (
          <Stack
            key={tier}
            direction="row"
            spacing={0.6}
            sx={{ alignItems: "center" }}
          >
            <Sample tier={tier} />
            <Typography variant="caption" sx={{ color: "text.secondary" }}>
              {FINISH_TIER_LABELS[tier]}
            </Typography>
          </Stack>
        ))}
        <Stack direction="row" spacing={0.6} sx={{ alignItems: "center" }}>
          <Box
            component="span"
            aria-hidden
            sx={{
              width: 18,
              height: 18,
              borderRadius: "4px",
              border: 1,
              borderColor: "divider",
              backgroundImage: INCOMPLETE_HATCH,
            }}
          />
          <Typography variant="caption" sx={{ color: "text.secondary" }}>
            Missing some players
          </Typography>
        </Stack>
      </Stack>

      <Typography
        variant="body2"
        aria-live="polite"
        sx={{ color: "text.secondary", minHeight: "1.43em" }}
      >
        {detail ??
          `Players in all-time order. ${canHover ? "Hover over" : "Tap"} a finish for its score.`}
      </Typography>

      <TableContainer
        ref={scroller}
        tabIndex={0}
        role="region"
        aria-label="Finishes by year, scrolls sideways"
        sx={{
          "&:focus-visible": {
            outline: `3px solid ${theme.palette.primary.main}`,
            outlineOffset: 2,
          },
        }}
      >
        <Table
          size="small"
          aria-label="Each player's finish by season"
          sx={{
            width: "auto",
            "& td, & th": {
              px: 0.4,
              py: 0.4,
              borderBottom: 0,
              textAlign: "center",
            },
            "& tr > :first-of-type": {
              textAlign: "left",
              pr: 1.25,
              pl: 1,
            },
          }}
        >
          <TableHead>
            <TableRow
              sx={{
                "& th": {
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  color: "text.secondary",
                },
              }}
            >
              <TableCell sx={{ ...stickySx, zIndex: 3 }}>Player</TableCell>
              {years.map((year) => (
                <TableCell
                  key={year}
                  aria-label={String(year)}
                  sx={{
                    minWidth: 38,
                    ...(incomplete(year) && {
                      backgroundImage: INCOMPLETE_HATCH,
                    }),
                  }}
                >
                  ’{String(year).slice(2)}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {ordered.map((row) => {
              const isYou = String(row.id) === userId;
              return (
                <TableRow key={row.id}>
                  <TableCell
                    component="th"
                    scope="row"
                    sx={{
                      ...stickySx,
                      ...(isYou && {
                        ...youRowSx,
                        boxShadow: `inset 3px 0 0 ${theme.palette.primary.main}`,
                      }),
                    }}
                  >
                    <Typography
                      variant="body2"
                      component="span"
                      sx={{ fontWeight: 500, whiteSpace: "nowrap" }}
                    >
                      {row.name}
                      {!row.active && (
                        <Box
                          component="span"
                          sx={{
                            color: "text.secondary",
                            fontWeight: 400,
                            fontSize: "0.75rem",
                            ml: 0.5,
                          }}
                        >
                          former
                        </Box>
                      )}
                    </Typography>
                  </TableCell>
                  {years.map((year) => {
                    const finish = row.byYear.get(year);
                    const s =
                      finish && FINISH_TIER_STYLE[finishTier(finish.rank)];
                    const text =
                      finish &&
                      `${row.name} · ${year}: ${ordinal(finish.rank)}, ${finish.score} pts`;
                    return (
                      <TableCell
                        key={year}
                        sx={{
                          ...(isYou && youRowSx),
                          ...(incomplete(year) && {
                            backgroundImage: INCOMPLETE_HATCH,
                          }),
                        }}
                      >
                        {finish && s ? (
                          <Tooltip
                            title={`${ordinal(finish.rank)}, ${finish.score} pts`}
                          >
                            {/* Out of the tab order (hundreds of cells); the
                                grid scrolls by keyboard and screen readers
                                read each cell's label. */}
                            <ButtonBase
                              tabIndex={-1}
                              aria-label={`${year}: ${ordinal(finish.rank)}, ${finish.score} points`}
                              onClick={() => setDetail(text ?? null)}
                              sx={{
                                minWidth: 30,
                                height: 24,
                                borderRadius: "4px",
                                fontSize: "0.75rem",
                                fontWeight: s.weight,
                                fontVariantNumeric: "tabular-nums",
                                bgcolor: s.bg,
                                color: s.fg,
                                boxShadow: s.ring
                                  ? `inset 0 0 0 1px ${s.ring}`
                                  : undefined,
                                "&.Mui-focusVisible": {
                                  outline: `3px solid ${theme.palette.primary.main}`,
                                  outlineOffset: 1,
                                },
                              }}
                            >
                              {finish.rank}
                            </ButtonBase>
                          </Tooltip>
                        ) : (
                          <Box
                            component="span"
                            aria-hidden
                            sx={{ color: "text.disabled" }}
                          >
                            ·
                          </Box>
                        )}
                      </TableCell>
                    );
                  })}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </Stack>
  );
}
