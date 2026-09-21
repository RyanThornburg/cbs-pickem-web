# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

A Create React App (react-scripts) + TypeScript dashboard that displays results for the "Morlocked" NFL pick'em league. It's a read-only viewer: all pick/game/user data lives in Firebase Realtime Database and is streamed into the UI via `onValue` listeners — there is no write path or backend in this repo.

## Commands

- `npm start` — run the dev server (localhost:3000)
- `npm run build` — production build to `build/`
- `npm test` — run tests via react-scripts (Jest + React Testing Library) in interactive watch mode
- `npm test -- --watchAll=false` — run tests once (CI mode)
- `npm test -- -t "test name"` — run a single test by name
- `npm test -- App.test.tsx` — run a single test file

There is no separate lint script; `react-scripts` ESLint config (`eslintConfig` in package.json) runs as part of `npm start`/`npm run build`.

## Architecture

### Data flow: Firebase Realtime Database as the source of truth

- `src/api/firebase.ts` initializes the Firebase app and exports `db` (a Realtime Database instance). There's no auth — reads are open.
- Data access lives in `src/dashboard/data/`: `GetGameDataByWeek.ts` and `GetUserByWeek.ts`. Both follow the same pattern: take a week number and a `callback`, subscribe with `onValue(ref(db, path), ...)`, and return the `unsubscribe` function. Callers (components/context) own the `useEffect` that subscribes on mount/dependency-change and unsubscribes on cleanup.
- Weeks are zero-padded to two digits when building DB paths (e.g. `weeks/week03/games_sorted/`), but passed around the app as plain numbers.
- `GetUserByWeek` also does client-side ranking: it computes `place` (overall) and `second_half_place` per user by sorting on `score + trending_score` (or `second_half + trending_score` for the second-half standings) and walking the sorted list to assign tied ranks (`findUserRank`), then sorts the final list by `compareUsers` (place, then second-half place, then name).

### State: one global context, everything else is local/prop-drilled

- `CurrentWeekContext` (`src/dashboard/components/CurrentWeekContext.tsx`) is the only app-wide state: it holds `currentWeek` (pushed from Firebase's `current_week/` node, set in `Dashboard.tsx`) and derives `rankedUsers` for that week and `isSecondHalf` (`currentWeek >= 10` — the season's second-half cutoff is hardcoded here).
- `MainGrid.tsx` is the real orchestrator: it reads `currentWeek` from context but keeps its own `selectedWeek` (the week the user is browsing, which can differ from `currentWeek`), `user` (selected user id, persisted to `localStorage` under key `"user"`), and `userList` (re-fetched per `selectedWeek` via `GetUserByWeek`). It threads `selectedWeek`, `user`, and `userList` down as props to every dashboard card (`StatsLeaderboard`, `CoverResultCard`, `UsersTable`, `Scoreboard`, `TopTeamsPicked`, etc.) rather than via context — check `MainGrid.tsx` first when tracing how a prop reaches a leaf component.
- Second-half awareness (`isSecondHalf` / `showSecondHalf`) is threaded independently through both the context and `selectedWeek >= 10` checks in `MainGrid`; when changing second-half logic, both places need to agree.

### Types

- `src/dashboard/types.ts` is the single source of truth for the Firebase data shapes (`User`, `RankedUser`, `Pick`, `Game`, `Team`, `TeamCovers`, etc.) and status enums (`GameStatus`, `PickStatus`). These map directly to the JSON structure stored under `weeks/weekNN/` and `userPicks/` in the Realtime Database — there's no schema/codegen, so if the DB shape changes, update this file by hand.

### Component structure

- `src/dashboard/components/` holds one directory per dashboard card/widget (e.g. `Scoreboard`, `UsersTable`, `LeaderboardCard`, `TopTeamsPicked`, `WeeklyCoverChart`, `CoverResultCard`). Larger widgets nest their own `components/`, `hooks/`, and `utils/` (see `Scoreboard/` for the fullest example: `hooks/useGameData.ts` and `hooks/useGameGroups.ts` do the per-widget data fetching/grouping, `utils/team_data.json` is a static NFL team metadata lookup keyed by team abbreviation, used for logos/colors).
- `src/dashboard/icons/` has one PNG per NFL team, referenced by team abbreviation.
- `src/dashboard/shared-theme/` and `src/dashboard/theme/` provide the MUI theme setup (this app is built on the MUI "Dashboard" template — `AppTheme`, `ColorModeSelect`/`ColorModeIconDropdown` for light/dark mode, and per-component theme customizations under `theme/customizations/`). Most `.js`/`.tsx` file pairs under `shared-theme/customizations/` are template leftovers — the `.tsx` files are the ones actually imported.

### Deployment

- The IONOS Deploy Now workflow (`.github/workflows/deploy-to-ionos.yaml`) has been removed — hosting moved to Cloudflare Workers + Static Assets (see `wrangler.jsonc`) as part of the Firebase/IONOS → Cloudflare migration below.

## Migration in progress: Firebase/IONOS → Cloudflare

This app is being migrated off Firebase Realtime Database and IONOS hosting onto Cloudflare. **Firebase is no longer the pool's live data source** — a separate data-gathering project now polls CBS/Sports IO/ESPN/The Odds API into a Cloudflare D1 (SQLite) database, and this repo's current Firebase reads are stale/dead going forward, not just legacy. Everything above this section describes the *current* (Firebase-based) implementation, which still needs to be replaced.

Planned shape (not yet built): the data repo will precompute per-week JSON and write it to Cloudflare KV (mirroring today's `weeks/weekNN/...` / `userPicks/` structure); this app reads from KV via a Worker instead of `onValue` Firebase listeners, and polls instead of subscribing (Cloudflare has no Firebase-style push). Hosting moves to Cloudflare (Pages or Workers static assets, undecided) in place of the IONOS workflow.

The live todo list, must-have/would-have feature scope, data-shape decisions, and known gaps in the new D1 schema (e.g. no season-long user stats yet, live game snapshots only exist for windows the poller was running) are tracked in `CLAUDE.local.md` (gitignored, not committed) — check it for current migration status before assuming anything below is still accurate.
