import { HistoricalChampion, HistoricalRecords } from "../../types";
import {
  cleanName,
  closedSeasons,
  highestWinningScore,
  isUnknownChampion,
  seasonPeriods,
} from "./recordsUtils";
import styles from "./ChampionsWall.module.css";

type TagTone = "gold" | "grey";

function Tag({ tone, children }: { tone: TagTone; children: React.ReactNode }) {
  return <span className={`${styles.tag} ${styles[tone]}`}>{children}</span>;
}

const You = () => <span className={styles.you}> (you)</span>;

type Props = {
  data: HistoricalRecords;
  currentSeason: number;
  userId: string;
};

// Every champion at once, newest first: a grid of tiles from sm up, a
// plain list on phones. No scroller, so the repeat winners and the unknown
// 2015/2016 seasons read as one history.
export default function ChampionsWall({ data, currentSeason, userId }: Props) {
  const years = closedSeasons(data);
  const defendingYear = years[years.length - 1];
  const topScore = highestWinningScore(data);
  // Champions are listed by name only, so the "you" match goes through the
  // career list's names.
  const idByName = new Map(
    data.career.map((c) => [cleanName(c.name).toLowerCase(), c.user_id])
  );
  const isYouName = (name: string) =>
    String(idByName.get(name.toLowerCase())) === userId;
  const champions = [...data.champions].sort((a, b) => b.year - a.year);

  // One line per period inside the season (the halves so far), in the
  // season's order.
  const periodLines = (year: number) => {
    const lines = seasonPeriods(data, year).map((period) => ({
      ...period,
      champ: data.period_champions?.find(
        (c) => c.year === year && c.period_key === period.key
      ),
    }));
    if (!lines.some((line) => line.champ)) return null;
    // Scores only when every period has one, so the lines match.
    const withScores = lines.every((line) => line.champ?.score != null);
    return (
      <div className={styles.periods}>
        {lines.map(
          ({ key, name, champ }) =>
            champ && (
              <span key={key} className={styles.period}>
                {name}:{" "}
                <b className={styles.periodNames}>
                  {champ.names.map(cleanName).join(", ")}
                </b>
                {withScores && ` · ${champ.score}`}
              </span>
            )
        )}
      </div>
    );
  };

  const tags = (champ: HistoricalChampion, unknown: boolean) => (
    <>
      {champ.year === defendingYear && !unknown && (
        <Tag tone="gold">Defending</Tag>
      )}
      {topScore !== undefined && champ.score === topScore && !unknown && (
        <Tag tone="grey">Highest winning score</Tag>
      )}
      {champ.names.length > 1 && (
        <Tag tone="grey">{champ.names.length}-way tie</Tag>
      )}
      {unknown && <Tag tone="grey">Incomplete records</Tag>}
    </>
  );

  return (
    <div className={styles.section}>
      <div className={styles.heading}>
        <h3 className={styles.title}>Champions</h3>
        {currentSeason > defendingYear && (
          <p className={styles.note}>{currentSeason} season in progress</p>
        )}
      </div>
      <ol
        aria-label="Champions by season, newest first"
        className={styles.list}
      >
        {champions.map((champ) => {
          const unknown = isUnknownChampion(champ);
          const names = champ.names.map(cleanName);
          const isYou = !unknown && names.some(isYouName);
          const defending = champ.year === defendingYear && !unknown;
          return (
            <li
              key={champ.year}
              className={[
                styles.champion,
                defending && styles.defending,
                unknown && styles.unknown,
                isYou && styles.isYou,
              ]
                .filter(Boolean)
                .join(" ")}
            >
              <p className={styles.year}>{champ.year}</p>
              <div className={styles.body}>
                {unknown ? (
                  <p className={styles.unknownText}>Champion unknown</p>
                ) : (
                  <p className={styles.names}>
                    {names.map((name, i) => (
                      <span key={name} className={styles.nameLine}>
                        {name}
                        {isYouName(name) && <You />}
                        {i < names.length - 1 && (
                          <span className={styles.comma}>, </span>
                        )}
                      </span>
                    ))}
                  </p>
                )}
                {!unknown && champ.score != null && (
                  <div className={styles.score}>{champ.score} pts</div>
                )}
                <div className={styles.tags}>{tags(champ, unknown)}</div>
                <div className={styles.periodsWrap}>
                  {periodLines(champ.year)}
                </div>
              </div>
              {!unknown && champ.score != null && (
                <span className={styles.phoneScore}>{champ.score}</span>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
