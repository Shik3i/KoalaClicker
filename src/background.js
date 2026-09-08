/* One writer for every popup and document. A failed operation does not poison the queue. */
if (typeof importScripts === "function") importScripts("shared/model.js");
(() => {
  let queue = Promise.resolve();
  const model = KoalaClickerModel;
  const api = globalThis.browser || chrome;
  async function execute(message, sender) {
    if (sender.id !== api.runtime.id) throw new Error("Untrusted sender.");
    const url = model.parseSiteUrl(message.url);
    if (!url) throw new Error("Open a regular HTTP or HTTPS page.");
    const extensionPage = sender.url?.startsWith(api.runtime.getURL(""));
    const tabId = extensionPage
      ? message.tabId
      : (sender.tab?.id ?? message.tabId);
    if (message.token && Number.isInteger(tabId)) {
      const document = await api.tabs.sendMessage(
        tabId,
        { action: "PING" },
        { frameId: 0 },
      );
      if (document?.token !== message.token || document?.url !== message.url)
        throw new Error("The page changed. Reopen KoalaClicker.");
    }
    if (
      sender.tab &&
      !extensionPage &&
      (sender.frameId !== 0 ||
        model.parseSiteUrl(sender.url)?.origin !== url.origin)
    ) {
      throw new Error("The page changed. Reopen KoalaClicker.");
    }
    const key = `site:${url.origin}`;
    const stored = await api.storage.local.get(null);
    const existing = stored[key];
    const oldKeys = Object.keys(stored)
      .filter((old) => model.parseSiteUrl(old)?.origin === url.origin)
      .sort();
    let clickers = model.normalizeClickers(existing?.clickers);
    for (const old of oldKeys) {
      const imported = model.normalizeClickers(stored[old]);
      for (const item of imported) {
        if (
          !clickers.some(
            (saved) => saved.id === item.id && saved.selector === item.selector,
          )
        )
          clickers.push(item);
      }
    }
    if (clickers.length > model.MAX_CLICKERS && message.op !== "clear")
      throw new Error(
        "Legacy data contains more than 50 targets. Delete all for this website to reset it; existing data has been preserved.",
      );
    clickers = model.normalizeClickers(clickers);
    const before = JSON.stringify(clickers);
    const op = message.op;
    if (op === "add") {
      if (clickers.length >= model.MAX_CLICKERS)
        throw new Error("Maximum of 50 clickers per website reached.");
      if (
        typeof message.selector !== "string" ||
        !message.selector ||
        message.selector.length > model.MAX_SELECTOR_LENGTH
      )
        throw new Error("This target cannot be saved. Select another element.");
      clickers.push({
        id: crypto.randomUUID(),
        selector: message.selector,
        name: `Clicker ${clickers.length + 1}`,
        interval: 250,
        active: false,
      });
    } else if (op === "patch") {
      const clicker = clickers.find((item) => item.id === message.id);
      if (!clicker)
        throw new Error("This clicker was deleted. Reopen KoalaClicker.");
      const patch = message.patch || {};
      for (const field of ["name", "interval", "active", "selector"]) {
        if (!Object.hasOwn(patch, field)) continue;
        if (
          field === "interval" &&
          (!Number.isInteger(Number(patch[field])) ||
            Number(patch[field]) < model.MIN_INTERVAL ||
            Number(patch[field]) > model.MAX_INTERVAL)
        )
          throw new Error(
            "Interval must be a whole number from 25 to 86400000 ms.",
          );
        if (
          field === "selector" &&
          (typeof patch[field] !== "string" ||
            !patch[field] ||
            patch[field].length > model.MAX_SELECTOR_LENGTH)
        )
          throw new Error("This target cannot be saved.");
        if (field === "active" && typeof patch[field] !== "boolean")
          throw new Error("Invalid running state.");
        clicker[field] = patch[field];
      }
    } else if (op === "delete")
      clickers = clickers.filter((item) => item.id !== message.id);
    else if (op === "stopAll")
      clickers.forEach((item) => {
        item.active = false;
      });
    else if (op === "clear") clickers = [];
    else if (op !== "get") throw new Error("Unknown operation.");
    clickers = model.normalizeClickers(clickers);
    const changed =
      !existing ||
      oldKeys.length > 0 ||
      before !== JSON.stringify(clickers) ||
      JSON.stringify(existing.clickers) !== JSON.stringify(clickers);
    const state = {
      revision:
        (Number.isSafeInteger(existing?.revision) ? existing.revision : 0) +
        (changed ? 1 : 0),
      clickers,
    };
    if (changed) await api.storage.local.set({ [key]: state });
    // Never delete the old copy before the new record is durably stored.
    if (oldKeys.length) await api.storage.local.remove(oldKeys);
    return { ok: true, ...state };
  }
  api.runtime.onMessage.addListener((message, sender, respond) => {
    if (message?.action !== "STORE") return false;
    const job = queue.then(() => execute(message, sender));
    queue = job.catch(() => {});
    job.then(respond, (error) =>
      respond({
        ok: false,
        error: error.message || "Storage failed. Try again.",
      }),
    );
    return true;
  });
})();
