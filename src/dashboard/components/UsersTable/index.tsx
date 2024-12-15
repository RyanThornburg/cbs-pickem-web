import { Grid2 as Grid } from "@mui/material";
import UserDataGrid from "./UserDataGrid";
import UserDataMobile from "./UserDataMobile";
import { UserGridProps } from "./types";

export default function UsersTable(props: UserGridProps) {
  return (
    <>
      <Grid
        id="gridUser"
        width={"fit-content"}
        display="flex"
        justifyContent="center"
        alignItems="center"
        sx={{ display: { xs: "none", sm: "block" } }}
        size={{ xs: 12, sm: 12, xl: 7 }}
      >
        <UserDataGrid {...props} />
      </Grid>
      <Grid sx={{ display: { xs: "block", sm: "none" } }} size={{ xs: 12 }}>
        <UserDataMobile {...props} />
      </Grid>
    </>
  );
}
