---
name: Morlocked Pick'em
description: The league office for a long-running NFL pick'em pool — standings, picks, live sweat and records.
colors:
  ink: "rgba(0, 0, 0, 0.87)"
  ink-muted: "rgba(0, 0, 0, 0.6)"
  ink-faint: "rgba(0, 0, 0, 0.38)"
  paper: "#ffffff"
  hairline: "rgba(0, 0, 0, 0.12)"
  office-blue: "#1976d2"
  covered-green: "#2e7d32"
  missed-red: "#d32f2f"
  caution-orange: "#ed6c02"
  trophy-gold: "#d4a017"
  trophy-gold-deep: "#8a6a0f"
  medal-silver: "#c3c7cf"
  medal-bronze: "#d9a27a"
  selected-lime: "#f0f4c3"
  streak-flame: "#ff7043"
  streak-pill: "#bf360c"
  streak-pill-end: "#c62828"
  pick-won-fill: "#e8f5e9"
  pick-won-edge: "#66bb6a"
  pick-lost-fill: "#ffcdd2"
  pick-lost-edge: "#ef5350"
  pick-open-fill: "#e3f2fd"
  pick-open-edge: "#42a5f5"
  away-blue: "#1f77d0"
  home-orange: "#f28c28"
  turf-green: "#2f7a45"
  pool-violet: "#5b45c2"
  pool-violet-ink: "#4a36a8"
  pool-violet-tint: "#f4f2fd"
  slate-900: "hsl(220, 35%, 3%)"
  slate-700: "hsl(220, 20%, 25%)"
  slate-200: "hsl(220, 20%, 88%)"
  slate-100: "hsl(220, 30%, 94%)"
  slate-50: "hsl(220, 35%, 97%)"
  caution-ink: "#8a560a"
  caution-tint: "#fbe9d7"
  focus-ring: "hsl(210, 98%, 42%)"
typography:
  headline:
    fontFamily: "Inter, system-ui, -apple-system, Segoe UI, Roboto, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 600
  title:
    fontFamily: "Inter, system-ui, -apple-system, Segoe UI, Roboto, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 600
  body:
    fontFamily: "Inter, system-ui, -apple-system, Segoe UI, Roboto, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.43
  compact:
    fontFamily: "Inter, system-ui, -apple-system, Segoe UI, Roboto, sans-serif"
    fontSize: "0.8125rem"
    fontWeight: 400
  label:
    fontFamily: "Inter, system-ui, -apple-system, Segoe UI, Roboto, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 500
  stat:
    fontFamily: "Inter, system-ui, -apple-system, Segoe UI, Roboto, sans-serif"
    fontSize: "1.75rem"
    fontWeight: 700
    fontFeature: "tnum"
rounded:
  hairline: "4px"
  sm: "5px"
  md: "8px"
  lg: "10px"
  xl: "12px"
  strip: "20px"
  pill: "999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
components:
  button-contained:
    backgroundColor: "{colors.slate-900}"
    textColor: "{colors.paper}"
    rounded: "{rounded.md}"
    height: "2.5rem"
  button-outlined:
    backgroundColor: "{colors.slate-50}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    height: "2.5rem"
  tab:
    textColor: "{colors.ink-muted}"
    rounded: "{rounded.md}"
    padding: "6px 8px"
  tab-hover:
    backgroundColor: "{colors.slate-100}"
    textColor: "{colors.ink}"
  tab-records:
    textColor: "{colors.trophy-gold-deep}"
  chip-default:
    backgroundColor: "{colors.slate-100}"
    textColor: "{colors.ink-muted}"
    rounded: "{rounded.pill}"
    height: "20px"
  pick-won:
    backgroundColor: "{colors.pick-won-fill}"
    textColor: "{colors.ink}"
    rounded: "{rounded.hairline}"
    width: "70px"
  pick-lost:
    backgroundColor: "{colors.pick-lost-fill}"
    textColor: "{colors.ink}"
    rounded: "{rounded.hairline}"
    width: "70px"
  pick-open:
    backgroundColor: "{colors.pick-open-fill}"
    textColor: "{colors.ink}"
    rounded: "{rounded.hairline}"
    width: "70px"
  card:
    backgroundColor: "{colors.slate-50}"
    rounded: "{rounded.md}"
    padding: "16px"
  card-outlined:
    backgroundColor: "{colors.paper}"
    rounded: "{rounded.md}"
    padding: "16px"
  row-selected:
    backgroundColor: "{colors.selected-lime}"
  medal-gold:
    backgroundColor: "{colors.trophy-gold}"
    textColor: "#3d2c05"
