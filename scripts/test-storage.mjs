import test from "node:test";
import assert from "node:assert/strict";
import vm from "node:vm";
import fs from "node:fs";
import { randomUUID } from "node:crypto";
const modelSource = fs.readFileSync(
  new URL("../src/shared/model.js", import.meta.url),
  "utf8",
);
const workerSource = fs.readFileSync(
  new URL("../src/background.js", import.meta.url),
  "utf8",
);
function harness(initial = {}) {
  const data = structuredClone(initial);
  let listener,
    failWrite = false,
    failRemove = false;
  const api = {
    runtime: {
      id: "test",
      getURL: (value) => `chrome-extension://test/${value}`,
      onMessage: {
        addListener(fn) {
          listener = fn;
        },
      },
    },
    tabs: {
      async sendMessage() {
        return { token: "current", url: "https://example.com/path" };
      },
    },
    storage: {
      local: {
        async get(keys) {
          await new Promise((resolve) => setTimeout(resolve, 1));
          return structuredClone(
            Object.fromEntries(
              (keys || Object.keys(data))
                .filter((key) => Object.hasOwn(data, key))
                .map((key) => [key, data[key]]),
            ),
          );
        },
        async set(values) {
          await new Promise((resolve) => setTimeout(resolve, 1));
          if (failWrite) throw new Error("QUOTA_BYTES");
          Object.assign(data, structuredClone(values));
        },
        async remove(keys) {
          if (failRemove) throw new Error("REMOVE_FAILED");
          keys.forEach((key) => delete data[key]);
        },
      },
    },
  };
  const context = vm.createContext({
    chrome: api,
    URL,
    crypto: { randomUUID },
    setTimeout,
  });
  vm.runInContext(modelSource, context);
  vm.runInContext(workerSource, context);
  return {
    data,
    failWrite(value) {
      failWrite = value;
    },
    failRemove(value) {
      failRemove = value;
    },
    send(op, extra = {}, sender = { id: "test" }) {
      return new Promise((resolve) =>
        listener(
          { action: "STORE", url: "https://example.com/path", op, ...extra },
          sender,
          resolve,
        ),
      );
    },
  };
}
test("parallel additions and field patches never replace another writer", async () => {
  const h = harness();
  const results = await Promise.all(
    Array.from({ length: 30 }, (_, index) =>
      h.send("add", { selector: `#target-${index}` }),
    ),
  );
  assert.ok(results.every((result) => result.ok));
  let state = await h.send("get");
  assert.equal(state.clickers.length, 30);
  const id = state.clickers[0].id;
  await Promise.all([
    h.send("patch", { id, patch: { name: "Renamed" } }),
    h.send("patch", { id, patch: { interval: 600, active: true } }),
  ]);
  state = await h.send("get");
  assert.equal(state.clickers[0].name, "Renamed");
  assert.equal(state.clickers[0].interval, 600);
  assert.equal(state.clickers[0].active, true);
});
test("delete followed by stale edit cannot resurrect a clicker; stop-all is atomic", async () => {
  const h = harness();
  const created = await h.send("add", { selector: "#target" });
  const id = created.clickers[0].id;
  await h.send("patch", { id, patch: { active: true } });
  await h.send("stopAll");
  assert.equal((await h.send("get")).clickers[0].active, false);
  await h.send("delete", { id });
  assert.equal(
    (await h.send("patch", { id, patch: { name: "Late edit" } })).ok,
    false,
  );
  assert.equal((await h.send("get")).clickers.length, 0);
});
test("migration preserves old data on write failure and queue recovers", async () => {
  const old = [
    { id: "a", selector: "#target", interval: 5, name: "Old", active: true },
  ];
  const h = harness({ "https://example.com/path": old });
  h.failWrite(true);
  const failed = await h.send("get");
  assert.equal(failed.ok, false);
  assert.equal(failed.error, "QUOTA_BYTES");
  assert.deepEqual(h.data["https://example.com/path"], old);
  assert.equal(h.data["site:https://example.com"], undefined);
  h.failWrite(false);
  const success = await h.send("get");
  assert.equal(success.clickers[0].interval, 25);
  assert.equal(h.data["https://example.com/path"], undefined);
});
test("migration retries failed cleanup without discarding the committed copy", async () => {
  const h = harness({ "https://example.com/path": [{ selector: "#a" }] });
  h.failRemove(true);
  assert.equal((await h.send("get")).ok, false);
  assert.equal(h.data["site:https://example.com"].clickers.length, 1);
  h.failRemove(false);
  assert.equal((await h.send("get")).clickers.length, 1);
  assert.equal(h.data["https://example.com/path"], undefined);
});

