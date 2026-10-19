import { readFileSync } from "node:fs";
import { join } from "node:path";
import { focusRingColor, pool } from "./palette";

// palette.ts repeats a few tokens for code that draws SVG; the two must not
// drift apart.
const css = readFileSync(join(__dirname, "tokens.css"), "utf8");
const declared = new Map(
  [...css.matchAll(/--([a-z0-9-]+):\s*([^;]+);/g)].map(([, name, value]) => [
    name,
    value.trim(),
  ])
);

describe("palette.ts", () => {
  it("matches tokens.css' pool scale", () => {
    for (const [step, value] of Object.entries(pool)) {
      expect(declared.get(`pool-${step}`)).toBe(value);
    }
  });

  it("uses --brand-500 for the focus ring", () => {
    expect(declared.get("brand-500")).toBe(focusRingColor);
  });
});
