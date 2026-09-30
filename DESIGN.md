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
  trophy-gold-deep: "#a87f12"
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
  slate-900: "hsl(220, 35%, 3%)"
  slate-700: "hsl(220, 20%, 25%)"
  slate-200: "hsl(220, 20%, 88%)"
  slate-100: "hsl(220, 30%, 94%)"
  slate-50: "hsl(220, 35%, 97%)"
  gc-bg: "#f4f5f8"
  gc-surface-2: "#eef0f5"
  gc-border: "#dde1e9"
  gc-text: "#171b26"
  gc-text-muted: "#626c82"
  gc-amber: "#a5680f"
  gc-amber-soft: "#f4e6cc"
  gc-weather-teal: "#1f7a8c"
  gc-weather-soft: "#dcf0f3"
  gc-danger: "#b5342a"
  gc-good: "#2f7a3d"
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
  gc-body:
    fontFamily: "Public Sans, system-ui, -apple-system, sans-serif"
    fontSize: "0.88rem"
    fontWeight: 400
    fontFeature: "tnum"
  gc-label:
    fontFamily: "Oswald, Public Sans, system-ui, sans-serif"
    fontSize: "0.72rem"
    fontWeight: 500
    letterSpacing: "0.06em"
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
  gc-team-chip:
    backgroundColor: "{colors.gc-surface-2}"
    textColor: "{colors.gc-text}"
    rounded: "{rounded.sm}"
    padding: "2px 7px"
---

# Design System: Morlocked Pick'em

## Overview

**Creative North Star: "The League Office"**

This is where the pool's record gets kept. It should feel like the back office of a club that's been running since 2013: calm and correct about the numbers, but warm, with trophies on the shelf. The standings, the picks and the box scores are the official record, so they sit on plain white paper in tidy tables with hairline rules. The warmth comes from the clubhouse details around that record: a gold trophy for the defending champ, medal tiles for the paid places, a small flame for a hot streak, a gold 5-0.

Density is high but never cramped. A player should be able to find their row, their five picks and their place in one glance on a phone during a Sunday game. Color is reserved for meaning. Green and red say won or lost (or covering or not, while a game is live), blue says not decided yet, and gold says honor. Everything else is ink on paper.

There are two dialects today, and this file records both without choosing between them. Most of the app speaks **Office**: Inter on MUI's light theme, neutral chrome and MUI's default blue as the accent. The Games tab speaks **Kickoff Board**, ported from an earlier mockup: Public Sans for body, Oswald for small-caps column heads, tabular numbers, a warm amber accent and a teal for weather, all scoped under `.games-card` with its own `--gc-*` custom properties.

**Key Characteristics:**
- White paper, hairline dividers, no resting shadows.
- Tables are the primary container; cards group secondary things.
- Color means state (won, lost, open, honored), never decoration.
- Gold is the clubhouse color: trophies, medals, 5-0, the Records tab.
- Friendly details (identicon avatars, pill badges, medal tiles) live at the edges of the record, not in it.
- Light only. `themePrimitives.ts` defines dark schemes, but they aren't wired in.

## Colors

The palette is ink on white paper, a traffic-light status set for results, and one warm gold for honors.

**Where these values come from:** `AppTheme.tsx` only passes `palette: { mode: "light" }` to `createTheme`, so the live `theme.palette` is MUI's default light palette. `themePrimitives.ts` has a full custom palette (`brand`, `gray`, `green`, `orange`, `red`), but it only shows up where a component override imports those scales directly (buttons, tabs, chips, selects, cards). The frontmatter lists the values that actually render.

### Primary
- **Office Blue** (`office-blue`): MUI's default primary. It's used sparingly: the inset 3px marker on the "you" row in Records tables, focus rings, and links. It isn't a brand color, just the default accent the app inherited.

### Secondary
- **Trophy Gold** (`trophy-gold`): honors only. The defending champion's trophy, the 1st-place medal tile, the "▲ Highest score" champion badge, the gold 5-0 name badge, and chart highlights for perfect weeks. **Deep Trophy Gold** (`trophy-gold-deep`) is the text-safe version, used on the Records tab label and icon.
- **Medal Silver** (`medal-silver`) and **Medal Bronze** (`medal-bronze`): 2nd- and 3rd-place tiles on the leader cards, with dark text for contrast.

