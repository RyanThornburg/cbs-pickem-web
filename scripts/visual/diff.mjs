// Pixel-diffs two folders of screenshots from snap.mjs and writes a diff
// image for every page that changed (changed pixels in red).
//
//   node scripts/visual/diff.mjs .visual/main .visual/after
//
// Compares the pages in the after folder (a `--pages` run shoots only
// some), each against its baseline. Exits 1 when any page differs, so a
// step that should look identical can be checked in one command.
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { join, resolve } from "node:path";
import pixelmatch from "pixelmatch";
import { PNG } from "pngjs";

const [before, after, outArg] = process.argv.slice(2);
if (!before || !after) {
  console.error(
    "usage: node scripts/visual/diff.mjs <before dir> <after dir> [diff dir]"
  );
  process.exit(2);
}
const out = resolve(outArg ?? join(after, "../diff"));
mkdirSync(out, { recursive: true });

let changed = 0;
for (const file of readdirSync(after)
  .filter((f) => f.endsWith(".png"))
  .sort()) {
  const basePath = join(before, file);
  if (!existsSync(basePath)) {
    console.log(`NO BASE  ${file}`);
    changed++;
    continue;
  }
  const a = PNG.sync.read(readFileSync(basePath));
  const b = PNG.sync.read(readFileSync(join(after, file)));
  // Pages of different heights are compared over the taller one, so extra
  // or missing content counts as changed.
  const width = Math.max(a.width, b.width);
  const height = Math.max(a.height, b.height);
  const pad = (png) => {
    if (png.width === width && png.height === height) return png.data;
    const padded = new PNG({ width, height });
    PNG.bitblt(png, padded, 0, 0, png.width, png.height, 0, 0);
    return padded.data;
  };
  const diff = new PNG({ width, height });
  const pixels = pixelmatch(pad(a), pad(b), diff.data, width, height, {
    threshold: 0.1,
  });
  const sized =
    a.height !== b.height || a.width !== b.width
      ? ` (size ${a.width}x${a.height} -> ${b.width}x${b.height})`
      : "";
  if (pixels === 0 && !sized) {
    console.log(`same     ${file}`);
    continue;
  }
  changed++;
  writeFileSync(join(out, file), PNG.sync.write(diff));
  const share = pixels / (width * height);
  // Text can rasterize a hair differently between two runs of the same
  // build (seen up to ~0.1% of a page, on a few words), so small diffs are
  // labelled for a look at the diff image rather than read as a change.
  const label = !sized && share < 0.001 ? "SMALL   " : "CHANGED ";
  console.log(
    `${label} ${file}: ${pixels} px (${(100 * share).toFixed(3)}%)${sized}`
  );
}
console.log(
  changed
    ? `\n${changed} page(s) differ; diffs in ${out}`
    : "\nAll pages identical."
);
process.exit(changed ? 1 : 0);