---

# Design System: Morlocked Pick'em

## Overview

**Creative North Star: "The League Office"**

This is where the pool's record gets kept. It should feel like the back office of a club that's been running since 2013: calm and correct about the numbers, but warm, with trophies on the shelf. The standings, the picks and the box scores are the official record, so they sit on plain white paper in tidy tables with hairline rules. The warmth comes from the clubhouse details around that record: a gold trophy for the defending champ, medal tiles for the paid places, a small flame for a hot streak, a gold 5-0.

Density is high but never cramped. A player should be able to find their row, their five picks and their place in one glance on a phone during a Sunday game. Color is reserved for meaning. Green and red say won or lost (or covering or not, while a game is live), blue says not decided yet, and gold says honor. Everything else is ink on paper.

The whole app is set in Inter and speaks one voice, **Office**: MUI's light theme, neutral chrome and MUI's default blue as the accent. The Games tab once had its own Kickoff Board palette and fonts; since 2026-10-02 its `--gc-*` names point at the same theme tokens, so only team logos differ from tab to tab.

**Key Characteristics:**
- White paper, hairline dividers, no resting shadows.
- Tables are the primary container; cards group secondary things.
- Color means state (won, lost, open, honored), never decoration.
- Gold is the clubhouse color: trophies, medals, 5-0, the Records tab.
- Friendly details (identicon avatars, pill badges, medal tiles) live at the edges of the record, not in it.
- Light only. There are no dark color schemes; the `applyStyles("dark", …)` blocks left in the theme overrides are inert.

## Colors

The palette is ink on white paper, a traffic-light status set for results, and one warm gold for honors.

**Where these values come from:** `AppTheme.tsx` only passes `palette: { mode: "light" }` to `createTheme`, so the live `theme.palette` is MUI's default light palette. `themePrimitives.ts` has a full custom palette (`brand`, `gray`, `green`, `orange`, `red`), but it only shows up where a component override imports those scales directly (buttons, tabs, chips, selects, cards). The frontmatter lists the values that actually render.

### Primary
- **Office Blue** (`office-blue`): MUI's default primary. It's used sparingly: the inset 3px marker on the "you" row in Records tables (the row itself is Selected Lime, as everywhere else), focus rings, and links. It isn't a brand color, just the default accent the app inherited.

### Secondary
- **Trophy Gold** (`trophy-gold`): honors only. The defending champion's trophy, the 1st-place medal tile, the gold 5-0 name badge, and chart highlights for perfect weeks. **Deep Trophy Gold** (`trophy-gold-deep`, 5.1:1 on white) is the text-safe version, used on the Records tab label and icon, the paid lines and "in the money". It was `#a87f12` (3.7:1) until 2026-10-01. Icons on a pale gold tile (the defending-champion trophy) use `#9a7410` to reach 3:1.
- **Medal Silver** (`medal-silver`) and **Medal Bronze** (`medal-bronze`): 2nd- and 3rd-place tiles on the leader cards, with dark text for contrast.

### Tertiary (status)
- **Covered Green** (`covered-green`) and **Missed Red** (`missed-red`): won or lost, covering or not. Used in the your-pick badge, the pick-split bar and ATS tags; text on a pale tint uses the `.dark` step (`#1b5e20`, `#c62828`) so it stays above 4.5:1. On the Scoreboard, red and green mean only how a pick is doing: the live status is ink with a small red pulsing dot, halftime is ink, and 4th down is heavier ink, not red. The red-zone ring and badge are the one other red there.
- **Pick fills**: each of the five pick tiles per row is tinted by result. Won is a pale green fill (`pick-won-fill`), lost is pale pink (`pick-lost-fill`), and open or TBD is pale blue (`pick-open-fill`). Once a game is final the tile gets a thin solid edge in the matching mid tone (`*-edge`). While it's live the edge is dashed and the text is italic.
- **Caution Orange** (`caution-orange`): warnings, and the shared theme's `Alert` (which paints every alert orange unless a component re-colors it by severity, as `AdminPanel` does).
- **Streak Flame** (`streak-flame`): the tint behind the weekly hot icon. The icons on the Week column's tinted tiles are darker so they reach 3:1: flame `#d84315`, snowflake `#0277bd`, even dot `#717a8a`. The hot-streak pill uses a deeper flame, `streak-pill` to `streak-pill-end`, so its white 12px text reaches 5.6:1 (the brighter flame was 2.7:1).
- **Selected Lime** (`selected-lime`): the selected player's row on User Picks and in the leader cards. It's pale yellow-green, so it reads as a highlighter mark, not as a status.
- **Box score pair**: `away-blue` and `home-orange` are fixed stat-bar colors for away and home in every game, chosen because team colors clashed (ARI/SF, BAL/DAL). `turf-green` is the Scoreboard field strip.
- **Team colors**: the logo fallback disc and the drive band use each team's own color from `team_data.json`, applied inline.

