import { MenuItem } from "@mui/material";
import Box from "@mui/material/Box";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Select, { SelectChangeEvent } from "@mui/material/Select";
import { RankedUser } from "../types";

export type Props = {
  userList: RankedUser[];
  user: string | undefined;
  onUserChange: any;
};

export default function UserSelectDropdown({
  userList,
  user,
  onUserChange,
}: Props) {
  const users = [...userList].sort((a, b) =>
    a.name < b.name ? -1 : a.name > b.name ? 1 : 0
  );

  const handleChange = (event: SelectChangeEvent) => {
    onUserChange(event.target.value);
  };

  return (
    <Box sx={{ minWidth: 150 }}>
      <FormControl variant="standard" sx={{ minWidth: 150 }}>
        <InputLabel id="userListLabel">User</InputLabel>
        <Select
          sx={{ pl: "12px" }}
          labelId="userList"
          id="user-drop-down"
          value={users ? user : ""}
          onChange={handleChange}
          label="User Details"
        >
          <MenuItem value="">
            <em>None</em>
          </MenuItem>
          {users.map((userItem: RankedUser) => {
            return (
              <MenuItem
                key={userItem.id}
                value={userItem.id}
                selected={user === userItem.id}
              >
                {userItem.name}
              </MenuItem>
            );
          })}
        </Select>
      </FormControl>
    </Box>
  );
}
