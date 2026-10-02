import {
  Box,
  Card,
  CardContent,
  Chip,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
  useMediaQuery,
} from "@mui/material";
import { Theme } from "@mui/material/styles";
import { ReactNode } from "react";
import { formatAgo, formatEt } from "./adminUtils";

export type Column<T> = {
  header: string;
  render: (row: T) => ReactNode;
  align?: "right";
  // Long freeform text (an event message). Takes the leftover width in the
  // table, and gets a full-width line of its own on phones.
  wide?: boolean;
};

export type Props<T> = {
  title: string;
  description: string;
  distinctCount: number;
  totalOccurrences: number;
  // Shown as a red "N active" chip in the header when above 0.
  activeCount?: number;
  rows: T[];
  columns: Column<T>[];
  rowKey: (row: T) => string;
  emptyText: string;
  // Anchor id, so the banner and task cards can link here.
  id?: string;
};

export function LastSeenCell({
  iso,
  now,
  active = false,
}: {
  iso: string;
  now: number;
  active?: boolean;
}) {
  return (
    <Stack
      spacing={0.25}
      sx={{
        alignItems: "flex-start",
      }}
    >
      <Typography variant="body2" noWrap>
        {formatAgo(iso, now)}
      </Typography>
      <Typography
        variant="caption"
        noWrap
        sx={{
          color: "text.secondary",
        }}
      >
        {formatEt(iso)}
      </Typography>
      {active && <Chip size="small" color="error" label="Active" />}
    </Stack>
  );
}

// Shrink-to-fit, so the wide column gets the rest of the row and nothing
// narrow (a count, a timestamp) wraps or gets clipped.
const NARROW_CELL_SX = { width: "1%", whiteSpace: "nowrap" } as const;

// Phone layout: the short columns side by side with their headers as small
// labels, then the wide column on its own line underneath.
function CompactRows<T>({
  rows,
  columns,
  rowKey,
}: Pick<Props<T>, "rows" | "columns" | "rowKey">) {
  const short = columns.filter((column) => !column.wide);
  const wide = columns.filter((column) => column.wide);
  return (
    <Stack sx={{ mt: 1 }}>
      {rows.map((row) => (
        <Box
          key={rowKey(row)}
          sx={{ py: 1.5, borderTop: 1, borderColor: "divider" }}
        >
          {/* One line: the short columns shrink (and wrap inside) before
              anything drops to a second row. */}
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: short
                .map((column) =>
                  column.align === "right" ? "auto" : "minmax(0, auto)"
                )
                .join(" "),
              justifyContent: "space-between",
              columnGap: 1.5,
            }}
          >
            {short.map((column) => (
              <Box
                key={column.header}
                sx={{ textAlign: column.align, overflowWrap: "anywhere" }}
              >
                <Typography
                  variant="caption"
                  sx={{ display: "block", color: "text.secondary" }}
                >
                  {column.header}
                </Typography>
                {column.render(row)}
              </Box>
            ))}
          </Box>
          {wide.map((column) => (
            <Box key={column.header} sx={{ mt: 1 }}>
              {column.render(row)}
            </Box>
          ))}
        </Box>
      ))}
    </Stack>
  );
}

export default function EventsCard<T>({
  title,
  description,
  distinctCount,
  totalOccurrences,
  activeCount,
  rows,
  columns,
  rowKey,
  emptyText,
  id,
}: Props<T>) {
  // Four columns don't fit a phone: the message got squeezed and pushed
  // Last seen and Count off screen.
  const compact = useMediaQuery((theme: Theme) => theme.breakpoints.down("sm"));
  return (
    <Card
      variant="outlined"
      id={id}
      sx={{ height: "100%", scrollMarginTop: 96 }}
    >
      <CardContent>
        <Stack
          direction="row"
          useFlexGap
          sx={{
            justifyContent: "space-between",
            alignItems: "baseline",
            // On a phone the counts drop under the title instead of
            // squeezing it onto two lines.
            flexWrap: "wrap",
            columnGap: 2,
          }}
        >
          <Typography
            component="h3"
            variant="subtitle1"
            sx={{
              fontWeight: 600,
            }}
          >
            {title}
          </Typography>
          <Stack
            direction="row"
            spacing={1}
            sx={{ alignItems: "center", flexShrink: 0 }}
          >
            {activeCount !== undefined && activeCount > 0 && (
              <Chip
                size="small"
                color="error"
                label={`${activeCount} active`}
              />
            )}
            <Typography
              variant="body2"
              noWrap
              sx={{
                color: "text.secondary",
              }}
            >
              {distinctCount} distinct · {totalOccurrences} total
            </Typography>
          </Stack>
        </Stack>
        <Typography
          variant="caption"
          sx={{
            color: "text.secondary",
          }}
        >
          {description}
        </Typography>

        {rows.length === 0 ? (
          <Typography
            sx={{
              color: "text.secondary",
              mt: 2,
            }}
          >
            {emptyText}
          </Typography>
        ) : compact ? (
          <CompactRows rows={rows} columns={columns} rowKey={rowKey} />
        ) : (
          <Table size="small" sx={{ mt: 1 }}>
            <TableHead>
              <TableRow>
                {columns.map((column) => (
                  <TableCell
                    key={column.header}
                    align={column.align}
                    sx={column.wide ? undefined : NARROW_CELL_SX}
                  >
                    {column.header}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={rowKey(row)}>
                  {columns.map((column) => (
                    <TableCell
                      key={column.header}
                      align={column.align}
                      sx={{
                        verticalAlign: "top",
                        ...(column.wide ? undefined : NARROW_CELL_SX),
                      }}
                    >
                      {column.render(row)}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
