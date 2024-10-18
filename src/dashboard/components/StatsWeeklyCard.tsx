import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { onValue, ref } from "firebase/database";
import { useEffect, useState } from 'react';
import { db } from "../../components/firebase";
import { WeekCover } from '../../types';
import SmallHeader from './SmallHeader';

export type Props = {
    week: number;
};


const defaultResult:WeekCover = {correct:0, total: 0, result: 0, week: '0'}
const weekResult = (weekResult: number) => {return weekResult ? `${Math.round(weekResult)}%` : ''}
const weekDiff = (currentWeek: number, lastWeek: number) => {
    const diff = Math.round(currentWeek - lastWeek);
    if (currentWeek === 0) {return ''}
    if (diff > 0) {return <Chip color="success" size="small" label={`${diff}%`} icon={<ArrowUpwardIcon sx={{ fontSize: 40 }} />} />}
    if (diff < 0) {return <Chip color="warning" size="small" label={`${diff}%`} icon={<ArrowDownwardIcon sx={{ fontSize: 40 }} />} />}
    return <Chip color="primary" size="small" label={`${diff}%`} icon={<CompareArrowsIcon sx={{ fontSize: 40 }} />} />
 }
export default function StatsWeeklyCard({week}: Props) {
    const [currentResults, setCurrentResults] = useState({})
    
    const weekPath = `/stats/coverResults/`
    useEffect(()=>{
        const userRef = ref(db, weekPath)
        return onValue(userRef, (snapshot) => {
            if (snapshot.exists()) {
                setCurrentResults((snapshot.val()))
            }
        })
    }, [weekPath])

    
    const lastWeek = week > 1 ? week - 1 : 1
    const lastWeekResults: WeekCover = currentResults ? currentResults[`week${lastWeek}` as keyof typeof currentResults] : defaultResult
    const currentWeekResults: WeekCover = currentResults ? currentResults[`week${week}` as keyof typeof currentResults] : defaultResult
    const isActive = currentWeekResults?.total > 0

    console.log('week result', currentResults) 
    return (
    
    <Card variant="outlined" sx={{ height: '100%', flexGrow: 1 }}>
      <CardContent>
        <SmallHeader title="Current Week Results"/>
        <Stack
          direction="column"
          spacing={3}
          sx={{ alignItems: 'center', justifyContent: 'flex-end', flexGrow: '1', gap: 1 }}
        >
            {!isActive && (
                <Typography sx={{fontSize:100, fontWeight:'400', textAlign: 'center'}}>{'TBD'}</Typography>
            )}
            {isActive && (
                <Typography sx={{fontSize:100, fontWeight:'bold', textAlign: 'center'}}>{weekResult(currentWeekResults.result)}</Typography>
            )}
            {isActive && currentWeekResults?.total > 0 && (
                <Stack
                    direction="row"
                    spacing={2}
                    sx={{
                        justifyContent: "center",
                        alignItems: "center",
                    }}
                >
                    {weekDiff(currentWeekResults.result ?? 0, lastWeekResults.result)}
                    <Typography sx={{fontSize:14, fontWeight:'500', textAlign: 'center'}}>Last Week: </Typography>
                    <Typography sx={{fontSize:14, fontWeight:'500', textAlign: 'center'}}>{weekResult(lastWeekResults.result)}</Typography>
                </Stack> 
            )}
            
        </Stack>
      </CardContent>
    </Card>
    )
}
