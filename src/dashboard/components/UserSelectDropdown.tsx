import { MenuItem } from "@mui/material";
import Box from "@mui/material/Box";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Select, { SelectChangeEvent } from "@mui/material/Select";
import { RankedUser } from "../types";

export type Props = {
  userList: RankedUser[];
  user: string | undefined;
  onUserChange: (userId: string) => void;
  // Controlled from MainGrid so the "Choose your name" hint can open it.
  open: boolean;
  onOpenChange: (open: boolean) => void;
  // After the menu has finished closing (focus is back on the select).
  onMenuClosed?: () => void;
};

export default function UserSelectDropdown({
  userList,
  user,
  onUserChange,
  open,
  onOpenChange,
  onMenuClosed,
}: Props) {
  // Case-insensitive, so lowercase names sit with their letter instead of
  // after "Z".
  const users = [...userList].sort((a, b) =>
    a.name.localeCompare(b.name, undefined, { sensitivity: "base" })
  );

  const handleChange = (event: SelectChangeEvent) => {
    onUserChange(event.target.value);
  };

  return (
    <Box sx={{ minWidth: 150 }}>
      <FormControl variant="standard" sx={{ minWidth: 150 }}>
        {/* Always above the field: with nothing chosen, the empty select
            shows the "Find yourself" placeholder instead. */}
        <InputLabel id="user-select-label" shrink>
          User
        </InputLabel>
        <Select
          // 40px tall on phones so it's an easy tap target.
          sx={{ pl: "12px", minHeight: { xs: 40, sm: "auto" } }}
          labelId="user-select-label"
          id="user-drop-down"
          value={user ?? ""}
          onChange={handleChange}
          open={open}
          onOpen={() => onOpenChange(true)}
          onClose={() => onOpenChange(false)}
          MenuProps={{ slotProps: { transition: { onExited: onMenuClosed } } }}
          displayEmpty
          renderValue={(value) =>
            value ? (
              (users.find((u) => u.id === value)?.name ?? "")
            ) : (
              <Box component="span" sx={{ color: "text.secondary" }}>
                Find yourself…
              </Box>
            )
          }
          label="User"
        >
          {/* Only to clear a choice; with no one chosen it would just be
              the highlighted first item when the menu opens. */}
          {user && (
            <MenuItem value="">
              <em>No one</em>
            </MenuItem>
          )}
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
