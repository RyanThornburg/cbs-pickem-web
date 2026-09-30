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
} from "@mui/material";
import { ReactNode } from "react";
import { formatAgo, formatEt } from "./adminUtils";

export type Column<T> = {
  header: string;
  render: (row: T) => ReactNode;
  align?: "right";
  // Long freeform text (event messages) would otherwise get squeezed to a
  // few characters per line on a phone -- scroll the table sideways instead.
  minWidth?: number;
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
}: Props<T>) {
  return (
    <Card variant="outlined" sx={{ height: "100%" }}>
      <CardContent>
        <Stack
          direction="row"
          spacing={2}
          sx={{
            justifyContent: "space-between",
            alignItems: "baseline",
          }}
        >
          <Typography
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
        ) : (
          <Box sx={{ overflowX: "auto", mt: 1 }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  {columns.map((column) => (
                    <TableCell
                      key={column.header}
                      align={column.align}
                      sx={{ minWidth: column.minWidth }}
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
                        sx={{ verticalAlign: "top" }}
                      >
                        {column.render(row)}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}
