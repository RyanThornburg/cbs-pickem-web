// Screenshots every page of a build at phone and desktop width, against
// recorded API data and a frozen clock, so two builds can be pixel-diffed
// (scripts/visual/diff.mjs). Used to check each step of the move off MUI.
//
//   node scripts/visual/snap.mjs --record             # save prod API data once
//   node scripts/visual/snap.mjs --dist build --out .visual/after
//   node scripts/visual/snap.mjs --out .visual/after --pages admin,picks
//   node scripts/visual/snap.mjs --record-missing --pages live-boxscore
//
// --record-missing fetches only requests that aren't saved yet (a new page),
// keeping everything already recorded, so the baseline stays valid.
//
// Recorded data lives in .visual/ (gitignored): it has real names in it, and
// the repo is public.
import { spawn } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
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
const FIXTURES = join(ROOT, ".visual/fixtures.json");
const PROD = "https://morlocked.rattsnest.com";
const PORT = Number(args.port ?? 3470);
const SELECTED_USER = "35";

// Every page worth comparing, each in a fresh browser context. Options:
// `fail` answers matching API paths with a 500 (error states), `user` is the
// selected player ("" for nobody), `storage` adds localStorage entries,
// `admin` serves made-up admin data (adminFixtures.mjs; otherwise the admin
// routes 401, like a local `wrangler dev`), and `action` runs before the
// shot (opening a panel).
export const PAGES = [
  ["picks", "/picks"],
  ["picks-past", "/picks?week=3"],
  ["nfl-games", "/nfl?view=games"],
  ["nfl-live", "/nfl?view=live"],
  ["nfl-standings", "/nfl?view=standings"],
  ["team", "/nfl/teams/buf"],
  ["trends-week", "/trends?view=week"],
  ["trends-season", "/trends?view=season"],
  ["records", "/records"],
  ["records-alltime", "/records?view=all-time"],
  ["you", "/players"],
  ["player", "/players/17"],
  ["picks-error", "/picks", { fail: /\/leaderboard$/ }],
  ["picks-nouser", "/picks", { user: "" }],
  ["records-nouser", "/records", { user: "" }],
  [
    "shell-error",
    "/picks",
    {
      fail: /^\/api\/meta$/,
      storage: { cbsPoolUrl: "https://www.cbssports.com/" },
    },
  ],
  [
    // A finished game from a past week: its details have every player's
    // stats, so the Player stats section shows.
    "live-boxscore",
    "/nfl?view=live&week=5",
    {
      action: async (page) => {
        await page
          .getByRole("button", { name: "Box score and leaders" })
          .first()
          .click();
        await page.waitForTimeout(1500);
      },
    },
  ],
  ["admin", "/admin", { admin: true }],
  ["admin-roster", "/admin?view=roster", { admin: true }],
];
const WIDTHS = [360, 1280];

// The headless shell already on disk; Playwright's own download would be a
// different revision (see the dev tooling notes).
const executablePath =
  process.env.PW_CHROMIUM ??
  join(
    homedir(),
    ".cache/ms-playwright/chromium_headless_shell-1187/chrome-linux/headless_shell"
  );

const loadFixtures = () =>
  existsSync(FIXTURES)
    ? JSON.parse(readFileSync(FIXTURES, "utf8"))
    : { recordedAt: null, responses: {} };

