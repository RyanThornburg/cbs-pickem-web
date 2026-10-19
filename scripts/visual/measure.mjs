// Prints the box and key computed styles of matching elements in a build,
// against the same recorded data and frozen clock as snap.mjs. Run it on
// two builds to see why a diff.mjs page changed (an extra pixel of padding,
// a letter-spacing MUI didn't actually set, a color that stopped matching).
//
//   node scripts/visual/measure.mjs --dist .visual/dist-main --path /picks \
//     --selector '[role=alert] button' --width 360 [--fail '/leaderboard$']
//   node scripts/visual/measure.mjs --dist build --path /picks --selector ...
//
// --port picks the preview port (default 3480), --admin serves the made-up
// admin data.
import { spawn } from "node:child_process";
import { readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join, resolve } from "node:path";
import { chromium } from "playwright";
import { adminRoster, adminStatus } from "./adminFixtures.mjs";

const args = Object.fromEntries(
  process.argv
    .slice(2)
    .map((arg, i, all) =>
      arg.startsWith("--")
        ? [
            arg.slice(2),
            all[i + 1]?.startsWith("--") ? true : (all[i + 1] ?? true),
          ]
        : []
    )
    .filter((pair) => pair.length)
);
const ROOT = resolve(import.meta.dirname, "../..");
const fixtures = JSON.parse(
  readFileSync(join(ROOT, ".visual/fixtures.json"), "utf8")
);
const now = new Date(fixtures.recordedAt);
const PORT = String(args.port ?? 3480);
const width = Number(args.width ?? 360);
const fail = typeof args.fail === "string" ? new RegExp(args.fail) : null;

const server = spawn(
  join(ROOT, "node_modules/.bin/vite"),
  [
    "preview",
    "--outDir",
    resolve(ROOT, args.dist ?? "build"),
    "--port",
    PORT,
    "--strictPort",
  ],
  { cwd: ROOT, stdio: ["ignore", "pipe", "inherit"] }
);
await new Promise((ready) =>
  server.stdout.on("data", (chunk) => String(chunk).includes(PORT) && ready())
);
const browser = await chromium.launch({
  executablePath:
    process.env.PW_CHROMIUM ??
    join(
      homedir(),
      ".cache/ms-playwright/chromium_headless_shell-1187/chrome-linux/headless_shell"
    ),
});
try {
  const context = await browser.newContext({
    viewport: { width, height: 900 },
    isMobile: width < 900,
    hasTouch: width < 900,
    reducedMotion: "reduce",
  });
  await context.clock.setFixedTime(now);
  await context.addInitScript((user) => {
    if (sessionStorage.getItem("measure-ready")) return;
    localStorage.clear();
    sessionStorage.setItem("measure-ready", "1");
    if (user) localStorage.setItem("user", user);
  }, args.user ?? "35");
  await context.route(
    (url) => new URL(url).pathname.startsWith("/api/"),
    (route) => {
      const url = new URL(route.request().url());
      const json = (body) =>
        route.fulfill({
          status: 200,
          body: JSON.stringify(body),
          headers: { "content-type": "application/json" },
        });
      if (url.pathname.startsWith("/api/admin")) {
        if (!args.admin) return route.fulfill({ status: 401 });
        if (url.pathname === "/api/admin/me") return json({ ok: true });
        if (url.pathname === "/api/admin/status") return json(adminStatus(now));
        const roster = url.pathname.match(/roster\/(\d+)$/);
        if (roster) return json(adminRoster(Number(roster[1]), now));
        return route.fulfill({ status: 404 });
      }
      if (fail?.test(url.pathname)) return route.fulfill({ status: 500 });
      const saved = fixtures.responses[url.pathname + url.search] ?? {
        status: 404,
        body: "",
      };
      return route.fulfill({
        status: saved.status,
        body: saved.body,
        headers: { "content-type": "application/json" },
      });
    }
  );
  const page = await context.newPage();
  await page.goto(`http://localhost:${PORT}${args.path ?? "/picks"}`);
  await page.waitForLoadState("networkidle", { timeout: 8000 }).catch(() => {});
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(800);
  const rows = await page.evaluate(
    (selector) =>
      [...document.querySelectorAll(selector)]
        .filter((el) => el.getClientRects().length > 0)
        .map((el) => {
          const r = el.getBoundingClientRect();
          const c = getComputedStyle(el);
          return {
            el: `${el.tagName.toLowerCase()} "${el.textContent.trim().slice(0, 24)}"`,
            box: `${r.x.toFixed(2)},${r.y.toFixed(2)} ${r.width.toFixed(2)}x${r.height.toFixed(2)}`,
            font: `${c.fontSize}/${c.lineHeight} ${c.fontWeight} ls:${c.letterSpacing}`,
            color: c.color,
            bg: c.backgroundColor,
            pad: c.padding,
            margin: c.margin,
            border: `${c.borderTopWidth} ${c.borderTopStyle} ${c.borderTopColor}`,
            radius: c.borderRadius,
            display: `${c.display} ${c.flexDirection} gap:${c.gap}`,
          };
        }),
    args.selector ?? "body"
  );
  for (const row of rows) console.log(JSON.stringify(row));
} finally {
  await browser.close();
  server.kill();
}
