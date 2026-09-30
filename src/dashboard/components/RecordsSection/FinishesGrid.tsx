import {
  Box,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
  useTheme,
} from "@mui/material";
import { HistoricalRecords } from "../../types";
import { ordinal } from "../../helper";
import {
  CareerRow,
  closedSeasons,
  FinishTier,
  finishTier,
} from "./recordsUtils";
import {
  FINISH_TIER_COLORS,
  FINISH_TIER_LABELS,
  INCOMPLETE_HATCH,
  youRowSx,
} from "./recordsTheme";

type Props = {
  data: HistoricalRecords;
  // Already in the All-time table's sort order.
  rows: CareerRow[];
  userId: string;
};

const TIERS: FinishTier[] = [1, 2, 3, 4, 5];

const Swatch = ({
  background,
  border,
}: {
  background: string;
  border?: boolean;
}) => (
  <Box
    component="i"
    sx={{
      width: 14,
      height: 14,
      borderRadius: 0.5,
      display: "inline-block",
      background,
      ...(border && { border: 1, borderColor: "divider" }),
    }}
  />
);

const stickySx = {
  position: "sticky",
  left: 0,
  zIndex: 1,
  bgcolor: "background.paper",
} as const;

export default function FinishesGrid({ data, rows, userId }: Props) {
  const theme = useTheme();
  const years = closedSeasons(data);
  const incomplete = (year: number) => data.years[String(year)]?.incomplete;

  return (
    <Stack spacing={1.5}>
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
          <Stack key={tier} direction="row" spacing={0.6} alignItems="center">
            <Swatch background={FINISH_TIER_COLORS[tier].bg} />
            <Typography variant="caption" color="text.secondary">
              {FINISH_TIER_LABELS[tier]}
            </Typography>
          </Stack>
        ))}
        <Stack direction="row" spacing={0.6} alignItems="center">
          <Swatch background={INCOMPLETE_HATCH} border />
          <Typography variant="caption" color="text.secondary">
            Incomplete year
          </Typography>
        </Stack>
      </Stack>

      <TableContainer>
        <Table
          size="small"
          sx={{
            "& td, & th": {
              px: 0.4,
              py: 0.4,
              borderBottom: 0,
              textAlign: "center",
            },
            "& td:first-of-type, & th:first-of-type": {
              textAlign: "left",
              pr: 1.25,
              pl: 1,
            },
          }}
        >
          <TableHead>
            <TableRow
              sx={{ "& th": { fontSize: "0.7rem", fontWeight: "bold" } }}
            >
              <TableCell sx={{ ...stickySx, zIndex: 3 }}>Player</TableCell>
              {years.map((year) => (
                <TableCell
                  key={year}
                  sx={
                    incomplete(year)
                      ? { backgroundImage: INCOMPLETE_HATCH }
                      : undefined
                  }
                >
                  '{String(year).slice(2)}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((row) => {
              const isYou = String(row.id) === userId;
              return (
                <TableRow key={row.id}>
                  <TableCell
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
                      sx={{ fontWeight: 500, whiteSpace: "nowrap" }}
                    >
                      {row.name}
                    </Typography>
                  </TableCell>
                  {years.map((year) => {
                    const finish = row.byYear.get(year);
                    const colors =
                      finish && FINISH_TIER_COLORS[finishTier(finish.rank)];
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
                        {finish && colors ? (
                          <Tooltip
                            title={`${year}: ${ordinal(finish.rank)}, ${finish.score} pts`}
                          >
                            <Box
                              sx={{
                                width: 34,
                                height: 24,
                                mx: "auto",
                                borderRadius: 0.5,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: "0.72rem",
                                fontWeight: 600,
                                fontVariantNumeric: "tabular-nums",
                                bgcolor: colors.bg,
                                color: colors.fg,
                              }}
                            >
                              {finish.rank}
                            </Box>
                          </Tooltip>
                        ) : (
                          <Typography
                            variant="caption"
                            sx={{ color: "divider" }}
                          >
                            ·
                          </Typography>
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
      <Typography variant="caption" color="text.secondary">
        Players are in the same order as the All-time tab's current sort.
      </Typography>
    </Stack>
  );
}
