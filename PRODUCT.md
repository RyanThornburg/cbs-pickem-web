# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

The players in the Morlocked NFL pick'em pool: about 35–40 people, a mix of friends and strangers, in a pool that has run since 2013. They make their weekly picks on CBS and come here to see how they're doing. Most use a phone, but desktop is used too, so both have to work well.

The pool's admin (the site's owner) is a second audience, and only for the Access-guarded `/admin` page that monitors the data pipeline.

## Product Purpose

It's a read-only dashboard for a CBS pick'em pool that shows what CBS can't. It has four jobs, all confirmed:

1. **Track the prizes CBS doesn't.** The pool pays for first-half, second-half and overall standings, and CBS can't track the half competitions. This is why the site exists.
2. **A live, pool-aware sweat.** During games it shows who picked what: covering status, pick splits with every picker's name, your pick's state, and where you'd rank if games ended now. General scoreboards (CBS, ESPN) don't know the pool.
3. **Banter and bragging.** Weekly recaps, streaks, movers, 5-0 weeks, the defending champion, and all-time records back to 2013: the pool's social history.
4. **Pick research.** Lines, market consensus and movement, O/U, and kickoff weather, to help people pick before the deadline.

Success means players check here instead of CBS for anything beyond submitting picks.

## Positioning

It's the only view that knows this pool: its players, their picks, its prize structure, and its 13+ seasons of history. Every scoreboard, odds or weather feature is framed by who in the pool it affects.

## Operating Context

- Picks are made on CBS. The header links to the CBS pool, and this site never takes input.
- The weekly rhythm: research before the Sunday deadline, the sweat during Sunday, Monday and Thursday games, then standings and recaps after.
- Data comes from a separate pipeline (CBS, Sports IO, ESPN, The Odds API, Pirate Weather → Cloudflare D1 → KV). The UI polls it, and some fields can be missing, null or lagging, so the UI tolerates gaps instead of assuming fields are present.
- Sections: User Picks (leaderboard, picks, recap strip, leader cards from the second half on), Games, Scoreboard, Trends (week and season), Records, and Admin (owner only).

## Capabilities and Constraints

- **Read-only, never a pick tool.** There's no write path, and picks always happen on CBS.
- Browsing any week, not just the current one. Choosing a player to follow persists per browser, with no accounts or login for players.
- Near-live data by polling (about 60s for games and the leaderboard), not push.
- The second-half boundary and the number of paid places are data fields (`meta:current`), set each season.
- Display thresholds (weather, line moves, close games, hot/cold form) are frontend config that gets retuned during the season.
- Effectively light-only today. No dark mode is shipped.

## Brand Commitments

- **Name:** Morlocked (the pool), "Morlocked Pick'em" in the header.
- **Voice:** plain, short, no jargon. Quick wins, not paragraphs: one big number plus at most a short line. Wording has to read correctly to a casual fan, e.g. "pick tendency" rather than a "streak" that implies winning, and naming the precipitation rather than saying "clearing".

## Evidence on Hand

- Real pool data in production KV: every live week, season trends, per-user season history, and `meta:historical` back to 2013 (the 2015 and 2016 champions are unknown in the data).
- Screenshots of every page in `docs/screenshots/`, with names masked.
- Local team logos in `src/dashboard/icons/`.
- No testimonials, and no user counts beyond the roster. Don't invent them.

## Product Principles

1. **Pool first.** Show a feature through the pool's lens (who picked it, who it moves) or question why it's here.
2. **Stable and scannable.** Keep orders fixed so people know where to look. Draw attention with state (borders, badges), not by re-sorting.
3. **Say it plainly, say it short.** Every label should be right on the first read for a casual fan.
4. **Tolerate missing data.** Hide or show "–" rather than guess when a feed field is absent.
5. **Public by default.** The repo is public: no real names in committed assets, and no secrets or admin details in code.

## Accessibility & Inclusion

No specific standard has been set. Keep working status colors (covering or not, won or lost) paired with icons or text, as the Scoreboard already does.