### The pool's color
- **Pool Violet** (`pool-violet`, the `pool` scale in `themePrimitives.ts`): anything that counts the pool's picks. The Pool and selected-player columns on Standings (tinted `pool-violet-tint`, headers in `pool-violet-ink`), "Times picked" bars on Trends › Season, the "Where the pool wins and loses" bars, both season charts, the team page's "The pool on them" card and its schedule's Pool bars. Violet because no status color sits near it, so it can't be misread as won, lost, open or honored. Marks use 500 (6.8:1 on white), text uses 700 (8:1 on the tint). Added 2026-10-02 (user's pick, option B of <https://claude.ai/artifact/5CabMDU8E5VD5zfvqR5eTT>); until then those spots were MUI blue or gray, and blue meant four things at once.
- **Team band**: a team page opens on its team's own color with white text and the alternate color as a 4px stripe under it (`teamBandColors` in `utils/teamAssets.ts`, which darkens light team colors such as NO, CIN and TEN until white text reads at 4.5:1, and swaps a white alternate for a darker shade). It's the one place a team color fills a surface; everywhere else team color stays in the logos.

### Neutral
- **Ink** (`ink`), **Muted Ink** (`ink-muted`), **Faint Ink** (`ink-faint`): primary, secondary and disabled text. Muted Ink (`text.secondary`) is by far the most used color in the components.
- **Paper** (`paper`) and **Hairline** (`hairline`): page background and every divider.
- **Slate scale** (`slate-*`, the `gray` scale in `themePrimitives.ts`): tab hover fills, chip fills, select borders, the default card fill and the contained button.

### Games palette
Games uses the app palette: its `--gc-*` CSS names in `gamesCard.css` all point at theme variables (`--template-palette-*`, since `AppTheme` sets `cssVarPrefix: "template"`) or the slate scale. Ink and muted ink for text, the divider for rules, white paper, slate-100 for chips and the wettest hourly tile. **Covered green** (`success.dark`, green-50 fill) is "Browns covered" and the final-score ✓, as on every tab. **Office blue** is only the "ATL edge" tag. **Caution** is the app's warning orange: an official weather alert is a solid orange flag with near-black ink (like the Scoreboard's "Close" flag), and a weather flag ("Gusts 22 mph", "↑ Rain 43% by 4PM") is an orange tint with dark amber ink (`#8a560a`, 5.4:1). Weather has no hue of its own: condition icons are muted ink. Line moves, venues and streaks are slate-100 chips (10px radius: a pill at one line); the Books button uses the outlined-button slate-50. The table sits on the page with no box and an untinted bold-ink header, like User Picks; phone cards are the Scoreboard's outlined card (divider border, 8px radius, 14px padding). Team colors appear only in logos. In the Books table the best offer per column is bold ink with one ✓, with no color: for a spread or total, the best point first and then the best price among books at that point (the Over is best at the lowest total, the Under at the highest); for a moneyline, the best price.

### Named Rules
**The Earned Color Rule.** Every color on the page says something: won, lost, open, honored, the pool, or a team. If a colored element isn't carrying one of those meanings, make it neutral.

**The Gold Is An Honor Rule.** Trophy gold marks champions, medals, 5-0 weeks and the Records tab, and nothing else. Never use it for a generic highlight or button.

**The Status Needs A Second Channel Rule.** Won/lost and covering/not colors always come with an icon, a word or an edge style (the check and ✕ on the your-pick badge; solid versus dashed pick edges), so meaning survives color blindness and bright sun.

## Typography

