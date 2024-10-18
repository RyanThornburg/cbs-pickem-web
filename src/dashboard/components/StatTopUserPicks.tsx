import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import { blue, green, red } from "@mui/material/colors";
import LinearProgress from '@mui/material/LinearProgress';
import Stack from '@mui/material/Stack';
import { styled } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import { BarChart } from '@mui/x-charts/BarChart';
import { onValue, ref } from "firebase/database";
import { useEffect, useState } from 'react';
import { db } from "../../components/firebase";
import { TeamPicked } from '../../types';
import SmallHeader from './SmallHeader';

interface StyledTextProps {
  variant: 'primary' | 'secondary';
}

const StyledText = styled('text', {
  shouldForwardProp: (prop) => prop !== 'variant',
})<StyledTextProps>(({ theme }) => ({
  textAnchor: 'middle',
  dominantBaseline: 'central',
  variants: [
    {
      props: {
        variant: 'primary',
      },
      style: {
        fontSize: theme.typography.h5.fontSize,
      },
    },
    {
      props: ({ variant }) => variant !== 'primary',
      style: {
        fontSize: theme.typography.body2.fontSize,
      },
    },
    {
      props: {
        variant: 'primary',
      },
      style: {
        fontWeight: theme.typography.h5.fontWeight,
      },
    },
    {
      props: ({ variant }) => variant !== 'primary',
      style: {
        fontWeight: theme.typography.body2.fontWeight,
      },
    },
  ],
}));



const colors = [
  'hsl(220, 20%, 65%)',
  'hsl(220, 20%, 42%)',
  'hsl(220, 20%, 35%)',
  'hsl(220, 20%, 25%)',
];


export default function StatTopUserPicks() {
    const [teamPicks, setTeamPicks] = useState([]);

    useEffect(()=>{
        const userRef = ref(db, 'stats/teamsPicked/')
        return onValue(userRef, (snapshot) => {
            if (snapshot.exists()) {
                setTeamPicks(snapshot.val())
            }
        })
    }, [])

    const teamStack = (team: TeamPicked) => {
        return (
        <Stack
            direction="row"
            sx={{ alignItems: 'center', gap: 2, pb: 2 }}
        >
            <Stack sx={{ gap: 1, flexGrow: 1 }}>
                <Stack
                    direction="row"
                    sx={{
                    
                    alignItems: 'center',
                    gap: 0,
                    }}
                >
                    <Typography variant="body2" sx={{ fontWeight: '500' }}>
                        {team.team}
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                        {team.count}
                    </Typography>
                    <Box>
                    {new Array(team.count).fill('t').map((t) => (
                        <ErrorOutlineIcon fontSize="small"></ErrorOutlineIcon>
                    ))}
                    </Box>
                </Stack>
                <LinearProgress
                    variant="determinate"
                    aria-label="Number of users by country"
                    value={team.count}
                />
            </Stack>
        </Stack>
        )
    }
    
    function barColors() {
      return teamPicks.map((team: TeamPicked) => {
        const pickColor = team.is_game ? blue[50] : team.cover ? green[50] : red[50];

        return pickColor
      })
    }

    function barLabels() {
      return teamPicks.map((team: TeamPicked) => {
        const pickColor = team.is_game ? 1 : 0;
        return pickColor.toString()
      })
    } 

    return (
      <Card
        variant="outlined"
        sx={{ display: 'flex', flexDirection: 'column', gap: '8px', flexGrow: 1 }}
      >
        <CardContent>
          <SmallHeader title={'Most Popular Picks'} />
          
          <BarChart
              yAxis={[
                  {
                  id: 'barCategories',
                  data: teamPicks.map((team: TeamPicked) => {return team.team}),
                  scaleType: 'band',
                  colorMap: {
                    type: "ordinal",
                    colors: barColors()
                  }
                  },
              ]}
              barLabel={(item, context) => {
                const teamPicked: TeamPicked = teamPicks[item.dataIndex]
                return teamPicked.is_game ? `Picks Pending for ${teamPicked.team.replace('at', ' @ ')}` : item.value?.toString()
              }}
              series={[{
                data: teamPicks.map((team: TeamPicked) => {return team.count}),
              }]}
              layout="horizontal"
              height={1191}
              grid={{ vertical: true }}
          />
              
        </CardContent>
      </Card>
    );
}
