import fs from "node:fs";
import path from "node:path";
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { createRequire } from "node:module";
import { setTimeout as delay } from "node:timers/promises";
import { launchFirefox, until } from "./firefox-driver.mjs";
const { zipDirectory } = createRequire(import.meta.url)(
  "./build-extension.cjs",
);
const root = path.resolve(import.meta.dirname, ".."),
  out = path.join(root, "build/browser-firefox"),
  dir = path.join(out, "harness");
fs.mkdirSync(dir, { recursive: true });
fs.cpSync(path.join(root, "dist/firefox"), dir, { recursive: true });
const manifest = JSON.parse(fs.readFileSync(path.join(dir, "manifest.json")));
const denial = process.argv.includes("--denial");
if (denial) {
  delete manifest.host_permissions;
  manifest.permissions.push("tabs");
} else manifest.host_permissions = ["<all_urls>"];
manifest.background.scripts.push("harness.js");
fs.writeFileSync(path.join(dir, "manifest.json"), JSON.stringify(manifest));
fs.writeFileSync(
  path.join(dir, "harness.js"),
  `browser.tabs.create({url:browser.runtime.getURL('popup/popup.html?bootstrap')});`,
);
const popupPath = path.join(dir, "popup/popup.html");
fs.writeFileSync(
  popupPath,
  fs
    .readFileSync(popupPath, "utf8")
    .replace(
      '<script src="../shared/model.js">',
      '<script src="harness.js"></script><script src="../shared/model.js">',
    ),
);
fs.writeFileSync(
  path.join(dir, "popup/harness.js"),
  `const realQuery=browser.tabs.query.bind(browser.tabs);browser.tabs.query=async query=>query.active?(await realQuery({})).filter(tab=>tab.id===Number(new URL(location.href).searchParams.get('tab'))):realQuery(query);`,
);
const archive = path.join(out, "harness.zip");
await zipDirectory(dir, archive);
const server = createServer((req, res) => {
  res.setHeader("Content-Type", "text/html");
  res.end(fs.readFileSync(path.join(root, "tests/fixtures/garden.html")));
});
await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const url = `http://127.0.0.1:${server.address().port}/`;
const browser = await launchFirefox();
const checks = [];
const passed = (name) => {
  checks.push(name);
  console.log("PASS", name);
};
try {
  await browser.send("webExtension.install", {
    extensionData: { type: "archivePath", path: archive },
  });
  const bootstrapContext = await until(async () =>
    (await browser.contexts()).find((c) => c.url.endsWith("?bootstrap")),
  );
  const bootstrap = new browser.Page(bootstrapContext.context);
  const garden = await browser.newPage();
  await garden.goto(url);
  async function popup(page = garden) {
    await page.bringToFront();
    const targetUrl = await page.evaluate(() => location.href);
    const popupUrl = await bootstrap.evaluate(async (targetUrl) => {
      const tab = (await browser.tabs.query({})).find(
        (tab) => tab.url === targetUrl,
      );
      if (!tab) throw Error("Fixture tab missing");
      const url = browser.runtime.getURL("popup/popup.html?tab=" + tab.id);
      await browser.tabs.create({ url, active: false });
      return url;
    }, targetUrl);
    const context = await until(async () =>
      (await browser.contexts()).find((c) => c.url === popupUrl),
    );
    const popup = new browser.Page(context.context);
    await popup.waitForFunction(
      () =>
        document.querySelector("#empty-state")?.textContent.trim() !==
        "Loading saved clickers…",
    );
    return popup;
  }
  const saved = async (p) =>
    p.evaluate(
      async () =>
        Object.values(await browser.storage.local.get(null)).find(
          (v) => v?.clickers,
        )?.clickers || [],
    );
  const click = (p, selector) => p.$eval(selector, (e) => e.click());
  async function select(p, selector = "#add-clicker-btn") {
    await p.evaluate(
      (selector) =>
        setTimeout(() => document.querySelector(selector).click(), 0),
      selector,
    );
    await until(
      async () =>
        !(await browser.contexts()).some((c) => c.context === p.context),
    );
  }
  let p = await popup();
  if (denial) {
    assert.equal(await p.$eval("#add-clicker-btn", (e) => e.disabled), true);
    const message = await p.$eval("#feedback", (e) => e.textContent);
    assert.match(message, /permission/i);
    assert.equal(
      await garden.evaluate(() => Boolean(globalThis.koalaClickerInjected)),
      false,
    );
    passed("Firefox missing page permission fails visibly without injection");
  } else {
    assert.equal(await p.$eval("#add-clicker-btn", (e) => e.disabled), false);
    assert.equal((await saved(p)).length, 0);
    passed(
      "Firefox packaged UI, background writer and on-demand injection with isolated screenshot harness grant",
    );
    await p.screenshot({ path: path.join(out, "popup-empty.png") });
    await select(p);
    await garden.keyboard.press("Escape");
    await garden.click("#flower");
    assert.equal(await garden.evaluate(() => count), 1);
    p = await popup();
    assert.equal((await saved(p)).length, 0);
    passed("Escape cancels selection");
    await select(p);
    const shot = await browser.send("browsingContext.captureScreenshot", {
      context: garden.context,
      origin: "viewport",
      format: { type: "image/png" },
    });
    fs.writeFileSync(
      path.join(out, "selection.png"),
      Buffer.from(shot.data, "base64"),
    );
    await garden.click("#link");
    p = await popup();
    assert.equal(await garden.evaluate(() => location.href), url);
    assert.deepEqual(await garden.evaluate(() => events), []);
    assert.equal((await saved(p))[0].active, false);
    passed("selection prevents link actions and saves stopped");
    await click(p, ".btn-remove");
    await p.waitForFunction(() => !document.querySelector(".clicker-item"));
    await select(p);
    await garden.click("#flower");
    p = await popup();
    await p.$eval(".clicker-name-input", (e) => {
      e.value = "Flower garden";
      e.dispatchEvent(new Event("input", { bubbles: true }));
    });
    await p.close();
    p = await popup();
    assert.equal((await saved(p))[0].name, "Flower garden");
    passed("immediate popup close preserves text");
    await click(p, ".btn-stop");
    await p.waitForFunction(
      () => document.querySelector(".btn-stop").textContent === "Stop",
    );
    await p.screenshot({ path: path.join(out, "popup-running.png") });
    await garden.waitForFunction(() => count >= 3);
    passed("synthetic clicks produce real page effects");
    assert.deepEqual(await garden.evaluate(() => clickEvents.slice(-3)), [
      { type: "mousedown", detail: 1, buttons: 1, trusted: false },
      { type: "mouseup", detail: 1, buttons: 0, trusted: false },
      { type: "click", detail: 1, buttons: 0, trusted: false },
    ]);

    await click(p, "#stop-all-btn");
    await p.waitForFunction(
      () => document.querySelector(".btn-stop").textContent === "Start",
    );
    await p.screenshot({ path: path.join(out, "popup-stopped.png") });
    let count = await garden.evaluate(() => count);
    await delay(600);
    assert.equal(await garden.evaluate(() => count), count);
    passed("stop-all stops timer");
    await select(p, ".target-btn");
    await garden.click("#water");
    p = await popup();
    assert.match((await saved(p))[0].selector, /water/);
    await click(p, ".btn-stop");
    await p.close();
    await garden.waitForFunction(() => water >= 2);
    assert.equal(await garden.evaluate(() => count), count);
    passed("same-ID selector replacement");
    const other = await browser.newPage();
    await other.goto(url + "other");
    p = await popup(other);
    await click(p, "#stop-all-btn");
    await p.waitForFunction(
      () => document.querySelector(".btn-stop").textContent === "Start",
    );
    let water = await garden.evaluate(() => water);
    await delay(600);
    assert.equal(await garden.evaluate(() => water), water);
    passed("cross-tab storage synchronization");
    await p.close();
    p = await popup();
    await click(p, ".btn-stop");
    await p.close();
    await garden.evaluate(() => history.pushState({}, "", "/route"));
    water = await garden.evaluate(() => water);
    await delay(600);
    assert.equal(await garden.evaluate(() => water), water);
    passed("SPA transition stops clicks");
    p = await popup();
    await click(p, "#stop-all-btn");
    await p.close();
    await garden.reload();
    await delay(400);
    assert.equal(await garden.evaluate(() => water), 0);
    p = await popup();
    await select(p);
    await garden.click("#submit");
    p = await popup();
    assert.equal(await garden.evaluate(() => submits), 0);
    passed("reload remains inactive; selection does not submit forms");
    fs.writeFileSync(
      path.join(out, "evidence.json"),
      JSON.stringify(
        {
          browser: await browser.version(),
          version: manifest.version,
          activation:
            "Firefox BiDi fixture harness; no physical toolbar or shortcut claim",
          productionPermissions: JSON.parse(
            fs.readFileSync("dist/firefox/manifest.json"),
          ).permissions,
          checks,
        },
        null,
        2,
      ) + "\n",
    );
  }
} finally {
  await browser.close();
  server.close();
}