**Body Font:** Inter (with system-ui, -apple-system, Segoe UI, Roboto, sans-serif), loaded from Google Fonts.
One family everywhere, Games tab included.

**Character:** Inter is a friendly, even workhorse that keeps a dense table legible at 13–14px on a phone.

### Hierarchy
- **Headline** (600, 1.25rem): each tab's title, the `TabIntro` h2 ("Games · Week 4"). The site name in the header is deliberately quieter (700, 0.875rem). The theme's h1–h4 sizes (3rem–1.5rem) exist but aren't used on screen.
- **Title** (600, 1.125rem, h6 variant): section headings inside a tab (h3: "Season so far", "Champions", Admin groups), one step under the tab title. Scoreboard team abbreviations use this size in bold (data, not a heading).
- **Card title** (700, 0.875rem): h4 card and chart titles ("Popular picks"); body size, set apart by weight.
- **Body** (400, 0.875rem, 1.43): everything in tables, cards and panels. The theme sets both body1 and body2 to 14px.
- **Compact** (400, 0.8125rem): where 14px is a hair too wide: phone tabs, the header summary and its pick tiles from `lg` to `xl`, player names in the table.
- **Label** (500, 0.75rem): captions, column heads, chip labels, badge text, "Since week 10" subtitles.
- **Stat** (700, 1.75rem): the biggest type in the app, used for Scoreboard final totals (compact rows use the headline size, 1.25rem) and the one big number on each recap card (Records tiles use it too). The losing final score is set in muted ink (`text.secondary`, 4.6:1; it was faint `text.disabled`, 2.7:1, until 2026-10-02).
- **Small caps label** (600–700, 0.75rem, 0.04–0.07em tracking, uppercase): short labels over a number, such as Records tiles and the Games phone card's Open / Spread / Total / CBS Line. Column heads stay in sentence case (bold 0.75rem).

Nothing goes below 0.75rem (12px), including the Games hourly strip and the leader cards' place discs (a pill for "T12"). Every bare `<button>` (MUI ButtonBase) inherits the page font from the theme; browsers default buttons to Arial.

### Named Rules
**The Tabular Numbers Rule.** Any column of numbers (scores, places, spreads, percentages, records) uses tabular figures so digits line up down the table. Games sets it on the whole `.games-card`; Leaders and other score columns set `fontVariantNumeric: "tabular-nums"` locally. Signed numbers use a real minus (−, U+2212), because Inter's tabular hyphen sits in a digit-wide slot and reads as "- 3.5". Win-loss records ("2-1") are short labels, not a column, so they use proportional figures.

**The One Big Number Rule.** A stat card gets one big number (1.75rem) plus at most a short line. Nothing is larger than that: no display type, no hero banners.

## Layout

The page is one centered column: the header, then a row of route tabs (User Picks, Games, Scoreboard, Trends, then after a divider Records and, for the admin, Admin), then the tab's content. MUI's v2 `Grid` handles columns with breakpoints at `sm` 600, `md` 900, `lg` 1200 and `xl` 1536.

