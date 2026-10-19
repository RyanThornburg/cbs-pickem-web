import { Game, GameStatus } from "../../../../types";
import { statusLabel } from "../../utils/scoreboardUtils";
import { formatGameShort } from "../../utils/dateFormatters";
import styles from "./StatusText.module.css";

export const StatusText = ({ game }: { game: Game }) => {
  const live = game.status === GameStatus.Inprogress;
  // Live and halftime read in ink; only the pulsing dot says "live". Red and
  // green are kept for how the pool's picks are doing.
  const ink =
    live ||
    game.status === GameStatus.Halftime ||
    game.status === GameStatus.Delayed;
  const scheduled = game.status === GameStatus.Scheduled;
  const label = scheduled ? formatGameShort(game.game_time) : statusLabel(game);

  return (
    <span
      className={[
        styles.status,
        ink && styles.ink,
        scheduled && styles.wraps,
        live && styles.live,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {label}
    </span>
  );
};

const TV_NAMES: Record<string, string> = { ESPD: "ESPN", AMZN: "Prime" };
export const tvName = (tv?: string) => (tv ? (TV_NAMES[tv] ?? tv) : "");
