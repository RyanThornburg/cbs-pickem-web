// Clicks through the app's interactive controls on a build, against the same
// recorded data and frozen clock as snap.mjs, at 360 and 1280: segmented
// controls (tap and arrow keys), Live's layout, the box score and its stat
// groups, the Standings Key popover, the team page back link, tooltips
// (tap, click, Escape), and Admin's views, filter and payment form. Prints PASS/FAIL per check; exits 1 on any
// failure. Screenshots say a page looks right; this says it still works.
//
//   node scripts/visual/clickthrough.mjs [--dist build] [--port 3490]
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
const PORT = String(args.port ?? 3490);
const BASE = `http://localhost:${PORT}`;

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

const errors = [];
let failures = 0;
const ok = (passed, message) => {
  if (!passed) failures++;
  console.log(`${passed ? "PASS" : "FAIL"} ${message}`);
};

async function openPage(width) {
  const context = await browser.newContext({
    viewport: { width, height: 900 },
    isMobile: width < 900,
    hasTouch: width < 900,
  });
  await context.clock.setFixedTime(now);
  await context.addInitScript(() => {
    if (sessionStorage.getItem("clickthrough-ready")) return;
    localStorage.clear();
    localStorage.setItem("user", "35");
    sessionStorage.setItem("clickthrough-ready", "1");
  });
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
      if (url.pathname === "/api/admin/me") return json({ ok: true });
      if (url.pathname === "/api/admin/status") return json(adminStatus(now));
      const roster = url.pathname.match(/roster\/(\d+)$/);
      if (roster) return json(adminRoster(Number(roster[1]), now));
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
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error" && !/401|404/.test(message.text())) {
      errors.push(message.text());
    }
  });
  return page;
}

const pressedText = (page, group) =>
  page
    .locator(`[aria-label="${group}"] [aria-pressed="true"]`)
    .filter({ visible: true })
    .first()
    .innerText();

