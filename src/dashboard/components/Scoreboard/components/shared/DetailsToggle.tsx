import Button from "@mui/material/Button";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";

interface Props {
  open: boolean;
  onToggle: () => void;
}

export const DetailsToggle = ({ open, onToggle }: Props) => (
  <Button
    size="small"
    onClick={onToggle}
    aria-expanded={open}
    endIcon={
      <ExpandMoreIcon sx={{ transform: open ? "rotate(180deg)" : "none", transition: "transform 0.2s" }} />
    }
    sx={{ px: 0.5, color: "text.secondary", whiteSpace: "nowrap" }}
  >
    Box score and leaders
  </Button>
);
