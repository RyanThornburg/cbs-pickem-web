import { Book } from "../../types";
import { bestOf, fmtMoney, fmtSpread, isBest } from "./gamesCardUtils";

type Props = {
  books: Book[];
  homeAbbr: string;
  awayAbbr: string;
};

// A book's price (the vig/juice) is itself American odds, so the same
// "bigger number costs less" rule from moneyline applies: -105 costs less
// than -110, +105 costs less still. Tracked separately from the point
// number -- a book can have the worst point and still be the cheapest to
// bet, or vice versa.
const PriceSub = ({
  value,
  best,
  prefix,
}: {
  value: number | null | undefined;
  best: number | null;
  prefix?: string;
}) => {
  if (value == null) return null;
  return (
    <span className={`gc-pricesub${isBest(value, best) ? " cheapest" : ""}`}>
      {prefix}
      {fmtMoney(value)}
    </span>
  );
};

export default function BookOddsTable({ books, homeAbbr, awayAbbr }: Props) {
  if (!books.length) {
    return (
      <p style={{ margin: "8px 0", fontSize: "0.82rem", color: "var(--gc-text-muted)" }}>
        No per-book data available for this game.
      </p>
    );
  }

  const bestHomeSpread = bestOf(books.map((b) => b.spread?.home_point));
  const bestAwaySpread = bestOf(books.map((b) => b.spread?.away_point));
  const bestMlHome = bestOf(books.map((b) => b.moneyline?.home_price));
  const bestMlAway = bestOf(books.map((b) => b.moneyline?.away_price));
  const bestHomePrice = bestOf(books.map((b) => b.spread?.home_price));
  const bestAwayPrice = bestOf(books.map((b) => b.spread?.away_price));
  // Confirmed against the odds_snapshots schema: for market=total, the
  // home_point/home_price pair holds the Over line/price, away holds Under
  // -- reused columns, not a home/away team distinction (totals have none).
  const bestOverPrice = bestOf(books.map((b) => b.total?.home_price));
  const bestUnderPrice = bestOf(books.map((b) => b.total?.away_price));

  const totalVals = books
    .map((b) => b.total?.home_point)
    .filter((v): v is number => v != null);
  const maxTotal = totalVals.length ? Math.max(...totalVals) : null;
  const minTotal = totalVals.length ? Math.min(...totalVals) : null;
  const totalTrend = (val: number | null | undefined) => {
    if (val == null || maxTotal == null || minTotal == null || maxTotal === minTotal) {
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
        {books.map((book) => {
          const trend = totalTrend(book.total?.home_point);
          return (
            <tr key={book.bookmaker}>
              <td style={{ textTransform: "capitalize" }}>{book.bookmaker}</td>
              <td className={isBest(book.moneyline?.away_price, bestMlAway) ? "gc-bestval" : undefined}>
                {fmtMoney(book.moneyline?.away_price)}
              </td>
              <td className={isBest(book.moneyline?.home_price, bestMlHome) ? "gc-bestval" : undefined}>
                {fmtMoney(book.moneyline?.home_price)}
              </td>
              <td className={isBest(book.spread?.away_point, bestAwaySpread) ? "gc-bestval" : undefined}>
                {book.spread ? fmtSpread(book.spread.away_point) : "—"}
                <PriceSub value={book.spread?.away_price} best={bestAwayPrice} />
              </td>
              <td className={isBest(book.spread?.home_point, bestHomeSpread) ? "gc-bestval" : undefined}>
                {book.spread ? fmtSpread(book.spread.home_point) : "—"}
                <PriceSub value={book.spread?.home_price} best={bestHomePrice} />
              </td>
              <td>
                {book.total ? book.total.home_point : "—"}
                {trend && <span className={`gc-totalarrow ${trend}`}>{trend === "high" ? "▲" : "▼"}</span>}
                <PriceSub value={book.total?.home_price} best={bestOverPrice} prefix="o " />
                <PriceSub value={book.total?.away_price} best={bestUnderPrice} prefix="u " />
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
