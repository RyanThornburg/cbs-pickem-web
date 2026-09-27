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
  rows: T[];
  columns: Column<T>[];
  rowKey: (row: T) => string;
  emptyText: string;
};

export function LastSeenCell({
  iso,
  now,
  activeWithinMs,
}: {
  iso: string;
  now: number;
  activeWithinMs?: number;
}) {
  const active =
    activeWithinMs !== undefined &&
    now - new Date(iso).getTime() <= activeWithinMs;
  return (
    <Stack spacing={0.25} alignItems="flex-start">
      <Typography variant="body2" noWrap>
        {formatAgo(iso, now)}
      </Typography>
      <Typography variant="caption" color="text.secondary" noWrap>
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
          justifyContent="space-between"
          alignItems="baseline"
          spacing={2}
        >
          <Typography variant="subtitle1" fontWeight={600}>
            {title}
          </Typography>
          <Typography variant="body2" color="text.secondary" noWrap>
            {distinctCount} distinct · {totalOccurrences} total
          </Typography>
        </Stack>
        <Typography variant="caption" color="text.secondary">
          {description}
        </Typography>

        {rows.length === 0 ? (
          <Typography color="text.secondary" sx={{ mt: 2 }}>
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
