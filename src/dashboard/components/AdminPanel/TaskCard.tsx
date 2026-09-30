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
  // False when last_success_at is just a copy of last_at, so success can't be
  // told apart from an attempt -- shown as "ran", never as failing.
  tracksFailures?: boolean;
};

export type Props = {
  name: string;
  health: TaskHealth;
  runs: TaskRun[];
  now: number;
  // Neutral note chip under the name, e.g. "Pauses during games".
  note?: string;
  // Freeform body for a task that doesn't fit the attempt/success shape.
  detail?: ReactNode;
};

export default function TaskCard({
  name,
  health,
  runs,
  now,
  note,
  detail,
}: Props) {
  return (
    <Card variant="outlined" sx={{ height: "100%" }}>
      <CardContent sx={{ "&:last-child": { pb: 2 } }}>
        <Stack
          direction="row"
          spacing={1}
          sx={{
            justifyContent: "space-between",
            alignItems: "center",
            mb: 1,
          }}
        >
          <Typography variant="subtitle2">{name}</Typography>
          <Chip
            size="small"
            label={HEALTH_LABEL[health]}
            color={HEALTH_COLOR[health]}
            variant={health === "idle" ? "outlined" : "filled"}
          />
        </Stack>
        {note && (
          <Chip
            size="small"
            variant="outlined"
            color="info"
            label={note}
            sx={{ mb: 1 }}
          />
        )}
        <Stack spacing={0.5}>
          {runs.map((run) => {
            const tracksFailures = run.tracksFailures ?? true;
            return (
              <div key={run.label ?? "run"}>
                <Typography variant="body2">
                  {run.label && (
                    <Typography
                      component="span"
                      variant="body2"
                      sx={{
                        color: "text.secondary",
                      }}
                    >
                      {run.label}:{" "}
                    </Typography>
                  )}
                  {tracksFailures ? "ok" : "ran"}{" "}
                  {formatAgo(run.lastSuccessAt, now)}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{
                    color: "text.secondary",
                  }}
                >
                  {formatEt(run.lastSuccessAt)}
                </Typography>
                {/* Attempted more recently than it succeeded -- the matching
                  system_events row (same source) should say why. */}
                {tracksFailures && isFailing(run.lastAt, run.lastSuccessAt) && (
                  <Typography
                    variant="caption"
                    sx={{
                      color: "error.main",
                      display: "block",
                    }}
                  >
                    last attempt {formatAgo(run.lastAt, now)}
                  </Typography>
                )}
              </div>
            );
          })}
          {detail}
        </Stack>
      </CardContent>
    </Card>
  );
}
