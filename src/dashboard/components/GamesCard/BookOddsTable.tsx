import { Book } from "../../types";
import {
  bestOf,
  bestOfferIndexes,
  fmtMoney,
  fmtSpread,
  isBest,
} from "./gamesCardUtils";

type Props = {
  books: Book[];
  homeAbbr: string;
  awayAbbr: string;
};

// One spread or total side for one book: the point, then its price (the
// vig, itself American odds, so -105 costs less than -110). A best offer
// (see bestOfferIndexes) gets one check after the price and bold on both.
const Offer = ({
  point,
  price,
  best,
  prefix,
}: {
  point?: string;
  price: number | null | undefined;
  best: boolean;
  prefix?: string;
}) => (
  <span className={`gc-offer${best ? " gc-bestoffer" : ""}`}>
    {point != null && <span className="gc-offer-pt">{point}</span>}
    {price != null && (
      <span className="gc-pricesub">
        {prefix}
        {fmtMoney(price)}
      </span>
    )}
  </span>
);

export default function BookOddsTable({ books, homeAbbr, awayAbbr }: Props) {
  if (!books.length) {
    return (
      <p
        style={{
          margin: "8px 0",
          fontSize: "0.8125rem",
          color: "var(--gc-text-muted)",
        }}
      >
        No per-book data available for this game.
      </p>
    );
  }

  const bestMlHome = bestOf(books.map((b) => b.moneyline?.home_price));
  const bestMlAway = bestOf(books.map((b) => b.moneyline?.away_price));
  const bestAwaySpread = bestOfferIndexes(
    books.map((b) => ({
      point: b.spread?.away_point,
      price: b.spread?.away_price,
    })),
    "higher"
  );
  const bestHomeSpread = bestOfferIndexes(
    books.map((b) => ({
      point: b.spread?.home_point,
      price: b.spread?.home_price,
    })),
    "higher"
  );
  // Confirmed against the odds_snapshots schema: for market=total, the
  // home_point/home_price pair holds the Over line/price, away holds Under
  // -- reused columns, not a home/away team distinction (totals have none).
  // The Over is best at the lowest total, the Under at the highest.
  const bestOver = bestOfferIndexes(
    books.map((b) => ({
      point: b.total?.home_point,
      price: b.total?.home_price,
    })),
    "lower"
  );
  const bestUnder = bestOfferIndexes(
    books.map((b) => ({
      point: b.total?.away_point,
      price: b.total?.away_price,
    })),
    "higher"
  );

  const totalVals = books
    .map((b) => b.total?.home_point)
    .filter((v): v is number => v != null);
  const maxTotal = totalVals.length ? Math.max(...totalVals) : null;
  const minTotal = totalVals.length ? Math.min(...totalVals) : null;
  const totalTrend = (val: number | null | undefined) => {
    if (
      val == null ||
      maxTotal == null ||
      minTotal == null ||
      maxTotal === minTotal
    ) {
      return null;
    }
    if (Math.abs(val - maxTotal) < 0.001) return "high";
    if (Math.abs(val - minTotal) < 0.001) return "low";
    return null;
  };

  return (
    <table className="gc-booktable">
      <thead>
        <tr>
          <th>Book</th>
          <th>ML {awayAbbr}</th>
          <th>ML {homeAbbr}</th>
          <th>Spread {awayAbbr}</th>
          <th>Spread {homeAbbr}</th>
          <th>Total</th>
        </tr>
      </thead>
      <tbody>
        {books.map((book, i) => {
          const trend = totalTrend(book.total?.home_point);
          return (
            <tr key={book.bookmaker}>
              <td style={{ textTransform: "capitalize" }}>{book.bookmaker}</td>
              <td
                className={
                  isBest(book.moneyline?.away_price, bestMlAway)
                    ? "gc-bestval"
                    : undefined
                }
              >
                {fmtMoney(book.moneyline?.away_price)}
              </td>
              <td
                className={
                  isBest(book.moneyline?.home_price, bestMlHome)
                    ? "gc-bestval"
                    : undefined
                }
              >
                {fmtMoney(book.moneyline?.home_price)}
              </td>
              <td>
                {book.spread ? (
                  <Offer
                    point={fmtSpread(book.spread.away_point)}
                    price={book.spread.away_price}
                    best={bestAwaySpread.has(i)}
                  />
                ) : (
                  "—"
                )}
              </td>
              <td>
                {book.spread ? (
                  <Offer
                    point={fmtSpread(book.spread.home_point)}
                    price={book.spread.home_price}
                    best={bestHomeSpread.has(i)}
                  />
                ) : (
                  "—"
                )}
              </td>
              <td>
                {book.total ? book.total.home_point : "—"}
                {trend && (
                  <span
                    className="gc-totalarrow"
                    role="img"
                    aria-label={
                      trend === "high"
                        ? "Highest total of these books"
                        : "Lowest total of these books"
                    }
                    title={
                      trend === "high"
                        ? "Highest total of these books"
                        : "Lowest total of these books"
                    }
                  >
                    {trend === "high" ? "▲" : "▼"}
                  </span>
                )}
                {book.total && (
                  <>
                    <Offer
                      price={book.total.home_price}
                      best={bestOver.has(i)}
                      prefix="o "
                    />
                    <Offer
                      price={book.total.away_price}
                      best={bestUnder.has(i)}
                      prefix="u "
                    />
                  </>
                )}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
