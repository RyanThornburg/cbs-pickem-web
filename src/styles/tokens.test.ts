import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  brand,
  gray,
  green,
  orange,
  pool,
  red,
} from "../dashboard/shared-theme/themePrimitives";

// tokens.css repeats the theme's scales for the components written without
// MUI. Until the theme is gone, the two must not drift apart.
const css = readFileSync(join(__dirname, "tokens.css"), "utf8");
const declared = new Map(
  [...css.matchAll(/--([a-z0-9-]+):\s*([^;]+);/g)].map(([, name, value]) => [
    name,
    value.trim(),
  ])
);

describe("tokens.css", () => {
  it.each(Object.entries({ brand, gray, green, orange, red, pool }))(
    "matches themePrimitives' %s scale",
    (scale, steps) => {
      for (const [step, value] of Object.entries(steps)) {
        expect(declared.get(`${scale}-${step}`)).toBe(value);
      }
    }
  );
});
