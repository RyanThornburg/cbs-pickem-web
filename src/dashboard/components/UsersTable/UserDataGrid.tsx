import { DataGrid, GridColDef, GridRenderCellParams } from "@mui/x-data-grid";
import { UserPick } from "../../types";
import { UserGamePicksStack } from "./UserPickStack";
import { UserGridProps } from "./types";
import UserAvatar from "../UserAvatar";
import { PlaceCell } from "./PlaceCell";

const defaultHeight = "1044px";

function RenderPicks(props: GridRenderCellParams<any>) {
  const picks: Array<UserPick> = props.value;
  return UserGamePicksStack(picks);
}
function UserCell(props: GridRenderCellParams<any>) {
  return (
    <UserAvatar
      userName={props.value}
      userId={props.row.id}
      fontSize={"0.8125rem"}
      size={26}
    />
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
      field: "place",
      align: "center",
      headerAlign: "center",
      headerName: "#",
      flex: 1.2,
      renderCell: (params) => <PlaceCell place={params.row.place} />,
      display: "flex",
    },
    {
      field: "second_half_place",
      align: "center",
      headerAlign: "center",
      headerName: "2nd Half Place",
      flex: 1.5,
      renderCell: (params) => (
        <PlaceCell place={params.row.second_half_place} />
      ),
      display: "flex",
    },
    {
      field: "name",
      headerName: "Name",
      description: "Name",
      flex: 4,
      renderCell: UserCell,
      display: "flex",
    },
    {
      field: "cumulative_score",
      align: "center",
      headerAlign: "center",
      headerName: "Score",
      flex: 2,
      valueGetter: (value, row) => {
        return row.cumulative_score + row.trending_score;
      },
    },
    {
      field: "second_half_score",
      align: "center",
      headerAlign: "center",
      headerName: "2nd Half",
      flex: 2,
      valueGetter: (value, row) => {
        return (row.second_half_score ?? 0) + row.trending_score;
      },
    },
    {
      field: "weekly_score",
      align: "center",
      headerAlign: "center",
      headerName: "Week",
      flex: 1.5,
      valueGetter: (value, row) => {
        return row.weekly_score + row.trending_score;
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
        second_half_score: showSecondHalf,
        second_half_place: showSecondHalf,
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
          sortModel: [{ field: "place", sort: "asc" }],
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