try {
  for (const width of [360, 1280]) {
    console.log(`-- ${width}px`);
    const page = await openPage(width);
    const wait = (ms = 600) => page.waitForTimeout(ms);

    // Trends: Week/Season by tap and by keyboard.
    await page.goto(`${BASE}/trends?view=week`);
    await wait(2500);
    await page.getByRole("button", { name: "Season", exact: true }).click();
    await wait();
    ok(
      page.url().includes("view=season") &&
        (await pressedText(page, "Trends for this week or the season")) ===
          "Season",
      "Trends: Season by tap"
    );
    await page.getByRole("button", { name: "Season", exact: true }).focus();
    await page.keyboard.press("ArrowLeft");
    await wait(200);
    const focused = await page.evaluate(
      () => document.activeElement?.textContent
    );
    ok(
      /^Week/.test(focused ?? ""),
      `Trends: ArrowLeft focuses Week (${focused})`
    );
    await page.keyboard.press("Enter");
    await wait();
    ok(page.url().includes("view=week"), "Trends: Enter picks Week");
    await page
      .getByRole("button", { name: /^Week/, pressed: true })
      .first()
      .click();
    await wait(300);
    ok(
      page.url().includes("view=week"),
      "Trends: pressing the pressed segment keeps it"
    );

    // Live: layout switch, then a finished game's box score and stat groups.
    await page.goto(`${BASE}/nfl?view=live&week=5`);
    await wait(2500);
    await page.getByRole("button", { name: "Compact list" }).click();
    await wait();
    ok(
      (await page
        .locator('[aria-label="Live layout"] [aria-pressed="true"]')
        .getAttribute("aria-label")) === "Compact list",
      "Live: Compact list"
    );
    ok(
      (await page.evaluate(() => localStorage.getItem("scoreboardLayout"))) ===
        "compact",
      "Live: layout remembered"
    );
    await page.getByRole("button", { name: "Full cards" }).click();
    await wait();
    const boxScore = page
      .getByRole("button", { name: "Box score and leaders" })
      .first();
    await boxScore.click();
    await wait(1500);
    ok(
      (await boxScore.getAttribute("aria-expanded")) === "true",
      "Live: box score opens"
    );
    const groups = page.locator('[aria-label="Player stat group"]').first();
    if (await groups.count()) {
      await groups.getByRole("button", { name: "Rushing" }).click();
      await wait(300);
      ok(
        (await pressedText(page, "Player stat group")) === "Rushing",
        "Box score: Rushing group"
      );
    } else {
      ok(false, "Box score: player stat groups present");
    }

    // Standings: the phone's one control and Key popover, desktop's layout.
    await page.goto(`${BASE}/nfl?view=standings`);
    await wait(2500);
    if (width < 900) {
      await page.getByRole("button", { name: "NFC", exact: true }).click();
      await wait(400);
      ok((await pressedText(page, "Standings")) === "NFC", "Standings: NFC");
      await page.getByRole("button", { name: "Key" }).click();
      await wait();
      ok(
        await page
          .getByRole("dialog", { name: "What the columns mean" })
          .isVisible(),
        "Standings: Key opens the legend"
      );
      await page.keyboard.press("Escape");
    } else {
      await page.getByRole("button", { name: "All 32", exact: true }).click();
      await wait(400);
      ok(
        (await pressedText(page, "Standings layout")) === "All 32",
        "Standings: All 32"
      );
    }
    await page.getByRole("button", { name: "Games", exact: true }).click();
    await wait(800);
    ok(page.url().includes("view=games"), "NFL switch: Games");

    // Team page: the back link takes the band's white and goes back.
    await page.goto(`${BASE}/nfl?view=standings`);
    await wait(2000);
    await page.goto(`${BASE}/nfl/teams/buf`);
    await wait(2500);
    const back = page.getByRole("link", { name: /Standings/ }).first();
    await wait(400); // the button's color transition
    const backColor = await back.evaluate((el) => getComputedStyle(el).color);
    ok(
      backColor === "rgb(255, 255, 255)",
      `Team: back link white (${backColor})`
    );
    await back.click();
    await wait(800);
    ok(
      page.url().includes("/nfl?view=standings"),
      "Team: back goes to Standings"
    );

    // Tooltips (ui/Tooltip): a badge opens on tap/click without opening
    // its row; the pick-split list toggles and Escape closes it.
    const tooltipOpen = () =>
      page
        .locator('[role="tooltip"]')
        .filter({ visible: true })
        .count()
        .then((n) => n > 0);
    const tapOrClick = (locator) =>
      width < 900 ? locator.tap() : locator.click();
    await page.goto(`${BASE}/picks`);
    await wait(2500);
    const badge = page
      .locator('span[role="img"][tabindex="0"]')
      .filter({ visible: true })
      .first();
    await tapOrClick(badge);
    await wait(500);
    ok(
      (await tooltipOpen()) && page.url().endsWith("/picks"),
      "Tooltip: a badge opens without opening its row"
    );
    await page.goto(`${BASE}/nfl?view=live`);
    await wait(2500);
    const split = page
      .locator('[aria-label$="Show names."]')
      .filter({ visible: true })
      .first();
    await split.scrollIntoViewIfNeeded();
    await tapOrClick(split);
    await wait(500);
    const splitOpened = await tooltipOpen();
    await page.keyboard.press("Escape");
    await wait(300);
    ok(
      splitOpened && !(await tooltipOpen()),
      "Tooltip: the pick split opens, and Escape closes it"
    );

    // User Picks: a row opens the player page.
    await page.goto(`${BASE}/picks`);
    await wait(2500);
    await page
      .locator("[data-user-row]")
      .filter({ visible: true })
      .nth(3)
      .click({ position: { x: 5, y: 5 } });
    await wait(1000);
    ok(
      /\/players\/\d+/.test(page.url()),
      "User Picks: a row opens the player page"
    );

    // Admin: views, roster filter, the payment form.
    await page.goto(`${BASE}/admin`);
    await wait(2500);
    await page.getByRole("button", { name: "Roster", exact: true }).click();
    await wait(1200);
    ok(page.url().includes("view=roster"), "Admin: Roster");
    await page.getByRole("button", { name: /^Paid \d/ }).click();
    await wait(400);
    ok(
      /^Paid/.test(await pressedText(page, "Show members")),
      "Roster: Paid filter"
    );
    ok(
      (await page
        .getByRole("link", { name: "Log out" })
        .getAttribute("href")) === "/logout",
      "Admin: Log out link"
    );
    await page.getByRole("button", { name: /^All \d/ }).click();
    await wait(300);
    await page
      .getByRole("button", { name: /^Mark paid for/ })
      .first()
      .click();
    await wait(400);
    ok(
      (await page.getByRole("button", { name: "Save" }).isVisible()) &&
        (await page.getByRole("button", { name: "Cancel" }).isEnabled()),
      "Roster: payment form opens"
    );
    await page.context().close();
  }
  ok(
    errors.length === 0,
    `no console errors${errors.length ? `: ${[...new Set(errors)].slice(0, 3).join(" | ")}` : ""}`
  );
} finally {
  await browser.close();
  server.kill();
}
process.exit(failures ? 1 : 0);