### Tertiary (status)
- **Covered Green** (`covered-green`) and **Missed Red** (`missed-red`): won or lost, covering or not. Used in the your-pick badge, the pick-split bar, ATS tags and fourth-down text.
- **Pick fills**: each of the five pick tiles per row is tinted by result. Won is a pale green fill (`pick-won-fill`), lost is pale pink (`pick-lost-fill`), and open or TBD is pale blue (`pick-open-fill`). Once a game is final the tile gets a thin solid edge in the matching mid tone (`*-edge`). While it's live the edge is dashed and the text is italic.
- **Caution Orange** (`caution-orange`): warnings, and the shared theme's `Alert` (which paints every alert orange unless a component re-colors it by severity, as `AdminPanel` does).
- **Streak Flame** (`streak-flame`): the weekly hot icon. The hot-streak pill uses a deeper flame, `streak-pill` to `streak-pill-end`, so its white 11px text reaches 5.6:1 (the brighter flame was 2.7:1).
- **Selected Lime** (`selected-lime`): the selected player's row on User Picks and in the leader cards. It's pale yellow-green, so it reads as a highlighter mark, not as a status.
- **Box score pair**: `away-blue` and `home-orange` are fixed stat-bar colors for away and home in every game, chosen because team colors clashed (ARI/SF, BAL/DAL). `turf-green` is the Scoreboard field strip.
- **Team colors**: logos, the Games team chips and the drive band use each team's own color from `team_data.json`, applied inline.

### Neutral
- **Ink** (`ink`), **Muted Ink** (`ink-muted`), **Faint Ink** (`ink-faint`): primary, secondary and disabled text. Muted Ink (`text.secondary`) is by far the most used color in the components.
- **Paper** (`paper`) and **Hairline** (`hairline`): page background and every divider.
- **Slate scale** (`slate-*`, the `gray` scale in `themePrimitives.ts`): tab hover fills, chip fills, select borders, the default card fill and the contained button.

### Kickoff Board palette (Games tab only)
Warm slate paper (`gc-bg`) with white table surfaces, a cooler tinted header row (`gc-surface-2`), and near-black ink (`gc-text`) with muted slate (`gc-text-muted`). **Amber** (`gc-amber`, with `gc-amber-soft` fills) flags weather gusts and precipitation; **Weather Teal** (`gc-weather-teal`) marks line movement and the hourly strip; **Danger Brick** (`gc-danger`) is official weather alerts and miss streaks; **Good Green** (`gc-good`) marks covered finals and cover streaks.

### Named Rules
**The Earned Color Rule.** Every color on the page says something: won, lost, open, honored, or a team. If a colored element isn't carrying one of those meanings, make it neutral.

**The Gold Is An Honor Rule.** Trophy gold marks champions, medals, 5-0 weeks and the Records tab, and nothing else. Never use it for a generic highlight or button.

**The Status Needs A Second Channel Rule.** Won/lost and covering/not colors always come with an icon, a word or an edge style (the check and ✕ on the your-pick badge; solid versus dashed pick edges), so meaning survives color blindness and bright sun.

## Typography

**Body Font:** Inter (with system-ui, -apple-system, Segoe UI, Roboto, sans-serif), loaded from Google Fonts.
**Games tab:** Public Sans for body, Oswald for column heads and labels.

**Character:** Inter is a friendly, even workhorse that keeps a dense table legible at 13–14px on a phone. On the Games tab, Oswald's condensed uppercase heads give the sheet a sports-page, betting-board voice over Public Sans's plain body.

### Hierarchy
- **Headline** (600, 1.25rem, h5): the app title "Morlocked Pick'em" and section heads. The theme's h1–h4 sizes (3rem–1.5rem) exist but aren't used on screen.
- **Title** (600, 1.125rem): card titles such as "Week N recap" and the leader cards.
- **Body** (400, 0.875rem, 1.43): everything in tables, cards and panels. The theme sets both body1 and body2 to 14px.
- **Compact** (400, 0.8125rem): where 14px is a hair too wide: phone tabs, the header summary and its pick tiles from `lg` to `xl`, player names in the table.
- **Label** (500, 0.75rem): captions, column heads, chip labels, badge text, "Since week 10" subtitles.
- **Stat** (700, 1.75rem): the biggest type in the app, used for Scoreboard final totals and the one big number on each recap card (Records tiles use 1.6rem). The losing score is set in faint ink.
- **Games label** (Oswald 500, 0.72rem, 0.06em tracking, uppercase): Games tab column heads.

### Named Rules
**The Tabular Numbers Rule.** Any column of numbers (scores, places, spreads, percentages, records) uses tabular figures so digits line up down the table. Games sets it on the whole `.games-card`; Leaders and other score columns set `fontVariantNumeric: "tabular-nums"` locally.

**The One Big Number Rule.** A stat card gets one big number (1.75rem) plus at most a short line. Nothing is larger than that: no display type, no hero banners.

## Layout

