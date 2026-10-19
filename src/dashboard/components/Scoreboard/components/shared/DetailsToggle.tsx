import { Button } from "../../../../ui/Button";
import { Icon } from "../../../../ui/Icon";
import styles from "./DetailsToggle.module.css";

interface Props {
  open: boolean;
  onToggle: () => void;
  // Compact rows put it across the bottom of the row on phones.
  fullWidthOnPhone?: boolean;
}

export const DetailsToggle = ({ open, onToggle, fullWidthOnPhone }: Props) => (
  <Button
    size="small"
    onClick={onToggle}
    aria-expanded={open}
    endIcon={
      <Icon
        name="ExpandMore"
        style={{
          transform: open ? "rotate(180deg)" : "none",
          transition: "transform 0.2s",
        }}
      />
    }
    className={[styles.toggle, fullWidthOnPhone && styles.fullWidthOnPhone]
      .filter(Boolean)
      .join(" ")}
  >
    Box score and leaders
  </Button>
);