test("oversized legacy and current records are preserved until explicit clear", async () => {
  const clickers = Array.from({ length: 51 }, (_, index) => ({
    id: String(index),
    selector: `#target-${index}`,
  }));
  for (const initial of [
    { "https://example.com/path": clickers },
    { "site:https://example.com": { revision: 1, clickers } },
  ]) {
    const h = harness(initial);
    assert.equal((await h.send("get")).ok, false);
    assert.deepEqual(h.data, initial);
    assert.equal((await h.send("clear")).ok, true);
    assert.equal((await h.send("get")).clickers.length, 0);
  }
});

test("failed legacy cleanup cannot duplicate IDs or resurrect a deleted target", async () => {
  const h = harness({
    "https://example.com/one": [{ id: "same", selector: "#one" }],
    "https://example.com/two": [{ id: "same", selector: "#two" }],
  });
  h.failRemove(true);
  assert.equal((await h.send("get")).ok, false);
  const id = h.data["site:https://example.com"].clickers[0].id;
  assert.equal((await h.send("delete", { id })).ok, false);
  assert.equal(h.data["site:https://example.com"].clickers.length, 1);
  h.failRemove(false);
  const result = await h.send("get");
  assert.equal(result.ok, true);
  assert.equal(result.clickers.length, 1);
  assert.equal(result.clickers[0].selector, "#two");
  assert.equal(h.data["https://example.com/two"], undefined);
});
test("corrupt records, duplicate IDs and limits normalize deterministically", async () => {
  const h = harness({
    "https://example.com": [
      { id: "__proto__", selector: "#a" },
      { id: "__proto__", selector: "#b" },
      null,
      { selector: "" },
    ],
  });
  const result = await h.send("get");
  assert.equal(result.clickers.length, 2);
  assert.equal(new Set(result.clickers.map((item) => item.id)).size, 2);
  for (let i = 2; i < 50; i++)
    assert.equal((await h.send("add", { selector: `#a${i}` })).ok, true);
  assert.equal((await h.send("add", { selector: "#overflow" })).ok, false);
  const id = result.clickers[0].id;
  for (const interval of ["", -1, 0, 24, 86400001, "123abc", 1.5])
    assert.equal(
      (await h.send("patch", { id, patch: { interval } })).ok,
      false,
    );
  for (const interval of [25, 86400000])
    assert.equal((await h.send("patch", { id, patch: { interval } })).ok, true);
  assert.equal(
    (await h.send("patch", { id, patch: { selector: "a".repeat(2049) } })).ok,
    false,
  );
});
test("rejects foreign origins, subframes, untrusted senders and stale documents", async () => {
  const h = harness();
  assert.equal(
    (await h.send("add", { selector: "#x" }, { id: "other" })).ok,
    false,
  );
  assert.equal(
    (
      await h.send(
        "add",
        { selector: "#x" },
        { id: "test", tab: { id: 1 }, frameId: 0, url: "https://other.com" },
      )
    ).ok,
    false,
  );
  assert.equal(
    (
      await h.send(
        "get",
        {},
        { id: "test", tab: { id: 1 }, frameId: 1, url: "https://example.com" },
      )
    ).ok,
    false,
  );
  assert.equal(
    (await h.send("add", { selector: "#x", tabId: 1, token: "stale" })).ok,
    false,
  );
  assert.equal((await h.send("get")).clickers.length, 0);
});

test("migration merges legacy paths without dropping distinct same-selector targets or other origins", async () => {
  const h = harness({
    "https://example.com": [{ id: "a", selector: "#target" }],
    "https://example.com/first": [
      { id: "a", selector: "#target" },
      { id: "b", selector: "#target" },
    ],
    "https://example.com/second": [{ id: "c", selector: "#other" }],
    "https://other.com": [{ id: "other", selector: "#untouched" }],
  });
  const state = await h.send("get");
  assert.equal(state.clickers.length, 3);
  assert.deepEqual(
    Array.from(state.clickers, (item) => item.id),
    ["a", "b", "c"],
  );
  assert.equal(h.data["https://example.com/first"], undefined);
  assert.equal(h.data["https://other.com"][0].id, "other");
});
