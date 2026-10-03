import Button from "@mui/material/Button";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { useNavigate } from "react-router-dom";

// "← Standings" at the top of a team or player page. Goes back in history
// when the page was opened from inside the app (so the list keeps its
// place), or to `fallback` when it was opened from a link or a reload.
export const BackLink = ({
  fallback,
  label,
}: {
  fallback: string;
  label: string;
}) => {
  const navigate = useNavigate();
  const cameFromApp =
    typeof window !== "undefined" &&
    ((window.history.state as { idx?: number } | null)?.idx ?? 0) > 0;
  return (
    <Button
      size="small"
      startIcon={<ArrowBackIcon />}
      href={fallback}
      onClick={(event) => {
        if (event.metaKey || event.ctrlKey || event.shiftKey) return;
        event.preventDefault();
        if (cameFromApp) navigate(-1);
        else {
          navigate(fallback);
          window.scrollTo({ top: 0 });
        }
      }}
      sx={{ alignSelf: "flex-start", ml: -1 }}
    >
      {label}
    </Button>
  );
};
