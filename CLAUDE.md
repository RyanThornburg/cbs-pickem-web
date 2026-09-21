# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

A Create React App (react-scripts) + TypeScript dashboard for the "Morlocked" NFL pick'em league, live at <https://morlocked.rattsnest.com/>. It's a read-only viewer: a separate data-gathering project polls CBS/Sports IO/ESPN/The Odds API/Pirate Weather into Cloudflare D1 and precomputes per-week/season JSON into Cloudflare KV; this repo's Cloudflare Worker (`worker/index.ts`) serves that KV data over a small REST API, and the React app polls it. There is no write path anywhere in this repo.

## Commands

- `npm start` — CRA dev server (localhost:3000). `/api/*` is proxied to `http://localhost:8787` (see `proxy` in package.json), so pair this with `npm run dev` in another terminal to get live API data.
- `npm run dev` — `wrangler dev --remote`: runs the Worker + static assets locally against the real production KV namespace (there's no separate local/preview namespace — the Worker never writes, so this can't corrupt prod).
- `npm run build` — production build to `build/`.
- `npm run deploy` — `wrangler deploy`, ships the Worker + `build/` to Cloudflare. Deploys are fully manual — there's no CI workflow that builds or deploys automatically, so run `npm run build` first.
- `npm run tail` — `wrangler tail`, stream production Worker logs.
- `npm run types` — `wrangler types`, regenerate the `Env` type from `wrangler.jsonc`.
- `npm test` — run tests via react-scripts (Jest + React Testing Library) in interactive watch mode.
- `npm test -- --watchAll=false` — run tests once (CI mode).
- `npm test -- -t "test name"` — run a single test by name.
- `npm test -- defaultTab.test.ts` — run a single test file.

There is no separate lint script; `react-scripts` ESLint config (`eslintConfig` in package.json) runs as part of `npm start`/`npm run build`.

## Architecture

### Data flow: Cloudflare Worker + KV, polled from the client

- `worker/index.ts` is a thin, read-only passthrough: it maps request paths to KV keys (`meta:current`, `meta:historical`, `week:{season}:{weekNN}:{games|leaderboard|odds|trends}`, `season:{season}:trends`) and returns the KV value as JSON, or 404. Anything outside `/api/*` falls through to `env.ASSETS` (the built static site). There's no auth (open reads) and no `.put()` anywhere — nothing here can write to KV.
- `src/api/pickemApi.ts` has the client-side primitives: `fetchJson` (one-shot), `poll`/`pollJson` (run immediately, then on an interval, until the returned cleanup is called). Cloudflare has no Firebase-style push, so every data hook here polls instead of subscribing — poll intervals vary by how time-sensitive the data is (60s for live games, 5min for odds/trends, 30min for season trends).
- Data access lives in `src/dashboard/data/`, one file per resource, all following poll → parse → callback (returning the stop function): `GetGameDataByWeek.ts` (games; a thin wrapper around `weekGames.ts`, used by Scoreboard and the live-dot tab badge), `GetGamesTabData.ts` (joins games + odds for the Games tab), `GetUserByWeek.ts` (leaderboard + picks), `GetTrendsByWeek.ts` / `GetSeasonTrends.ts` (Trends tab).
- `weekGames.ts` is the shared core all the games-related fetchers build on: one `ApiGame` interface for the full `/api/weeks/:season/:week/games` payload (every caller hits the same endpoint), `toGame`/`toTeam` mappers, and shared helpers (`buildGamesById`, `findEarliestGame`, `getGameCoverResult`). Extend this rather than adding a second parallel game-parsing interface for a new consumer.
- `GetUserByWeek.ts` re-ranks client-side: the API's own `place`/`second_half_place` rank on `cumulative_score` alone, but the UI displays `cumulative_score + trending_score`, so ranks are recomputed against the displayed score (standard competition ranking — ties share a rank, the next rank skips accordingly). It also pads TBD pick placeholders, gated on `has_submitted_picks` — which can be *absent entirely* early in a week, not just `false`, so it's treated as unknown rather than "not submitted" whenever real picks already joined.
- Weeks are zero-padded to two digits in KV keys / Worker routes (`week:2026:03:games`), but passed around the app as plain numbers (`/api/weeks/2026/3/games`).

### State: one context, one orchestrator, everything else prop-drilled

