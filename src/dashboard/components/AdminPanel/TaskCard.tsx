import { Card, CardContent, Chip, Stack, Typography } from "@mui/material";
import { ReactNode } from "react";
import {
  formatAgo,
  formatEt,
  HEALTH_COLOR,
  HEALTH_LABEL,
  isFailing,
  TaskHealth,
} from "./adminUtils";

export type TaskRun = {
  label?: string;
  lastAt: string | null;
  lastSuccessAt: string | null;
};

export type Props = {
  name: string;
  health: TaskHealth;
  runs: TaskRun[];
  now: number;
  // Freeform body for a task that doesn't fit the attempt/success shape.
  detail?: ReactNode;
};

export default function TaskCard({ name, health, runs, now, detail }: Props) {
  return (
    <Card variant="outlined" sx={{ height: "100%" }}>
      <CardContent sx={{ "&:last-child": { pb: 2 } }}>
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          spacing={1}
          sx={{ mb: 1 }}
        >
          <Typography variant="subtitle2">{name}</Typography>
          <Chip
            size="small"
            label={HEALTH_LABEL[health]}
            color={HEALTH_COLOR[health]}
            variant={health === "idle" ? "outlined" : "filled"}
          />
        </Stack>
        <Stack spacing={0.5}>
          {runs.map((run) => (
            <div key={run.label ?? "run"}>
              <Typography variant="body2">
                {run.label && (
                  <Typography component="span" variant="body2" color="text.secondary">
                    {run.label}:{" "}
                  </Typography>
                )}
                ok {formatAgo(run.lastSuccessAt, now)}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {formatEt(run.lastSuccessAt)}
              </Typography>
              {/* Attempted more recently than it succeeded -- the matching
                  system_events row (same source) should say why. */}
              {isFailing(run.lastAt, run.lastSuccessAt) && (
                <Typography variant="caption" color="error.main" display="block">
                  last attempt {formatAgo(run.lastAt, now)}
                </Typography>
              )}
            </div>
          ))}
          {detail}
        </Stack>
      </CardContent>
    </Card>
  );
}
