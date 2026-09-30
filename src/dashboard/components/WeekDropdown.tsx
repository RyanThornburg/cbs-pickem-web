import { MenuItem } from "@mui/material";
import Box from "@mui/material/Box";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Select, { SelectChangeEvent } from "@mui/material/Select";

export type Props = {
  currentWeek: number;
  selectedWeek: number;
  onWeekChange: (week: number) => void;
};

export default function WeekDropdown({
  currentWeek,
  selectedWeek,
  onWeekChange,
}: Props) {
  const handleChange = (event: SelectChangeEvent) => {
    onWeekChange(Number(event.target.value));
  };

  return (
    <Box sx={{ minWidth: 75 }}>
      <FormControl variant="standard" sx={{ minWidth: 75 }}>
        <InputLabel id="userListLabel">Week</InputLabel>
        <Select
          // 40px tall on phones so it's an easy tap target.
          sx={{ pl: "12px", minHeight: { xs: 40, sm: "auto" } }}
          labelId="weekList"
          id="week-drop-down"
          value={selectedWeek === 0 ? "1" : selectedWeek.toString()}
          onChange={handleChange}
          label="Week"
        >
          {[...Array(currentWeek)].map((_, index) => {
            const weekNum = currentWeek - index;
            return (
              <MenuItem key={weekNum} value={weekNum}>
                {weekNum}
              </MenuItem>
            );
          })}
        </Select>
      </FormControl>
    </Box>
  );
}
