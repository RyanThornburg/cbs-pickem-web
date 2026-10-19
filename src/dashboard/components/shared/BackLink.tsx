import { useLocation, useNavigate } from "react-router-dom";
import { backTargetFor } from "./backTarget";
import { Button } from "../../ui/Button";
import { Icon } from "../../ui/Icon";

// "← Trends" at the top of a team or player page. When the page was opened
// from inside the app it goes back in history (so the list keeps its place)
// and names that page; opened from a link or after a reload, it goes to
// `fallback` and says `label`.
export const BackLink = ({
  fallback,
  label,
  inheritColor,
}: {
  fallback: string;
  label: string;
  // On a colored band (the team page's), take the band's text color.
  inheritColor?: boolean;
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const target = backTargetFor(location.key);
  return (
    <Button
      size="small"
      startIcon={<Icon name="ArrowBack" />}
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
      style={{
        alignSelf: "flex-start",
        marginLeft: -8,
        color: inheritColor ? "inherit" : undefined,
      }}
    >
      {target?.label ?? label}
    </Button>
  );
};
