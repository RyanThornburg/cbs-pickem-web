// The few tokens.css colors that are needed in JavaScript: SVG drawing
// attributes (the Season charts) can't read CSS variables. tokens.test.ts
// checks they match tokens.css.

// The pool's own color (--pool-*): anything that counts the pool's picks
// (Pool columns, how often the pool picked a team, the pool's charts).
// Violet because no status color is near it: green won, red lost, blue not
// decided yet, gold honors. 500 is for marks (6.8:1 on white), 700 for text
// (8:1 on the 50 tint).
export const pool = {
  50: "#f4f2fd",
  100: "#e7e2fa",
  200: "#d9d2f6",
  500: "#5b45c2",
  700: "#4a36a8",
};

// The app-wide keyboard focus ring: solid brand blue (--brand-500).
export const focusRingColor = "hsl(210, 98%, 42%)";
