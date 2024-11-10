import Grid from "@mui/material/Grid2";
import { User } from "../../types";
import { stringAvatar } from "../helper";
import { Avatar, Box, Card, CardContent, Stack } from "@mui/material";
export interface Props {
  user: User | undefined;
}

export default function UserSelected() {
  const user: User = {
    id: "test",
    name: "Test user",
    score: 25,
    second_half: 12,
    period_score: 1,
    trending_score: 0,
    picks: [],
    rank: 1,
  };

  if (!user) {
    return <Grid size={{ xs: 12, sm: 12, lg: 12 }}></Grid>;
  }
  return (
    <Card variant="outlined" sx={{ height: "100%", flexGrow: 1 }}>
      <CardContent>
        <Grid container>
          <Grid size={{ xs: 12, sm: 12, md: 6 }}>
            <Stack sx={{ alignItems: "center" }} direction="row" spacing={2}>
              <Avatar
                {...stringAvatar(user?.name ?? "", {
                  width: 24,
                  height: 24,
                  fontSize: 12,
                })}
              />
              <Box>{user?.name ?? ""}</Box>
              <Box>Rank: {user?.rank ?? 0}</Box>
              <Box>
                Score: {(user?.score ?? 0) + (user?.trending_score ?? 0)}
              </Box>
            </Stack>
          </Grid>
          <Grid size={{ xs: 12, sm: 12, md: 6 }}></Grid>
        </Grid>
      </CardContent>
    </Card>
  );
}
