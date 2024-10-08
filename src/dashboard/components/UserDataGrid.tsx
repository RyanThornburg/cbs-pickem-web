import { DataGrid, GridColDef, GridRowsProp } from '@mui/x-data-grid';
import userData from '../data/cbs_week5_users.json'
import * as React from 'react';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid2';

enum PickStatus {
    Correct,
    Incorrect,
    Pending,
    Missing
}

interface User {
    id: string;
    name: string;
    cbs_stats: any;
    picks: any
}
interface TeamData {
    id: string;
    cbs_team_id: number;
    short_name: string;
}

interface PickData {
    id: string;
    cbs_item_id: number;
    cbs_slot_id: number;
    display_status: string;
    pick_status: string;
    team: TeamData;
    visible: boolean
}

interface Pick {
    team: string
    status: PickStatus
    visible: boolean
}

function pickBox(pick: Pick): Box {

}
function returnPick(userPick: PickData): Pick {
    const pickStatus: PickStatus = userPick.visible === false ? PickStatus.Pending : userPick.pick_status == 'CORRECT' ? PickStatus.Correct : PickStatus.Incorrect
    return {
        team: userPick.visible ? userPick.team.short_name : '',
        status: pickStatus,
        visible: userPick.visible
    }
}

function userRow(user: User) {
    return {
        id: user.id,
        name: user.name,
        rank: user.cbs_stats.rank,
        period_score: user.cbs_stats.period_score,
        score: user.cbs_stats.score,
        trending_score: user.cbs_stats.trending_score,
        picks: user.picks
    }
}

function renderPicks(picks: PickData[]) {
    return (<Grid container spacing={3}>)
}
const rows: GridRowsProp = userData.map(userRow)
const columns: GridColDef[] = [
    {field: 'name', headerName: 'Name', flex:1 },
    {field: 'trending_score', headerName: 'Score', minWidth: 75, flex: 0.5},
    {field: 'period_score', headerName: 'Week', minWidth: 75, flex: 0.5 },
    {field: 'picks', headerName: 'Picks',flex:2, renderCell: renderPicks() }
]

export default function UserDataGrid() {
    return (
      <DataGrid
        rows={rows}
        columns={columns}
        density="compact"
      />
    );
  }