import Button from "@mui/material/Button";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { useLocation, useNavigate } from "react-router-dom";
import { backTargetFor } from "./backTarget";

// "← Trends" at the top of a team or player page. When the page was opened
// from inside the app it goes back in history (so the list keeps its place)
// and names that page; opened from a link or after a reload, it goes to
// `fallback` and says `label`.
export const BackLink = ({
  fallback,
  label,
}: {
  fallback: string;
  label: string;
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const target = backTargetFor(location.key);
  return (
    <Button
      size="small"
      startIcon={<ArrowBackIcon />}
      href={fallback}
      onClick={(event) => {
        if (event.metaKey || event.ctrlKey || event.shiftKey) return;
        event.preventDefault();
        if (target) navigate(-1);
        else {
          navigate(fallback);
          window.scrollTo({ top: 0 });
        }
      }}
      sx={{ alignSelf: "flex-start", ml: -1 }}
    >
      {target?.label ?? label}
    </Button>
  );
};
