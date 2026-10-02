import { MenuItem } from "@mui/material";
import Box from "@mui/material/Box";
import FormControl from "@mui/material/FormControl";
import Select, { SelectChangeEvent } from "@mui/material/Select";
import { visuallyHidden } from "../helper";

export type Props = {
  currentWeek: number;
  selectedWeek: number;
  onWeekChange: (week: number) => void;
};

// A small pill, "Week 3" ("Wk 3" on phones), next to the player picker.
export default function WeekDropdown({
  currentWeek,
  selectedWeek,
  onWeekChange,
}: Props) {
  const handleChange = (event: SelectChangeEvent) => {
    onWeekChange(Number(event.target.value));
  };

  return (
    <FormControl variant="standard" sx={{ flex: "none" }}>
      <Box component="span" id="week-select-label" sx={visuallyHidden}>
        Week
      </Box>
      <Select
        // 40px tall so it's an easy tap target and matches the picker.
        sx={{
          pl: "12px",
          minHeight: 40,
          borderRadius: "999px",
          fontWeight: 600,
          fontSize: "0.875rem",
          whiteSpace: "nowrap",
        }}
        labelId="week-select-label"
        id="week-drop-down"
        value={selectedWeek === 0 ? "1" : selectedWeek.toString()}
        onChange={handleChange}
        // One span: the select lays its value out as flex, which would
        // drop the space between "Week" and the number. The word is hidden
        // from screen readers, since the label already says "Week".
        renderValue={(value) => (
          <span>
            <Box
              component="span"
              aria-hidden
              sx={{ display: { xs: "none", md: "inline" } }}
            >
              Week{" "}
            </Box>
            <Box
              component="span"
              aria-hidden
              sx={{ display: { xs: "inline", md: "none" } }}
            >
              Wk{" "}
            </Box>
            {value}
          </span>
        )}
      >
        {[...Array(currentWeek)].map((_, index) => {
          const weekNum = currentWeek - index;
          return (
            <MenuItem key={weekNum} value={weekNum}>
              Week {weekNum}
            </MenuItem>
          );
        })}
      </Select>
    </FormControl>
  );
}
