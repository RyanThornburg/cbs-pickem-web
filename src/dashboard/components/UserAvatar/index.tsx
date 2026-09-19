import { Avatar, Box, Typography } from "@mui/material";
import { UserAvatarProps } from "./UserAvatar.types";
import { createAvatarProps } from "./UserAvatar.util";
import { stringOrdinalPlace } from "../../helper";

export const UserAvatar = ({
  userName,
  size = 20,
  fontSize = "0.75rem",
  place = 0,
  userId,
  includeName = true,
  ...props
}: UserAvatarProps) => {
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, minWidth: 0 }}>
      <Avatar
        {...createAvatarProps(userName ?? "", {
          width: size,
          height: size,
          fontSize: fontSize,
        })}
        {...props}
      />
      {includeName && (
        <Box sx={{ display: "flex", alignItems: "center", minWidth: 0 }}>
          <Typography
            variant="caption"
            sx={{ fontSize: fontSize, lineHeight: 1 }}
            noWrap={true}
          >
            {userName}
          </Typography>
          {place > 0 && (
            <Typography
              variant="caption"
              sx={{
                fontSize: fontSize,
                lineHeight: 1,
                ml: 0.5, // adds a small margin between name and place
              }}
              noWrap={true}
            >
              {stringOrdinalPlace(place)}
            </Typography>
          )}
        </Box>
      )}
    </Box>
  );
};

export default UserAvatar;
