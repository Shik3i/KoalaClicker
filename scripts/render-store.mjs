import fs from "node:fs";
import path from "node:path";
import puppeteer from "puppeteer-core";
const root = path.resolve("assets/store");
fs.mkdirSync(path.join(root, "screenshots"), { recursive: true });
const version = JSON.parse(fs.readFileSync("package.json")).version;
for (const browser of ["chrome", "firefox"])
  for (const name of [
    "popup-empty.png",
    "popup-running.png",
    "popup-stopped.png",
    "selection.png",
    "evidence.json",
  ])
    fs.copyFileSync(
      `build/browser-${browser}/${name}`,
      path.join(root, "screenshots", `${browser}-${name}`),
    );
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
const page = await browser.newPage();
const data = (file) =>
  "data:image/png;base64," + fs.readFileSync(file).toString("base64");
const icon = data("src/assets/Logo_Cut_128.png");
const style = `*{box-sizing:border-box}body{margin:0;background:#171925;color:#f8f8f2;font:20px system-ui}main{width:1280px;height:800px;padding:58px;display:flex;gap:45px;align-items:center;background:radial-gradient(ellipse at 95% 0%,#343050,#171925 65%)}.copy{width:550px}header{display:flex;align-items:center;gap:14px;color:#bd93f9;font-size:26px;font-weight:650}header img{width:64px;height:64px}h1{font-size:55px;line-height:1.09;letter-spacing:-1.5px;margin:42px 0 22px}p{color:#c2c4d6;font-size:22px;line-height:1.55}small{display:block;margin-top:36px;font-size:14px;color:#a8aec6}.frame{border:1px solid #5b527b;border-radius:16px;overflow:hidden;box-shadow:0 25px 80px #0008;flex:none;background:#1e1e2e}.popup{width:360px;height:570px;position:relative}.popup img{position:absolute;left:0;top:0;max-width:none}.chrome img{width:360px}.firefox img{width:1366px}.selection{width:560px}.selection img{display:block;width:560px}footer{position:absolute;bottom:26px;left:58px;font-size:14px;color:#a8aec6}`;
const entries = [];
try {
  for (const name of ["chrome", "firefox"]) {
    fs.mkdirSync(path.join(root, name), { recursive: true });
    const cases = [
      [
        "01-selection",
        "Choose the target.",
        "Select a page element. Cancel with Escape. Your new clicker is saved stopped.",
        "selection.png",
      ],
      [
        "02-running",
        "Set the pace.",
        "Name each clicker and choose an interval. Start when you are ready.",
        "popup-running.png",
      ],
      [
        "03-stopped",
        "Stop. Reselect. Resume.",
        "Stop all clickers for this website, change the target, or remove a saved clicker.",
        "popup-stopped.png",
      ],
    ];
    for (const [file, title, description, source] of cases) {
      const selection = source === "selection.png";
      await page.setViewport({
        width: 1280,
        height: 800,
        deviceScaleFactor: 1,
      });
      await page.setContent(
        `<!doctype html><html><head><style>${style}</style></head><body><main><section class="copy"><header><img src="${icon}" alt="">KoalaClicker</header><h1>${title}</h1><p>${description}</p><small>${name === "chrome" ? "Chrome" : "Firefox"} · v${version}<br>Local settings · No extension telemetry</small></section><div class="frame ${selection ? "selection" : `popup ${name}`}"><img src="${data(path.join(root, "screenshots", `${name}-${source}`))}" alt="Actual extension screenshot"></div></main><footer>Actual ${name === "chrome" ? "Chrome action popup" : "Firefox extension UI in test tab"} / local demo screenshot. Captions outside the frame.</footer></body></html>`,
      );
      await page.evaluate(() =>
        Promise.all([...document.images].map((image) => image.decode())),
      );
      const output = path.join(root, name, file + ".png");
      await page.screenshot({ path: output });
      entries.push(`${name}/${file}.png`);
    }
  }
  for (const [filename, width, height] of [
    ["promo-small-440x280.png", 440, 280],
    ["promo-marquee-1400x560.png", 1400, 560],
    ["social-preview.png", 1200, 630],
  ]) {
    await page.setViewport({ width, height, deviceScaleFactor: 1 });
    await page.setContent(
      `<html><style>body{margin:0;background:#1e1e2e;color:#f8f8f2;font-family:system-ui}main{height:${height}px;display:flex;align-items:center;justify-content:center;gap:${width < 500 ? 18 : 55}px;padding:24px}img{width:${width < 500 ? 96 : 220}px}h1{font-size:${width < 500 ? 30 : 72}px;color:#bd93f9;margin:0}p{font-size:${width < 500 ? 17 : 30}px;line-height:1.5;margin:12px 0}small{color:#b2b8d0}</style><main><img src="${icon}"><section><h1>KoalaClicker</h1><p>Choose a target.<br>Repeat clicks.<br>Stay in control.</p><small>Local settings · Open source</small></section></main></html>`,
    );
    await page.evaluate(() =>
      Promise.all([...document.images].map((image) => image.decode())),
    );
    await page.screenshot({ path: path.join(root, filename) });
  }
  fs.copyFileSync(
    path.join(root, "social-preview.png"),
    "website/assets/social-preview.png",
  );
  await page.setViewport({ width: 600, height: 220, deviceScaleFactor: 1 });
  await page.setContent(
    `<html><style>body{background:#1e1e2e;color:#eee;font:16px system-ui;display:flex;gap:45px;padding:30px}section{text-align:center}img{display:block;margin:15px auto}</style>${[16, 32, 48, 128].map((size) => `<section>${size}px<img src="${data("src/assets/Logo_Cut_" + (size === 32 ? 48 : size) + ".png")}" width="${size}" height="${size}"></section>`).join("")}</html>`,
  );
  await page.screenshot({ path: path.join(root, "icon-preview.png") });
  fs.writeFileSync(
    path.join(root, "preview.html"),
    `<!doctype html><html lang="en"><meta charset="utf-8"><title>KoalaClicker ${version} store package</title><style>body{background:#171925;color:#eee;font:18px system-ui;margin:40px}img{max-width:640px;width:100%}section{display:inline-block;margin:12px;vertical-align:top}a{color:#bd93f9}</style><h1>KoalaClicker ${version}</h1><p>Real browser captures with separate captions. Source details: <a href="SOURCES.md">SOURCES.md</a>.</p>${entries.map((file) => `<section><h2>${file}</h2><a href="${file}"><img src="${file}" alt="${file}"></a></section>`).join("")}<h2>Icons</h2><img src="icon-preview.png" alt="16, 32, 48 and 128 pixel icon views"></html>`,
  );
  console.log(
    "Store screenshots, promo tiles, social preview and visual index generated.",
  );
} finally {
  await browser.close();
}