async function main() {
  const record = Boolean(args.record);
  const recordMissing = Boolean(args["record-missing"]);
  const fixtures = loadFixtures();
  if (!record && !fixtures.recordedAt) {
    throw new Error("No recorded data yet: run with --record first.");
  }
  if (record) {
    fixtures.recordedAt = new Date().toISOString();
    fixtures.responses = {};
  }
  const dist = resolve(ROOT, args.dist ?? "build");
  const out = resolve(ROOT, args.out ?? ".visual/snap");
  mkdirSync(out, { recursive: true });

  const server = spawn(
    join(ROOT, "node_modules/.bin/vite"),
    ["preview", "--outDir", dist, "--port", String(PORT), "--strictPort"],
    { cwd: ROOT, stdio: ["ignore", "pipe", "inherit"] }
  );
  await new Promise((ready, fail) => {
    server.stdout.on("data", (chunk) => {
      if (String(chunk).includes(`${PORT}`)) ready();
    });
    server.on("exit", (code) => fail(new Error(`vite preview exited ${code}`)));
  });

  const browser = await chromium.launch({ executablePath });
  const only = typeof args.pages === "string" ? args.pages.split(",") : null;
  const now = new Date(fixtures.recordedAt);
  try {
    for (const width of WIDTHS) {
      for (const [name, path, options = {}] of PAGES) {
        if (only && !only.includes(name)) continue;
        const context = await browser.newContext({
          viewport: { width, height: width < 900 ? 800 : 900 },
          deviceScaleFactor: 1,
          hasTouch: width < 900,
          isMobile: width < 900,
          reducedMotion: "reduce",
        });
        // Polls keep running; only the clock's reading is frozen, so
        // "Updated 3 min ago" and the NFL view rule read the same every run.
        await context.clock.setFixedTime(now);
        await context.addInitScript(
          (storage) => {
            if (sessionStorage.getItem("snap-ready")) return;
            localStorage.clear();
            sessionStorage.clear();
            sessionStorage.setItem("snap-ready", "1");
            for (const [key, value] of Object.entries(storage)) {
              localStorage.setItem(key, value);
            }
          },
          {
            ...((options.user ?? SELECTED_USER)
              ? { user: options.user ?? SELECTED_USER }
              : {}),
            ...options.storage,
          }
        );
        await context.route(
          (url) => new URL(url).pathname.startsWith("/api/"),
          async (route) => {
            const url = new URL(route.request().url());
            const json = (body) =>
              route.fulfill({
                status: 200,
                body: JSON.stringify(body),
                headers: { "content-type": "application/json" },
              });
            if (url.pathname.startsWith("/api/admin")) {
              if (!options.admin) return route.fulfill({ status: 401 });
              if (url.pathname === "/api/admin/me") return json({ ok: true });
              if (url.pathname === "/api/admin/status")
                return json(adminStatus(now));
              const roster = url.pathname.match(/^\/api\/admin\/roster\/(\d+)/);
              if (roster) return json(adminRoster(Number(roster[1]), now));
              return route.fulfill({ status: 404 });
            }
            if (options.fail?.test(url.pathname)) {
              return route.fulfill({ status: 500, body: "" });
            }
            const key = url.pathname + url.search;
            if ((record || recordMissing) && !fixtures.responses[key]) {
              const response = await fetch(PROD + key);
              fixtures.responses[key] = {
                status: response.status,
                body: await response.text(),
              };
            }
            const saved = fixtures.responses[key] ?? { status: 404, body: "" };
            return route.fulfill({
              status: saved.status,
              body: saved.body,
              headers: { "content-type": "application/json" },
            });
          }
        );
        // Google Fonts' Inter is the one outside request; let it through.
        const page = await context.newPage();
        await page.goto(`http://localhost:${PORT}${path}`);
        // Live polls can keep the network busy; cap the wait for quiet.
        await page
          .waitForLoadState("networkidle", { timeout: 8000 })
          .catch(() => {});
        await page.addStyleTag({
          content:
            "*, *::before, *::after { transition: none !important; animation: none !important; caret-color: transparent !important; }",
        });
        await page.evaluate(() => document.fonts.ready);
        await page.waitForTimeout(800);
        if (options.action) await options.action(page, width);
        await page.mouse.move(0, 0);
        await page.screenshot({
          path: join(out, `${name}@${width}.png`),
          fullPage: true,
        });
        process.stdout.write(`${name}@${width} `);
        await context.close();
      }
    }
    process.stdout.write("\n");
  } finally {
    await browser.close();
    server.kill();
  }
  if (record || recordMissing) {
    mkdirSync(join(ROOT, ".visual"), { recursive: true });
    writeFileSync(FIXTURES, JSON.stringify(fixtures));
    console.log(
      `Recorded ${Object.keys(fixtures.responses).length} responses at ${fixtures.recordedAt}`
    );
    // Recording fetches from prod as it goes, which is slow enough that
    // some pages are shot before everything has loaded.
    console.log(
      "These shots came from live fetches; shoot the baseline again before diffing."
    );
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
