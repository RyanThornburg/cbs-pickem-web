# CBS Pick'em Web

Dashboard for our NFL pick'em league run through CBS. We run competitions based on 1st/2nd half and overall and CBS can't track that so started to display the data here.

All the data is written in [https://github.com/RyanThornburg/cbs-pickem](https://github.com/RyanThornburg/cbs-pickem) and just reading the data with this app.

## Stack

- Create React App + TypeScript
- Cloudflare Worker + KV for data

## Commands

- `npm start` runs the dev server at localhost:3000
- `npm run build` builds for production into `build/`
- `npm test`

## Project layout

- `src/dashboard/components/` one folder per dashboard widget (Scoreboard, UsersTable, TrendsSection, GamesCard, etc.)
- `src/dashboard/types.ts` shared data types
- `worker/` the Cloudflare Worker that serves data from KV
- `src/dashboard/icons/` team logo PNGs

## Note on AI usage

Relied heavily on AI usage for v2. See `CLAUDE.md` for architecture notes.
