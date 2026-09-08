import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { setTimeout as delay } from "node:timers/promises";
export async function until(read, predicate = Boolean, timeout = 15000) {
  const deadline = Date.now() + timeout;
  let value;
  while (Date.now() < deadline) {
    value = await read();
    if (predicate(value)) return value;
    await delay(50);
  }
  throw new Error(
    `Timed out waiting for browser state: ${JSON.stringify(value)}`,
  );
}
function decode(value) {
  if (value?.type === "array") return value.value.map(decode);
  if (value?.type === "object")
    return Object.fromEntries(value.value.map(([k, v]) => [k, decode(v)]));
  if (value?.type === "null") return null;
  return value?.value;
}
export async function launchFirefox() {
  const profile = fs.mkdtempSync(
    path.join(os.tmpdir(), "koalaclicker-firefox-"),
  );
  const executable =
    process.env.KOALACLICKER_FIREFOX ||
    (process.platform === "win32"
      ? "C:/Program Files/Mozilla Firefox/firefox.exe"
      : "firefox");
  const child = spawn(
    executable,
    [
      "--headless",
      "--no-remote",
      "--remote-allow-system-access",
      "--profile",
      profile,
      "--remote-debugging-port=0",
    ],
    { stdio: ["ignore", "pipe", "pipe"] },
  );
  let output = "",
    launchError;
  child.on("error", (error) => {
    launchError = error;
  });
  child.stderr.on("data", (bytes) => {
    output += bytes;
  });
  child.stdout.on("data", (bytes) => {
    output += bytes;
  });
  let socket;
  try {
    const endpoint = await until(() => {
      if (launchError) throw launchError;
      return output.match(/WebDriver BiDi listening on (ws:\/\/[^\s]+)/)?.[1];
    });
    socket = new WebSocket(endpoint + "/session");
    await new Promise((resolve, reject) => {
      socket.onopen = resolve;
      socket.onerror = reject;
    });
    let id = 0;
    const pending = new Map();
    socket.onmessage = (event) => {
      const message = JSON.parse(event.data);
      if (!message.id) return;
      const job = pending.get(message.id);
      if (!job) return;
      pending.delete(message.id);
      clearTimeout(job.timer);
      if (message.type === "error")
        job.reject(new Error(`${message.error}: ${message.message}`));
      else job.resolve(message.result);
    };
    const send = (method, params = {}) =>
      new Promise((resolve, reject) => {
        const n = ++id;
        const timer = setTimeout(() => {
          pending.delete(n);
          reject(new Error(`BiDi timeout: ${method}`));
        }, 15000);
        pending.set(n, { resolve, reject, timer });
        socket.send(JSON.stringify({ id: n, method, params }));
      });
    const session = await send("session.new", {
      capabilities: { alwaysMatch: {} },
    });
    const contexts = async () =>
      (await send("browsingContext.getTree")).contexts;
    class Page {
      constructor(context) {
        this.context = context;
        this.keyboard = {
          press: async (key) => {
            if (key !== "Escape") throw Error("Unsupported test key");
            await send("input.performActions", {
              context,
              actions: [
                {
                  type: "key",
                  id: "keyboard",
                  actions: [
                    { type: "keyDown", value: "\uE00C" },
                    { type: "keyUp", value: "\uE00C" },
                  ],
                },
              ],
            });
          },
        };
      }
      async evaluate(fn, ...args) {
        const expression =
          typeof fn === "string"
            ? fn
            : `(${fn.toString()})(...${JSON.stringify(args)})`;
        const result = await send("script.evaluate", {
          expression,
          target: { context: this.context },
          awaitPromise: true,
          resultOwnership: "none",
        });
        if (result.type === "exception")
          throw new Error(result.exceptionDetails.text);
        return decode(result.result);
      }
      async $eval(selector, fn, ...args) {
        return this.evaluate(
          `(${fn.toString()})(document.querySelector(${JSON.stringify(selector)}),...${JSON.stringify(args)})`,
        );
      }
      async waitForFunction(fn) {
        return until(() => this.evaluate(fn));
      }
      async waitForSelector(selector) {
        return until(() =>
          this.evaluate(
            (selector) => Boolean(document.querySelector(selector)),
            selector,
          ),
        );
      }
      async goto(url) {
        await send("browsingContext.navigate", {
          context: this.context,
          url,
          wait: "complete",
        });
        await this.waitForFunction(
          `location.href===${JSON.stringify(url)}&&document.readyState==='complete'`,
        );
      }
      async reload() {
        await send("browsingContext.reload", {
          context: this.context,
          wait: "complete",
        });
      }
      async bringToFront() {
        await send("browsingContext.activate", { context: this.context });
      }
      async close() {
        await send("browsingContext.close", { context: this.context });
      }
      async screenshot({ path: outputPath }) {
        await this.evaluate(async () => {
          const tab = await browser.tabs.getCurrent();
          await browser.tabs.update(tab.id, { active: true });
        });
        const data = await this.evaluate(() =>
          browser.tabs.captureVisibleTab({ format: "png" }),
        );
        fs.writeFileSync(outputPath, Buffer.from(data.split(",")[1], "base64"));
      }
      async click(selector) {
        const point = await this.$eval(selector, (element) => {
          element.scrollIntoView({ block: "center" });
          const r = element.getBoundingClientRect();
          return {
            x: Math.round(r.left + r.width / 2),
            y: Math.round(r.top + r.height / 2),
          };
        });
        await send("input.performActions", {
          context: this.context,
          actions: [
            {
              type: "pointer",
              id: "mouse",
              parameters: { pointerType: "mouse" },
              actions: [
                { type: "pointerMove", x: point.x, y: point.y },
                { type: "pointerDown", button: 0 },
                { type: "pointerUp", button: 0 },
              ],
            },
          ],
        });
      }
    }
    return {
      send,
      Page,
      contexts,
      version: async () => `Firefox/${session.capabilities.browserVersion}`,
      async newPage() {
        const result = await send("browsingContext.create", { type: "tab" });
        return new Page(result.context);
      },
      async close() {
        try {
          await send("browser.close");
        } catch {
        } finally {
          socket.close();
          child.kill();
        }
      },
    };
  } catch (error) {
    socket?.close();
    child.kill();
    throw error;
  }
}
