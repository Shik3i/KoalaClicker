import puppeteer from "puppeteer-core";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { createServer } from "node:http";
import { setTimeout as delay } from "node:timers/promises";
const root = path.resolve(import.meta.dirname, "..");
const executablePath =
  process.env.KOALACLICKER_CHROME ||
  (process.platform === "win32"
    ? "C:/Users/s3ish/AppData/Local/ms-playwright/chromium-1243/chrome-win64/chrome.exe"
    : "/usr/bin/google-chrome");
const out = path.join(root, "build/browser-chrome");
fs.mkdirSync(out, { recursive: true });
const server = createServer((req, res) => {
  res.setHeader("Content-Type", "text/html");
  res.end(fs.readFileSync(path.join(root, "tests/fixtures/garden.html")));
});
await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const url = `http://127.0.0.1:${server.address().port}/`;
const browser = await puppeteer.launch({
  executablePath,
  headless: true,
  enableExtensions: true,
  args: ["--no-sandbox", "--window-size=1440,1000"],
  defaultViewport: { width: 1280, height: 800 },
});
const checks = [];
function passed(name) {
  checks.push(name);
  console.log("PASS", name);
}
try {
  const id = await browser.installExtension(path.join(root, "dist/chrome"));
  const extension = (await browser.extensions()).get(id);
  const garden = await browser.newPage();
  await garden.goto(url);
  async function popup(page = garden) {
    await page.bringToFront();
    await page.triggerExtensionAction(extension);
    const target = await browser.waitForTarget((target) =>
      target.url().endsWith("/popup/popup.html"),
    );
    const result = await target.asPage();
    await result.waitForFunction(
      () =>
        document.querySelector("#empty-state")?.textContent.trim() !==
        "Loading saved clickers…",
    );
    return result;
  }
  async function select(p, selector = "#add-clicker-btn") {
    const closed = new Promise((resolve, reject) => {
      const timer = setTimeout(
        () => reject(new Error("Selection did not close popup")),
        5000,
      );
      p.once("close", () => {
        clearTimeout(timer);
        resolve();
      });
    });
    await p.evaluate((selector) => {
      setTimeout(() => document.querySelector(selector).click(), 0);
    }, selector);
    await closed;
  }
  const click = (p, selector) =>
    p.$eval(selector, (element) => element.click());
  const storage = async (page) =>
    page.evaluate(async () => {
      const api = globalThis.browser || chrome;
      return api.storage.local.get(null);
    });
  const screenshot = async (p, name) => {
    await p.waitForFunction(
      () =>
        ![...document.querySelectorAll(".btn-stop,.btn-remove")].some(
          (e) => e.disabled,
        ),
    );
    await p.evaluate(() =>
      Promise.all(document.getAnimations().map((a) => a.finished)),
    );
    await p.evaluate(
      () =>
        new Promise((resolve) =>
          requestAnimationFrame(() => requestAnimationFrame(resolve)),
        ),
    );
    await p.screenshot({ path: path.join(out, name) });
  };
  const saved = async (page) =>
    Object.values(await storage(page)).find((value) => value?.clickers)
      ?.clickers || [];
  let p = await popup();
  assert.equal(await p.$eval("#add-clicker-btn", (e) => e.disabled), false);
  assert.equal((await saved(p)).length, 0);
  passed(
    "real action activation with unchanged production permissions and empty state",
  );
  await screenshot(p, "popup-empty.png");
  await select(p);
  await garden.keyboard.press("Escape");
  await garden.click("#flower");
  assert.equal(await garden.evaluate(() => count), 1);
  p = await popup();
  assert.equal((await saved(p)).length, 0);
  passed("selection Escape restores page interaction");
  await select(p);
  await garden.screenshot({ path: path.join(out, "selection.png") });
  await garden.click("#link");
  await delay(150);
  assert.equal(garden.url(), url);
  assert.deepEqual(await garden.evaluate(() => events), []);
  p = await popup();
  assert.equal((await saved(p)).length, 1);
  assert.equal((await saved(p))[0].active, false);
  passed(
    "selection suppresses pointer/mouse handlers and link navigation; saves stopped",
  );
  await click(p, ".btn-remove");
  await p.waitForFunction(() => !document.querySelector(".clicker-item"));
  await select(p);
  await garden.click("#flower");
  await garden.click("#flower", { clickCount: 2 });
  assert.equal(await garden.evaluate(() => count), 1);
  passed("selection double-click does not activate the target");
  p = await popup();
  await p.waitForSelector(".clicker-item");
  await p.$eval(".clicker-name-input", (e) => {
    e.value = "Flower garden";
    e.dispatchEvent(new Event("input", { bubbles: true }));
  });
  await p.close();
  p = await popup();
  assert.equal((await saved(p))[0].name, "Flower garden");
  passed("input followed by immediate popup closure persists");
  await click(p, ".btn-stop");
  await p.waitForFunction(
    () => document.querySelector(".btn-stop")?.textContent === "Stop",
  );
  await screenshot(p, "popup-running.png");
  await p.close();
  await garden.waitForFunction(() => count >= 3);
  passed("start produces actual target-page effects");
  assert.deepEqual(await garden.evaluate(() => clickEvents.slice(-3)), [
    { type: "mousedown", detail: 1, buttons: 1, trusted: false },
    { type: "mouseup", detail: 1, buttons: 0, trusted: false },
    { type: "click", detail: 1, buttons: 0, trusted: false },
  ]);

  p = await popup();
  await click(p, "#stop-all-btn");
  await p.waitForFunction(
    () => document.querySelector(".btn-stop")?.textContent === "Start",
  );
  await screenshot(p, "popup-stopped.png");
  const stopped = await garden.evaluate(() => count);
  await delay(600);
  assert.equal(await garden.evaluate(() => count), stopped);
  passed("stop-all clears active timers");
  await select(p, ".target-btn");
  await garden.click("#water");
  p = await popup();
  assert.match((await saved(p))[0].selector, /water/);
  await click(p, ".btn-stop");
  await p.close();
  await garden.waitForFunction(() => water >= 2);
  assert.equal(await garden.evaluate(() => count), stopped);
  passed("same-ID reselection runs only the new selector");
  p = await popup();
  await click(p, "#stop-all-btn");
  await p.waitForFunction(
    () => document.querySelector(".btn-stop").textContent === "Start",
  );
  await select(p);
  await garden.click('button[id="duplicate"]:nth-of-type(4)');
  p = await popup();
  const duplicates = await saved(p);
  const selector = duplicates[1].selector;
  assert.equal(
    await garden.evaluate(
      (selector) => document.querySelectorAll(selector).length,
      selector,
    ),
    1,
  );
  passed("duplicate IDs generate a unique structural selector");
  await click(p, ".btn-stop");
  await p.close();
  await garden.waitForFunction(() => water >= 3);
  const other = await browser.newPage();
  await other.goto(url + "other");
  p = await popup(other);
  assert.equal((await saved(p)).length, 2);
  await click(p, "#stop-all-btn");
  await p.waitForFunction(() =>
    [...document.querySelectorAll(".btn-stop")].every(
      (e) => e.textContent === "Start",
    ),
  );
  const before = await garden.evaluate(() => water);
  await delay(600);
  assert.equal(await garden.evaluate(() => water), before);
  passed("same-origin tab updates stop already injected documents");
  await p.close();
  await garden.bringToFront();
  p = await popup();
  await click(p, ".btn-stop");
  await p.close();
  await garden.evaluate(() => history.pushState({}, "", "/new-route"));
  const routeCount = await garden.evaluate(() => water);
  await delay(600);
  assert.equal(await garden.evaluate(() => water), routeCount);
  passed("SPA route change stops active timers");
  p = await popup();
  await click(p, "#stop-all-btn");
  await p.close();
  await garden.reload();
  const reloadCount = await garden.evaluate(() => water);
  await delay(400);
  assert.equal(await garden.evaluate(() => water), reloadCount);
  passed("reload does not inject or restart until invocation");
  p = await popup();
  await select(p);
  await garden.click("#submit");
  p = await popup();
  assert.equal(await garden.evaluate(() => submits), 0);
  passed("selection does not submit forms");
  await p.close();
  const blocked = await browser.newPage();
  await blocked.goto("chrome://version");
  p = await popup(blocked);
  assert.equal(await p.$eval("#add-clicker-btn", (e) => e.disabled), true);
  passed("protected page shows a recoverable disabled state");

  await p.close();
  await garden.bringToFront();
  p = await popup();
  const mutate = (p, op, extra = {}) =>
    p.evaluate(
      async (op, extra) => {
        const [tab] = await chrome.tabs.query({
          active: true,
          currentWindow: true,
        });
        const result = await chrome.runtime.sendMessage({
          action: "STORE",
          url: tab.url,
          op,
          ...extra,
        });
        if (!result.ok) throw Error(result.error);
        return result;
      },
      op,
      extra,
    );
  await mutate(p, "clear");
  let added = await mutate(p, "add", { selector: "#flower" });
  const targetId = added.clickers[0].id;
  await mutate(p, "patch", {
    id: targetId,
    patch: { interval: 25, active: true },
  });
  await garden.waitForFunction(() => count >= 2);
  await garden.evaluate(
    () => (document.querySelector("#flower").hidden = true),
  );
  let effects = await garden.evaluate(() => count);
  await delay(200);
  assert.equal(await garden.evaluate(() => count), effects);
  await garden.evaluate(() => {
    const button = document.querySelector("#flower");
    button.hidden = false;
    button.disabled = true;
  });
  await delay(200);
  assert.equal(await garden.evaluate(() => count), effects);
  passed("hidden and disabled targets are skipped");
  await garden.evaluate(() => {
    document.querySelector("#flower").disabled = false;
    document.querySelector("#flower").remove();
  });
  await p.waitForFunction(
    () =>
      document.querySelector(".status-badge")?.textContent === "Target missing",
  );
  passed("missing target status is visible");
  await garden.evaluate(() => {
    const button = document.createElement("button");
    button.id = "flower";
    button.textContent = "Replacement flower";
    button.onclick = () => window.count++;
    document.querySelector(".grid").prepend(button);
  });
  await garden.waitForFunction("count>" + effects);
  assert.ok((await garden.evaluate(() => count)) > effects);
  passed("DOM replacement resolves a fresh element");
  await garden.evaluate(() => {
    const rect = document.querySelector("#flower").getBoundingClientRect();
    const cover = document.createElement("div");
    cover.id = "test-overlay";
    cover.style.cssText = `position:fixed;left:${rect.left}px;top:${rect.top}px;width:${rect.width}px;height:${rect.height}px;z-index:100;background:black`;
    document.body.append(cover);
  });
  effects = await garden.evaluate(() => count);
  await delay(200);
  assert.equal(await garden.evaluate(() => count), effects);
  await garden.evaluate(() => {
    document.querySelector("#test-overlay").remove();
    document.querySelector("#flower").style.transform = "translateY(2000px)";
  });
  await delay(200);
  assert.equal(await garden.evaluate(() => count), effects);
  await garden.evaluate(() => {
    const button = document.querySelector("#flower");
    button.style.transform = "";
    button.parentElement.append(button.cloneNode(true));
  });
  await delay(200);
  assert.equal(await garden.evaluate(() => count), effects);
  await garden.evaluate(() => document.querySelectorAll("#flower")[1].remove());
  passed("covered, offscreen and newly ambiguous targets are skipped");
  await p.close();
  const foreign = await browser.newPage();
  await foreign.goto(url.replace("127.0.0.1", "localhost"));
  p = await popup(foreign);
  assert.equal(await p.$eval("#empty-state", (e) => e.hidden), false);
  await mutate(p, "clear");
  effects = await garden.evaluate(() => count);
  await garden.waitForFunction("count>" + effects, { polling: 100 });
  assert.equal(await foreign.evaluate(() => count), 0);
  await p.close();
  await foreign.close();
  p = await popup();
  passed(
    "different origins have separate settings and cannot stop existing timers",
  );
  await mutate(p, "stopAll");
  await mutate(p, "clear");
  for (let index = 0; index < 50; index++)
    await mutate(p, "add", { selector: "#flower", name: "Target " + index });
  assert.equal((await saved(p)).length, 50);
  assert.equal(await p.$eval("#add-clicker-btn", (e) => e.disabled), true);
  assert.equal(
    await p.$eval(
      ".clickers-container",
      (e) => e.scrollHeight > e.clientHeight,
    ),
    true,
  );
  assert.equal(
    await p.evaluate(() =>
      [...document.querySelectorAll("input")].every((e) =>
        e.hasAttribute("aria-label"),
      ),
    ),
    true,
  );
  passed("50 targets remain scrollable with labelled inputs and disabled add");
  await mutate(p, "clear");
  await p.close();
  await garden.goto(url);
  p = await popup();
  added = await mutate(p, "add", { selector: "#flower" });
  await mutate(p, "patch", {
    id: added.clickers[0].id,
    patch: { active: true, interval: 25 },
  });
  await p.close();
  await garden.waitForFunction(() => count > 1);
  await garden.evaluate(() => {
    addEventListener("pageshow", (event) => {
      window.restoredFromCache = event.persisted;
    });
  });
  await garden.goto(url + "history-away");
  await garden.goBack({ waitUntil: "load" });
  effects = await garden.evaluate(() => count);
  await delay(300);
  assert.equal(await garden.evaluate(() => count), effects);
  const restored = await garden.evaluate(
    () => window.restoredFromCache === true,
  );
  passed(`history back leaves timers stopped (BFCache restored: ${restored})`);
  await garden.goForward({ waitUntil: "load" });
  assert.equal(await garden.evaluate(() => count), 0);
  await garden.goBack({ waitUntil: "load" });
  p = await popup();
  await p.close();
  effects = await garden.evaluate(() => count);
  await garden.waitForFunction("count>" + effects);
  await browser.uninstallExtension(id);
  effects = await garden.evaluate(() => count);
  await delay(200);
  assert.equal(await garden.evaluate(() => count), effects);
  passed("extension uninstall invalidates running content timers");
  fs.writeFileSync(
    path.join(out, "evidence.json"),
    JSON.stringify(
      {
        browser: await browser.version(),
        version: JSON.parse(
          fs.readFileSync(path.join(root, "src/manifest.json")),
        ).version,
        activation: "CDP Extensions.triggerAction with production manifest",
        checks,
      },
      null,
      2,
    ) + "\n",
  );
} finally {
  await browser.close();
  server.close();
}
