import { Avatar, Box, Link, Popover, Typography } from "@mui/material";
import { UserAvatarProps } from "./UserAvatar.types";
import { createAvatarProps } from "./UserAvatar.util";
import { stringOrdinalPlace } from "../../helper";
import UserTeamRecords from "../UserTeamRecords";
import { useState } from "react";

export const UserAvatar = ({
  userName,
  size = 20,
  fontSize = "0.75rem",
  place = 0,
  userId,
  includeName = true,
  ...props
}: UserAvatarProps) => {
  const [popOpen, setPopOpen] = useState<boolean>(false);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    event.stopPropagation(); // Stop event from bubbling up
    setPopOpen(true);
  };

  const handleClose = () => {
    setPopOpen(false);
  };

  const popid = popOpen ? "pop" : undefined;

  return (
    <>
      <Avatar
        {...createAvatarProps(userName ?? "", {
          width: size,
          height: size,
          fontSize: fontSize,
        })}
        {...props}
      />
      {includeName && (
        <Box sx={{ display: "flex", alignItems: "center" }}>
          <Link
            href="#"
            color="inherit"
            onClick={handleClick}
            sx={{ cursor: "pointer" }}
          >
            <Typography
              variant="caption"
              sx={{ fontSize: fontSize }}
              noWrap={true}
            >
              {userName}
            </Typography>
          </Link>
          {place > 0 && (
            <Typography
              variant="caption"
              sx={{
                fontSize: fontSize,
                ml: 0.5, // adds a small margin between name and place
              }}
              noWrap={true}
            >
              {stringOrdinalPlace(place)}
            </Typography>
          )}

          <Popover
            id={popid}
            open={popOpen}
            anchorReference={"none"}
            onClose={handleClose}
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            }}
            onClick={(e) => e.stopPropagation()} // Stop clicks inside popover from bubbling
          >
            <UserTeamRecords userId={userId} />
          </Popover>
        </Box>
      )}
    </>
  );
};

export default UserAvatar;