- **Header, desktop (`md` and up):** a small "Morlocked Pick'em" label (14px bold, with "Pick'em" in muted ink) on the left, then the browsed week's pick tiles, the Week pill and the player card. The player card is the player picker itself: avatar, name, "13th · 7 pts" (plus the 2nd-half place from week 10) and, after a divider, the money lines. From `md` to `lg` the pick tiles drop to their own row under the header.
- **Header, phones (under `md`):** no visible site name (it stays as a visually hidden h1, and every page's browser title is "User Picks · Morlocked Pick'em" and so on). One row holds a "Wk 3" pill and the player picker showing "Ryan Thornburg · **13th** · 7", then the pick tiles fill a row below. That's about 50px less header than a visible title row.
- The header is identical on every tab except Admin, Records included (its Week pill sets the week the header's picks and place are from).

- **User Picks** is a full-width table: place, name with badges, score, week form, then five pick tiles. On phones it switches to a separate `UserDataMobile` table with the picks stacked, and badges wrap under the name. The last refresh ("Updated 9:02 AM") sits at the right end of the desktop table's header row, and nowhere on phones, where the header row has no room for it. A failed refresh gets its own line above the table. Before the table loads there are skeleton rows; if it can't load, a bordered note says so and that it retries every minute. It's never a blank tab.
- **Past weeks** are in the URL (`?week=3`), and every weekly tab gets a quiet slate-50 notice under the tab row ("Week 3 · a past week, not this week" with a "Back to week 4" button), so old standings can't pass for this week's.
- **Scoreboard** uses two-column game cards on desktop and one on phones, or a compact list, grouped Live → Upcoming → Final, each in kickoff order, under the "Your picks" strip. Upcoming games are compact rows in both layouts: a card before kickoff only adds an empty linescore. The order never changes with game state or with who's selected.
- **Games** is a fixed-layout table with a horizontal scroll floor of 820px, which becomes a stacked card per game on phones.
- **Trends** uses rows of up to four cards on desktop, with the season team table at `lg: 8` beside the All Alone Log at `lg: 4`.
- Spacing uses MUI's 8px unit: 4px inside tight groups (pick tiles in the header), 8px between related items, 16px card padding, 24px between sections.

**The Fixed Order Rule.** Lists keep a stable order (kickoff time, place, name) so people know where to look. Draw attention with state (borders, badges, fills), never by re-sorting.

**The 360px Floor Rule.** Every screen must work at 360px wide with no horizontal page scroll. Wide tables scroll inside their own container, with the name or team column pinned.

## Elevation & Depth

The system is flat. `MuiPaper` defaults to elevation 0, and cards use a 1px hairline border with `boxShadow: "none"`. Depth comes from tone instead: white paper, a pale slate card fill (`slate-50`), and a tinted header row. The only real shadows are on things that float above the page.

### Shadow Vocabulary
- **Float** (`hsla(220, 30%, 5%, 0.07) 0px 4px 16px 0px, hsla(220, 25%, 10%, 0.07) 0px 8px 16px -5px`): dropdown menus and popovers (`MuiMenu`).
- **Popover** (MUI elevation 4–6): tooltips and the pick-split picker list.

### Named Rules
**The Flat Record Rule.** Nothing that is part of the record (tables, cards, tiles) casts a shadow at rest. Only things that float above it (menus, popovers, tooltips) do.

## Shapes

Gently rounded throughout (8px base radius from `shape.borderRadius`). Pick tiles and small tags are tighter (4–5px), alerts and table wrappers softer (10–12px), and the recap strip softest (20px), and chips and badges are full pills (999px). Avatars are circles, drawn as minidenticon patterns on a faint neutral tile.

State borders on the Scoreboard are rings, not stripes: amber for a close game late, a thicker amber with a glow for a close game ending, and red for the red zone, with only one ring at a time (close beats red zone). Compact rows use inset rings so the list container doesn't clip them.

One one-side accent exists on purpose: the 3px inset "you" marker on Records table rows. It marks identity (you), not decoration.

## Components

### Buttons
Quiet and tactile. Ripples are off everywhere; transitions are 100ms.
- **Shape:** gently rounded (8px), 40px tall (36px small).
- **Contained:** a near-black slate with a subtle top-to-bottom gradient and an inset highlight; flattens to slate-700 on hover.
- **Outlined:** a slate-50 fill with a slate-200 border; the fill darkens a step on hover.
- **Text:** muted ink, with a slate-100 fill on hover.
- **Focus:** a 3px outline at 50% of the primary color, offset 2px.

### Chips and badges
- **Theme chips:** pills with a 1px border and 600-weight 12px labels, 20px tall. Default is slate; success and error are pale green and pale red with dark text.
- **Name badges:** the tiny inline marks next to a player's name. Mover arrows (▲3 green, ▼4 red), the flame streak pill ("🔥 2 wks": the unit keeps it apart from the Week column's this-week flame), the gold trophy, the gold 5-0. They're friendly and small, and never louder than the name itself. Badge text is 12px. Every badge and Week-column icon explains itself on hover, on keyboard focus (the 3px brand ring) or on a tap, never only on hover. A "?" button in the Name header opens a key that draws each mark with its meaning.
- **Your picks strip (Scoreboard):** above the game list in both layouts, one chip per revealed pick in the list's order: the clock (with the live dot), "at BUF" / "vs NYJ" from `sm` up, the team with its line, and the margin in words. Chips use the your-pick badge's tint and ink (no ring before kickoff), plus the amber 2px ring when the game is close. A tally line sits on the heading row ("2 won · 1 covering · 3 not covering"). One row on desktop; on phones the chips scroll sideways. Tapping one scrolls to and focuses that game. It replaced the "My picks first" switch, so the list order never changes.
- **Your-pick badge (Scoreboard):** a pill colored by result, with an icon and the margin in words: "Covering by ½", "Needs 4 to cover", "Won by 3½", "Lost by ½" (compact rows: "You: NE · by ½", "needs 4", "won"). Green with a trend-up or check, red with a trend-down or ✕, a push neutral grey with a dash (nobody won or lost it), not started plain blue. The ATS tag next to the covering team says the same ("✓ Covering by 3½", "✓ Covered by 27½" once final, in neutral grey), and "✓ by 3½" on compact rows, where the margin is shown from `lg` up and visually hidden below. Scoreboard tags and flags ("Close", "Red zone", "Upset of the week") are 12px sentence case.

### Pick tiles
The signature element of the app: five small rounded rectangles, one per pick, holding the team abbreviation. 70px wide in the table and 48px in the header at `lg` and up; 60px, with 12px text, on phones. The fill carries the result; the edge carries the game's state (none before kickoff, dashed and italic while live, solid when final). A small icon after the abbreviation repeats the result for anyone who can't rely on color: ✓ won, ✕ lost, and while live the Scoreboard's trend arrows for covering and not covering. Visually hidden text gives screen readers the same ("NYJ, won"). Two or more hidden picks merge into one quiet "Hidden until kickoff" tile, in the header and the table: in table rows it fills the rest of the row so the columns still line up (after a shown pick: "PIT ✕ · Hidden until kickoff"). No count, since CBS lets a player save fewer than five picks. Its tooltip and screen-reader text say each pick shows at its game's kickoff or the Sunday 1 PM ET deadline, whichever comes first. A lone hidden pick stays a TBD tile.

### Cards / Containers
- **Corner style:** 8px.
- **Background:** slate-50 by default, white for the outlined variant.
- **Shadow strategy:** none (see Elevation & Depth).
- **Border:** 1px hairline.
- **Internal padding:** 16px, with a 16px gap.

### Inputs / Fields
The Week pill and the player picker are the only inputs. Both are outlined selects on paper with a slate-200 border, a faint inset highlight, and an up-down chevron icon, 40px tall. The border darkens a step on hover and to slate-400 on focus. The Week select is a full pill (999px) reading "Week 3" ("Wk 3" on phones). The player picker has no visible label (its accessible name is "Player"); on desktop it's a 10px-rounded card holding the selected player's summary and money lines, and on phones a one-line select with place and score after the name.

### Navigation
The tabs are real routes, and switching tabs always starts the new one at its top.

- **Desktop (`md` and up):** a tab row under the header. Each tab is text-only, 6px 8px padding, in muted ink, and gets a slate-100 fill with a slate-200 border on hover. The selected tab is dark ink with a dark underline indicator. **Records** sits after a vertical divider in Deep Trophy Gold with a trophy icon. **Admin** sits after its own divider in warning color with a shield icon. "CBS Pool ↗" is on the right. Once the header scrolls away the row sticks to the top of the window, reaching into the page margins, with the float shadow and a muted "Week 3 · Ryan Thornburg · **13th**" before CBS Pool, so the week and player never leave the screen.
- **Phones (under `md`):** a bottom tab bar, fixed to the screen's bottom edge above the safe area: 60px tall, one equal column per tab, each a 22px icon over a 12px label (Picks, Games, Live, Trends, Records, plus Admin for the admin). The selected tab is dark ink, bold, with a slate-100 pill behind its icon; the rest are muted ink, Records stays Deep Trophy Gold, and Admin stays warning color. "Live" carries the red dot while a game is on. The bar has a hairline top border and the upward float shadow, and the page leaves room for it at the bottom. The CBS link becomes a 36px icon button at the end of the header row.

### Leader cards
From the second-half start week only, two cards: Overall and 2nd half. There are none before then, since the table with its paid lines already shows the same standings. Each row is a medal tile (gold, silver, bronze, then a neutral place number), the avatar and name, and the score with a green "+N" for picks covering now. No gap to 1st: the order already shows who's ahead. The selected player's row uses Selected Lime, and they get their own row below a "···" if they're outside the paid places.

### Paid lines
A dashed 1.5px rule in Deep Trophy Gold under the last paid place, with a small 12px gold label on the right ("Paid · top 5 overall (8 with the tie)"). In the User Picks table it appears only in rank order: by place (overall, plus the 1st half until the 2nd half starts, since both rank the same points) or by 2nd-half place. Everyone tied at a cutoff sits above the line. The place column marks 1st–3rd with the leader cards' gold, silver and bronze medals; other places are plain numbers, since the line, not the marker color, says who's paid. A gold "?" after the label opens "How prizes work" (`PrizesHelp`): 1 point per pick that covers the CBS line, each prize's span and paid places from meta, and that ties split a place's prize. CBS lines are always half points, so pushes aren't mentioned.

### Money standing
Shown only for prizes the selected player is in, or within reach of. Within reach means a gap of at most `round(1.6 × √weeks left)` points (`MONEY_REACH_PTS` in `usersTableUtils.ts`): 4 pts with 6 weeks left, 2 with 1. Weeks left count the browsed week until all its games are final; the 1st half ends the week before `second_half_start_week`, and the 2nd half and overall end at `REGULAR_SEASON_WEEKS` (18). A prize out of reach is left out rather than reported as "N pts out", so someone far back sees just their place. It's measured on the same displayed scores and ranks as the paid lines, and tying the last paid score counts as in.

- **Desktop:** inside the player card, one line per prize: "1st half **3 pts out** · 6 wks left", "Overall **In the money** · top 5". "In the money" is Deep Trophy Gold; a gap is bold ink. The words carry the meaning, not the color.
- **Phones (and the 600–899px table):** on the gold paid line it's measured against, as a small Selected Lime note under the line's label ("you're 3 pts back"). While the player's own row is scrolled out of view, a copy of it sticks to the bottom of the screen in Selected Lime with the float shadow (upward), plus the one prize most worth a note ("In the overall money", else the closest chase, "2 pts to the overall money"). Tapping it scrolls to the real row.

### Recap strip
A well-rounded (20px) bar at the top of User Picks that rotates the week's recap headlines (week stats like pool accuracy wait for `MIN_WEEK_STAT_FINALS` finals, everywhere recap items show), with a category icon, a "This week" tag ("Week 3" on a past week) and a dot pager. It pauses on hover, focus or tap. Screen readers hear a headline only after a manual step, not on every rotation, and the dots stay out of the tab order (Previous and Next are the keyboard path).

### Records page
Ordered as a trophy room: the selected player's line first (Selected Lime with the 3px blue edge: "**8th** all-time · 35 pts · best 4th (2018, 2022) · 10 seasons · avg finish 9.0"), then every champion at once (a tile grid from `sm`, newest first, the defending champion's tile in pale gold with a gold "Defending" tag, unknown seasons hatched; a plain list on phones), then "Every season" tables opening on Finishes by year, then six record tiles. All-time rank is top-10 points: 10 for a title, 9 for 2nd, down to 1 for 10th, summed over every season; the rule is spelled out above the All-time table. The Finishes grid uses the leader cards' gold, silver and bronze for 1st–3rd, a slate tile for 4th–5th, bold numbers for 6th–10th and muted ones below; blue stays out of it. Seasons missing players are hatched, with the row's lime still showing through. Caveats sit where they apply as plain muted lines, never an orange alert.