The page is one centered column: the header (title, the selected player's summary with their five pick tiles, then the Week and User dropdowns), then a row of route tabs (User Picks, Games, Scoreboard, Trends, then after a divider Records and, for the admin, Admin), then the tab's content. MUI's v2 `Grid` handles columns with breakpoints at `sm` 600, `md` 900, `lg` 1200 and `xl` 1536.

- **User Picks** is a full-width table: place, name with badges, score, week form, then five pick tiles. On phones it switches to a separate `UserDataMobile` table with the picks stacked, and badges wrap under the name.
- **Scoreboard** uses two-column game cards on desktop and one on phones, or a compact list, grouped Live → Upcoming → Final, each in kickoff order. The order never changes with game state.
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

Two one-side accents exist on purpose: the 3px inset "you" marker on Records table rows, and the 3px team-color edge on the Games team chip. Both mark identity (you, a team), not decoration.

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
- **Name badges:** the tiny inline marks next to a player's name. Mover arrows (▲3 green, ▼4 red), the flame streak pill, the gold trophy, the gold 5-0. They're friendly and small, and never louder than the name itself.
- **Your-pick badge (Scoreboard):** a pill colored by result, with an icon. Covering or won is green with a trend-up or check; not covering or lost is red with a trend-down or ✕; a push is amber with a dash; not started is plain blue.

### Pick tiles
The signature element of the app: five small rounded rectangles, one per pick, holding the team abbreviation. 70px wide in the table and 48px in the header at `lg` and up; 60px, with 12px text, on phones. The fill carries the result; the edge carries the game's state (none before kickoff, dashed and italic while live, solid when final). A small icon after the abbreviation repeats the result for anyone who can't rely on color: ✓ won, ✕ lost, and while live the Scoreboard's trend arrows for covering and not covering. Visually hidden text gives screen readers the same ("NYJ, won").

### Cards / Containers
- **Corner style:** 8px.
- **Background:** slate-50 by default, white for the outlined variant.
- **Shadow strategy:** none (see Elevation & Depth).
- **Border:** 1px hairline.
- **Internal padding:** 16px, with a 16px gap.

### Inputs / Fields
The Week and User dropdowns are the only inputs. They're outlined selects on paper with a slate-200 border, a faint inset highlight, and an up-down chevron icon. The border darkens a step on hover and to slate-400 on focus.

### Navigation
The tabs are real routes. Each tab is text-only, 6px 8px padding, in muted ink, and gets a slate-100 fill with a slate-200 border on hover. The selected tab is dark ink with a dark underline indicator. **Records** sits after a vertical divider in Deep Trophy Gold with a trophy icon, and becomes icon-only on phones. **Admin** sits after its own divider in warning color with a shield icon. On phones, "User Picks" reads "Picks" and tabs are 13px.

### Leader cards
Before the second-half start week, one "Leaders" card lists everyone through the overall paid places with both cutoff lines (1st-half and overall standings are the same points until then). From the second-half start week, two cards: Overall and 2nd half. Each row is a medal tile (gold, silver, bronze, then a neutral place number), the avatar and name, the score with a green "+N" for picks covering now, and the gap to 1st. The selected player's row uses Selected Lime, and they get their own row below a "···" if they're outside the paid places.

### Paid lines
A dashed 1.5px rule in Deep Trophy Gold under the last paid place, with a small 12px gold label on the right ("Paid · top 5 overall (8 with the tie)"). In the User Picks table it appears only in rank order: by place (overall, plus the 1st half until the 2nd half starts, since both rank the same points) or by 2nd-half place. Everyone tied at a cutoff sits above the line. The weeks 1–9 leader card draws the same lines ("1st half pays top 3", "Overall pays top 5"). The place column marks 1st–3rd with the leader cards' gold, silver and bronze medals; other places are plain numbers, since the line, not the marker color, says who's paid.

### Recap strip
A well-rounded (20px) bar at the top of User Picks that rotates the week's recap headlines, with a category icon, a "This week" tag and a dot pager. It pauses on hover or tap.

### Kickoff Board table (Games)
White table in a 12px rounded wrapper with a 1px border. The header row is tinted, with Oswald uppercase labels. Team chips are 5px-rounded with a team-color edge and a 14% team-color fill. Weather flags are small amber or brick pills, and there's an hourly strip of time, icon and precipitation tiles.

## Do's and Don'ts

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
- **Don't** mix the Kickoff Board fonts and `--gc-*` tokens into other tabs, or Inter into `.games-card`, without deciding to unify the two dialects first.
- **Don't** use a colored side stripe as decoration on cards, list items or alerts. The two identity markers (the Records "you" edge and the Games team-chip edge) are the only exceptions.
