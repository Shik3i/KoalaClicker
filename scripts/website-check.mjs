import fs from "node:fs";
import path from "node:path";
import { createServer } from "node:http";
import assert from "node:assert/strict";
import puppeteer from "puppeteer-core";
const root = path.resolve("dist/website"),
  output = path.resolve("build/website");
fs.mkdirSync(output, { recursive: true });
const types = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css",
  ".js": "text/javascript",
  ".png": "image/png",
  ".xml": "application/xml",
  ".txt": "text/plain",
};
const server = createServer((req, res) => {
  const pathname = new URL(req.url, "http://127.0.0.1").pathname;
  let file = path.resolve(root, "." + decodeURIComponent(pathname));
  if (file !== root && !file.startsWith(root + path.sep)) {
    res.writeHead(403);
    res.end();
    return;
  }
  if (pathname === "/impressum" || pathname === "/impressum.html") {
    res.writeHead(308, { Location: "https://koalastuff.net/legal" });
    res.end();
    return;
  }
  if (fs.existsSync(file) && fs.statSync(file).isDirectory())
    file = path.join(file, "index.html");
  if (!fs.existsSync(file) && fs.existsSync(file + ".html")) file += ".html";
  if (!fs.existsSync(file)) {
    res.statusCode = 404;
    file = path.join(root, "404.html");
  }
  res.setHeader(
    "Content-Type",
    types[path.extname(file)] || "application/octet-stream",
  );
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self'; object-src 'none'; base-uri 'self'; form-action 'none'; frame-ancestors 'none'",
  );
  res.end(fs.readFileSync(file));
});
await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const base = `http://127.0.0.1:${server.address().port}`;
const executablePath =
  process.env.KOALACLICKER_CHROME ||
  (process.platform === "win32"
    ? "C:/Users/s3ish/AppData/Local/ms-playwright/chromium-1243/chrome-win64/chrome.exe"
    : "/usr/bin/google-chrome");
const browser = await puppeteer.launch({
  executablePath,
  headless: true,
  args: ["--no-sandbox"],
});
try {
  const page = await browser.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => {
    if (m.type() === "error" && !m.text().includes("404"))
      errors.push(m.text());
  });
  for (const viewport of [
    { width: 1440, height: 1000 },
    { width: 390, height: 844 },
    { width: 320, height: 700 },
  ]) {
    await page.setViewport(viewport);
    await page.goto(base);
    await page.waitForFunction(
      () =>
        document.querySelector("[data-koalaclicker-version]")?.textContent ===
        "v1.3.1",
    );
    assert.equal(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
      true,
      `overflow at ${viewport.width}`,
    );
    const initial = await page.evaluate(() => document.documentElement.lang);
    if (viewport.width < 769) await page.click("#hamburger");
    await page.click(".lang-toggle");
    assert.notEqual(
      await page.evaluate(() => document.documentElement.lang),
      initial,
    );
    await page.reload();
    assert.notEqual(
      await page.evaluate(() => document.documentElement.lang),
      initial,
    );
    if (viewport.width < 769) {
      await page.click("#hamburger");
      assert.equal(
        await page.$eval("#hamburger", (e) => e.getAttribute("aria-expanded")),
        "true",
      );
      await page.keyboard.press("Escape");
      assert.equal(
        await page.$eval("#hamburger", (e) => e.getAttribute("aria-expanded")),
        "false",
      );
    }
    await page.screenshot({
      path: path.join(output, `home-${viewport.width}.png`),
      fullPage: true,
    });
  }
  for (const route of ["/", "/datenschutz", "/datenschutz.html"]) {
    const response = await page.goto(base + route);
    assert.equal(response.status(), 200);
    const links = await page.evaluate(() =>
      [...document.querySelectorAll("[href],[src]")]
        .map((e) => e.getAttribute("href") || e.getAttribute("src"))
        .filter((value) => value && !value.startsWith("#")),
    );
    for (const link of links) {
      if (/^https?:/.test(link)) {
        assert.ok(!link.includes("/imprint"));
        continue;
      }
      const url = new URL(link, base + route);
      const response = await fetch(url);
      assert.ok(response.ok, `${url} returned ${response.status}`);
    }
    assert.equal(
      await page.evaluate(() =>
        performance
          .getEntriesByType("resource")
          .some((entry) => !entry.name.startsWith(location.origin)),
      ),
      false,
    );
  }
  const redirect = await fetch(base + "/impressum", { redirect: "manual" });
  assert.equal(redirect.status, 308);
  assert.equal(
    redirect.headers.get("location"),
    "https://koalastuff.net/legal",
  );
  assert.equal((await page.goto(base + "/does-not-exist")).status(), 404);
  assert.equal(
    await page.$eval(
      'a[href="https://koalastuff.net/legal"]',
      (e) => e.textContent,
    ),
    "Legal / Impressum",
  );
  await page.evaluateOnNewDocument(() => {
    Object.defineProperty(window, "localStorage", {
      get() {
        throw new DOMException("Storage disabled", "SecurityError");
      },
    });
  });
  await page.setViewport({ width: 1440, height: 1000 });
  await page.goto(base);
  await page.click(".lang-toggle");
  await page.waitForFunction(
    () =>
      document.querySelector("[data-koalaclicker-version]").textContent ===
      "v1.3.1",
  );
  assert.deepEqual(errors, []);
  console.log(
    "PASS website desktop/mobile 320/390/1440, languages, storage denial, keyboard menu, routes, assets, CSP and external-resource checks",
  );
} finally {
  await browser.close();
  server.close();
}