### Team mark
Every tab draws a team the same way: the logo (`components/shared/TeamLogo.tsx`, a team-color disc with the abbreviation if a logo is missing), the abbreviation in bold, then the nickname muted where space allows. Sizes follow the context (16–30px logos). User Picks' pick tiles are the exception on purpose: their fill is the pick's result, not the team. When the abbreviation sits beside the logo, the logo is decorative (empty alt) so it isn't read twice.

### Weather wording
One order and wording everywhere, from `utils/weatherText.ts`: "68°F · Partly cloudy · Wind 5 mph SSW · Precip 0%". Conditions are sentence case (the feed sends Title Case), units take a space. Games shows the temperature as its own link and the condition and wind under it (each part kept whole; phone cards stack them); Scoreboard's pregame line prefixes "Forecast:", and the live line "Now:" without precip.

### Games table
The table sits on the page with no wrapper, and its header row is untinted bold 12px ink, like User Picks. Teams use the app-wide team mark (logo, bold abbreviation, muted nickname; see Team mark). Weather flags are small caution chips (an orange tint, or solid orange for an official alert) in sentence case, label then number ("High wind 22 mph", "Precip 60%"; visibility only at dense-fog levels, ¼ mile or less), on their own full-width line under the conditions and the hourly strip, and there's an hourly strip of time, icon and precipitation per hour, with no box behind each hour: only the wettest hour gets a slate tile. A precipitation flag shows only when there's no hourly strip, since the strip already shows the wettest hour. Lines always name the favorite ("PIT −3", "Pick'em" at 0), never a bare home-side number. **CBS line** comes first and biggest (1.125rem bold), since it's the line the pool scores against, with "Falcons covered" (the nickname: "NO covered" read as "no one covered") or "Push" once final and an "ATL edge 2" tag; cover streaks read "▲ BUF: 3 straight covers" / "▼ PHI: 3 straight without a cover"; (points easier, in the tag so phones see it) when CBS is 1+ point easier on a side than Vegas. **Vegas** follows as the comparison: current line, "Opened …" only when the open differs from the current line, a "Moved 4.5 to ARI" badge on 2+ point moves, then "O/U 44.5 · Over". On phones the CBS line block sits between the teams and the weather, with Vegas as one line under it, and kickoff reads "Sun 1:00 PM" over the network, as on desktop (no month and day; every game is in the browsed week). No legend: every label explains itself. The table only shows from 1180px; below that the CBS line wraps and the weather text runs under the hourly strip. Below 1180px Games uses phone-width cards (about 310–420px): one per row under 700px, two from 700px, three from 1000px, with Books pinned to the bottom so cards in a row line up. In the weather cell the conditions cap at 15rem, so on wide screens the hourly strip sits right after them; when fewer than 6rem would be left for the conditions (320px phones, or a 5–6 hour strip) the strip wraps onto its own line, and a strip wider than the whole cell scrolls inside it. On the cards, Books opens as one small table per bet type (Moneyline, Spread, Total) with the books down the side, so nothing scrolls sideways. Only the temperature (or the roof label) links to the forecast, as a 24px-tall target; the phone Books control is a plain 44px row on the card's bottom divider (no fill, so it doesn't outweigh the CBS line); Games buttons and links use the app's 3px solid brand-blue focus ring (4.9:1 on white; it was 50% alpha, 2.2:1, until 2026-09-30). A muted "Odds updated Wed, Sep 30, 9:47 PM" line sits above the table, from the odds feed's `updated_at`. A game with no book data shows "No books" on desktop and no Books row on phones; an open-air game with no saved forecast says "No forecast" with no link. If the week's games fail to load, the tab says so and retries on the next poll instead of spinning. The Games tab is for pregame and odds research only: no pool picks or "you" markers here (those live on User Picks and Scoreboard).

## Do's and Don'ts

### Red And Green Mean Picks
Red and green are for pick results only (won/lost, covering/not covering), plus the mover arrows. Everything else that only compares (team streaks, the pool's split rates against 50%, how often a team was picked, the pool split bar) is neutral: `text.secondary` fills, `text.disabled` for the smaller side, slate chips. Team colors stay in logos and the drive band, not in bars, where TB would read as red and PIT as black.

### Freshness
User Picks shows "Updated 7:19 PM" in the desktop table header only (the user's call) and a "Couldn't refresh…" line when a poll fails. The Scoreboard shows the same note on its tab intro at every width, but only while a game is live or after a failed refresh; on a quiet day it shows nothing.

### Do:
- **Do** keep the record in tables on white paper with hairline dividers; use cards for grouped secondary content.
- **Do** reserve green, red and pale blue for pick results and live state, and pair them with an icon, word or edge style.
- **Do** use Trophy Gold only for honors: champions, medals, 5-0, Records.
- **Do** use tabular numbers in every numeric column.
- **Do** keep list orders fixed and signal state with rings, badges and fills.
- **Do** check every screen at 360px, with wide tables scrolling inside their container.
- **Do** put layout values in `sx` (MUI v9 removed system props).
- **Do** check dark styling with `theme.applyStyles("dark", …)`, not `theme.palette.mode`, if dark mode is ever enabled.

### Don't:
- **Don't** add resting shadows to cards, tiles or tables.
- **Don't** use gold as a general accent or button color.
- **Don't** re-sort games or players by how close or dramatic they are.
- **Don't** set type larger than 1.75rem, or put more than one big number on a stat card.
- **Don't** bring a second font family or a tab-only palette back to any tab; Games' `--gc-*` names must keep pointing at theme tokens.
- **Don't** use a colored side stripe as decoration on cards, list items or alerts. The Records "you" edge is the only exception.
