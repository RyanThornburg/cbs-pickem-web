import { memo } from "react";
import { Box, BoxProps } from "@mui/material";

interface TeamIconProps extends BoxProps {
  teamName: string;
  size?: number;
}

const TeamIcon = memo(({ teamName, size = 24, ...props }: TeamIconProps) => {
  try {
    // Import all icons dynamically
    const iconPath = require(`../../../assets/icons/${teamName}`);

    return (
      <Box
        component="img"
        src={iconPath}
        alt={teamName}
        width={size}
        height={size}
        {...props}
      />
    );
  } catch (error) {
    console.error(`Failed to load icon for team: ${teamName}`);
    return null;
  }
});

TeamIcon.displayName = "TeamIcon";

export default TeamIcon;

// // Then in TeamScore/index.tsx, replace the img tag with:
// import TeamIcon from '../../../../components/TeamIcon';

// // ...inside your JSX:
// <TeamIcon
//   teamName={team.teamIcon}
//   sx={{ pl: "4px" }}
// />