- `CurrentWeekContext` (`src/dashboard/components/CurrentWeekContext.tsx`) is the only app-wide state: it polls `/api/meta` and holds `season`, `currentWeek`, `secondHalfStartWeek`, and derived `isSecondHalf`. The second-half boundary is a data field (`second_half_start_week` from `meta:current`, set by hand each season on the data side), not a hardcoded week number.
- `MainGrid.tsx` is the real orchestrator: it reads `currentWeek`/`season`/`secondHalfStartWeek` from context but keeps its own `selectedWeek` (the week the user is browsing, independent of `currentWeek`), `user` (selected user id, persisted to `localStorage` under `"user"`), and `userList` (re-fetched per `selectedWeek` via `GetUserByWeek`). It threads these down as props to each tab's component (`UsersTable`, `GamesCard`, `Scoreboard`, `TrendsSection`) rather than via context — check `MainGrid.tsx` first when tracing how a prop reaches a leaf component.
- Tabs are real routes, not local state: `/picks`, `/games`, `/scoreboard`, `/trends` (`App.tsx` + `useParams`/`useNavigate` in `MainGrid.tsx`). The last-visited tab persists to `localStorage` (`utils/defaultTab.ts`); a true cold start (nothing stored yet) defaults to `/picks`. An unrecognized `:tab` value redirects through `/` to re-resolve.

### Types

- `src/dashboard/types.ts` is the single source of truth for the API data shapes (`RankedUser`, `Game`, `Team`, `Book`, `MarketSpread`, `WeekTrends`, `SeasonTrends`, etc.) and status enums (`GameStatus`, `Possession`). These map to the Worker's KV-backed JSON responses — there's no schema/codegen, so if the data repo changes a KV shape, update this file by hand (check `CLAUDE.local.md` for the latest confirmed shape changes before assuming a field's shape).
- Odds quirk worth knowing: in `BookMarketSide`, `market=total` has no dedicated Over/Under field — `home_point`/`home_price` is the Over line/price, `away_point`/`away_price` is the Under (the data repo reuses the spread/moneyline columns for totals). See the doc comment on `BookMarketSide` in `types.ts`.

### Component structure

- `src/dashboard/components/` holds one directory per dashboard tab/widget: `GamesCard` (odds + weather, desktop/mobile split; `gamesCardUtils.ts` holds the "is this notable" thresholds — `WEATHER_THRESHOLDS`/`BIG_MOVE_PTS`/`CBS_DIVERGE_PTS` — as frontend config, deliberately kept out of the data pipeline since these get retuned during the season), `Scoreboard` (live scores; `hooks/useGameData.ts` + `hooks/useGameGroups.ts`), `TrendsSection` (week + season trend cards), `UsersTable` (leaderboard/picks grid; desktop `UserDataGrid` + mobile `UserDataMobile`), `UserSelected`/`UserAvatar` (selected-user header).
- `LeaderboardCard/` is currently orphaned (not imported anywhere) — the standalone overall/second-half leaderboard cards were hidden in `MainGrid.tsx` since `UsersTable`'s Place columns cover the same data. A redesign is pending; check `CLAUDE.local.md` before deleting it.
- `src/dashboard/icons/` has one PNG per NFL team, referenced by team abbreviation; `utils/teamAssets.ts` normalizes KV team abbreviations that don't match `Scoreboard/utils/team_data.json`'s ESPN-derived keys (`TEAM_ABBR_ALIASES`) before logo/color lookups.
- `src/dashboard/shared-theme/` and `src/dashboard/theme/` provide the MUI theme setup (`AppTheme`, `ColorModeSelect`/`ColorModeIconDropdown` for light/dark mode). `theme/customizations/` only has `dataGrid.ts` now — the chart/tree-view/date-picker theme customizations (and the MUI X Pro dependencies they pulled in) were unused leftovers from the original MUI Dashboard template with no matching component anywhere in this app, and have been removed.

### Worker

- `worker/index.ts` + `wrangler.jsonc` are the entire backend: one `fetch` handler, a single KV binding (`PICKEM_KV`, no named environments — `wrangler dev --remote` and `wrangler deploy` both read the same prod namespace), and static-asset serving (`assets.directory: ./build`, SPA fallback via `not_found_handling`).

### Deployment

- Hosting is Cloudflare Workers + Static Assets, live at <https://morlocked.rattsnest.com/>. There is no CI/CD — deploys are manual (`npm run build && npm run deploy`). The previous IONOS Deploy Now GitHub Actions workflow has been removed along with IONOS hosting.

## Migration history

This app was migrated off Firebase Realtime Database + IONOS hosting onto the Cloudflare Worker/KV architecture described above. The migration is complete as of 2026-09-21 (`v2` merged into `main`, IONOS workflow removed, DNS live on Cloudflare). `CLAUDE.local.md` (gitignored, not committed) has the full decision history from the migration and tracks current post-cutover (phase-2) work — check it before assuming a feature is or isn't built yet.
