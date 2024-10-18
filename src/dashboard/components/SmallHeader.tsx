import Typography from '@mui/material/Typography'

export type SmallHeaderProps = {
    title: string;
  };
export default function SmallHeader({title}: SmallHeaderProps) {
    return (
        <Typography  component="h2" variant="h6"  >
            {title}
        </Typography>
    )
}