import Stack from "@mui/material/Stack";
import { DataGrid, GridColDef, GridRenderCellParams } from "@mui/x-data-grid";
import { Pick } from "../../types";

//import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
//import BlindSharpIcon from "@mui/icons-material/BlindSharp";
//import CheckIcon from "@mui/icons-material/Check";
//import StarBorderOutlinedIcon from "@mui/icons-material/StarBorderOutlined";
//import WhatshotIcon from "@mui/icons-material/Whatshot";
import { UserGamePicksStack } from "./UserPickStack";
import { UserGridProps } from "./types";
import UserAvatar from "../UserAvatar";

const defaultHeight = "1044px";

function RenderPicks(props: GridRenderCellParams<any>) {
  const picks: Array<Pick> = props.value;
  return UserGamePicksStack(picks);
}
function UserCell(props: GridRenderCellParams<any>) {
  return (
    <Stack
      sx={{
        alignItems: "center",
        justifyContent: "flex-start",
      }}
      direction="row"
      spacing={2}
    >
      <UserAvatar
        userName={props.value}
        userId={props.row.id}
        fontSize={"0.875rem"}
        size={24}
      />
    </Stack>
  );
}

const UserDataGrid = ({
  userList,
  userId,
  week,
  showSecondHalf,
}: UserGridProps) => {
  const columns: GridColDef[] = [
    {
      field: "name",
      headerName: "Name",
      description: "Name",
      flex: 4,
      renderCell: UserCell,
    },
    {
      field: "score",
      align: "center",
      headerAlign: "center",
      headerName: "Score",
      flex: 2,
      valueGetter: (value, row) => {
        return row.score + row.trending_score;
      },
    },
    {
      field: "second_half",
      align: "center",
      headerAlign: "center",
      headerName: "2nd Half",
      flex: 2,
      valueGetter: (value, row) => {
        return row.second_half + row.trending_score;
      },
    },
    {
      field: "period_score",
      align: "center",
      headerAlign: "center",
      headerName: "Week",
      flex: 1.5,
      valueGetter: (value, row) => {
        return row.period_score + row.trending_score;
      },
    },
    {
      field: "picks",
      flex: 10,
      align: "left",
      headerName: "Picks",
      renderCell: RenderPicks,
      display: "flex",
    },
  ];

  return (
    <DataGrid
      density="compact"
      loading={userList.length === 0}
      getRowId={(row) => row.id}
      rows={userList}
      columns={columns}
      disableColumnSelector
      columnVisibilityModel={{
        second_half: showSecondHalf,
      }}
      hideFooter={true}
      slotProps={{
        loadingOverlay: {
          variant: "linear-progress",
          noRowsVariant: "skeleton",
        },
      }}
      initialState={{
        sorting: {
          sortModel: [{ field: "score", sort: "desc" }],
        },
      }}
      getRowClassName={(params) => {
        return params.row.id === userId ? "highlight" : "";
      }}
      sx={{
        "--DataGrid-overlayHeight": { defaultHeight },
        ".highlight": {
          bgcolor: (theme) =>
            theme.palette.mode === "dark" ? "#78909c" : "#f0f4c3",
        },
      }}
    />
  );
};

export default UserDataGrid;
