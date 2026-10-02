import Box from "@mui/material/Box";
import Skeleton from "@mui/material/Skeleton";
import { StandingsSkeleton } from "./UsersTable/StandingsStatus";

// A loading placeholder shaped like the tab it stands in for, so the page
// doesn't briefly turn into a table on the Scoreboard: standings rows,
// game cards, or the Records tiles.
export type TabSkeletonShape = "rows" | "cards" | "tiles";

export default function TabSkeleton({
  shape,
  label,
  animate = true,
}: {
  shape: TabSkeletonShape;
  label: string;
  // Off once a load has failed, so the placeholders don't read as "still
  // loading" next to the error.
  animate?: boolean;
}) {
  const animation = animate ? "pulse" : false;
  if (shape === "rows") {
    return <StandingsSkeleton label={label} animate={animate} />;
  }

  if (shape === "tiles") {
    return (
      <Box
        role="status"
        aria-busy={animate}
        aria-label={label}
        sx={{ opacity: animate ? 1 : 0.45 }}
      >
        <Skeleton
          animation={animation}
          variant="text"
          width={140}
          sx={{ fontSize: "1.25rem", mb: 1 }}
        />
        <Box sx={{ display: "flex", gap: 1.25, overflow: "hidden" }}>
          {Array.from({ length: 6 }, (_, i) => (
            <Skeleton
              key={i}
              animation={animation}
              variant="rounded"
              height={150}
              sx={{ flex: "0 0 156px", borderRadius: 2 }}
            />
          ))}
        </Box>
      </Box>
    );
  }

  return (
    <Box
      role="status"
      aria-busy={animate}
      aria-label={label}
      sx={{
        opacity: animate ? 1 : 0.45,
        display: "grid",
        gridTemplateColumns: {
          xs: "1fr",
          md: "repeat(2, 1fr)",
          xl: "repeat(3, 1fr)",
        },
        gap: 2,
      }}
    >
      {Array.from({ length: 6 }, (_, i) => (
        <Skeleton
          key={i}
          animation={animation}
          variant="rounded"
          height={176}
          sx={{ borderRadius: 2 }}
        />
      ))}
    </Box>
  );
}
