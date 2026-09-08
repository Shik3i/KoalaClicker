document.addEventListener("DOMContentLoaded", async () => {
  const api = globalThis.browser || chrome;
  const model = KoalaClickerModel;
  const add = document.getElementById("add-clicker-btn");
  const stopAll = document.getElementById("stop-all-btn");
  const clear = document.getElementById("clear-btn");
  const list = document.getElementById("clickers-list");
  const empty = document.getElementById("empty-state");
  const feedback = document.getElementById("feedback");
  document.getElementById("version-label").textContent =
    `v${api.runtime.getManifest().version}`;
  let tab,
    token,
    revision = -1,
    state = [],
    pending = 0;
  function error(message) {
    feedback.textContent = message;
    feedback.className = "error";
  }
  async function page(action, extra = {}) {
    const result = await api.tabs.sendMessage(
      tab.id,
      { action, url: tab.url, token, ...extra },
      { frameId: 0 },
    );
    if (!result?.ok)
      throw new Error(
        result?.error || "Page unavailable. Reopen KoalaClicker.",
      );
    return result;
  }
  async function store(op, extra = {}) {
    pending++;
    feedback.className = "";
    feedback.textContent = "Saving…";
    try {
      // Dispatch immediately; no popup-owned debounce or delayed write survives closure.
      const result = await api.runtime.sendMessage({
        action: "STORE",
        op,
        url: tab.url,
        tabId: tab.id,
        token,
        ...extra,
      });
      if (!result?.ok)
        throw new Error(result?.error || "Storage failed. Try again.");
      if (result.revision >= revision) {
        revision = result.revision;
        state = result.clickers;
        render();
      }
      feedback.textContent = "Saved";
      return result;
    } catch (cause) {
      error(cause.message);
      throw cause;
    } finally {
      pending--;
    }
  }
  async function select(id) {
    add.disabled = true;
    try {
      await page("SELECT", { id });
      window.close();
    } catch (cause) {
      error(cause.message);
      add.disabled = false;
    }
  }
  function render() {
    empty.hidden = state.length !== 0;
    empty.textContent =
      "No saved clickers for this website. Add a target to begin.";
    add.disabled = state.length >= model.MAX_CLICKERS;
    stopAll.disabled = !state.some((item) => item.active);
    clear.disabled = state.length === 0;
    const ids = new Set(state.map((item) => item.id));
    for (const child of [...list.children])
      if (!ids.has(child.dataset.id)) child.remove();
    state.forEach((clicker, index) => {
      let item = [...list.children].find(
        (child) => child.dataset.id === clicker.id,
      );
      if (!item) {
        item = document.createElement("section");
        item.className = "clicker-item";
        item.dataset.id = clicker.id;
        const header = document.createElement("div");
        header.className = "clicker-header";
        const name = document.createElement("input");
        name.className = "clicker-name-input";
        name.maxLength = model.MAX_NAME_LENGTH;
        name.setAttribute("aria-label", `Clicker ${index + 1} name`);
        const badge = document.createElement("span");
        badge.className = "status-badge";
        badge.setAttribute("role", "status");
        header.append(name, badge);
        const controls = document.createElement("div");
        controls.className = "clicker-controls";
        const interval = document.createElement("input");
        interval.type = "number";
        interval.className = "interval-input";
        interval.min = model.MIN_INTERVAL;
        interval.max = model.MAX_INTERVAL;
        interval.step = "1";
        interval.setAttribute("aria-label", "Interval in milliseconds");
        const unit = document.createElement("span");
        unit.className = "interval-label";
        unit.textContent = "ms";
        const toggle = document.createElement("button");
        toggle.className = "btn-icon btn-stop";
        toggle.type = "button";
        const remove = document.createElement("button");
        remove.className = "btn-icon btn-remove";
        remove.textContent = "Delete";
        remove.type = "button";
        const target = document.createElement("button");
        target.className = "target-btn";
        target.type = "button";
        target.textContent = "Select target again";
        const patch = (value) =>
          store("patch", { id: clicker.id, patch: value }).catch(() => {});
        name.addEventListener("input", () => patch({ name: name.value }));
        interval.addEventListener("input", () => {
          if (!interval.value || !interval.checkValidity()) {
            interval.setAttribute("aria-invalid", "true");
            error(
              "Interval must be a whole number from 25 to 86400000 ms. Previous value remains saved.",
            );
            return;
          }
          interval.removeAttribute("aria-invalid");
          patch({ interval: Number(interval.value) });
        });
        interval.addEventListener("change", () => {
          if (!interval.value || !interval.checkValidity())
            interval.value =
              state.find((entry) => entry.id === clicker.id)?.interval ?? 250;
          interval.removeAttribute("aria-invalid");
        });
        toggle.addEventListener("click", async () => {
          toggle.disabled = true;
          try {
            await store("patch", {
              id: clicker.id,
              patch: {
                active: !state.find((entry) => entry.id === clicker.id)?.active,
              },
            });
          } catch {
          } finally {
            toggle.disabled = false;
          }
        });
        remove.addEventListener("click", async () => {
          remove.disabled = true;
          try {
            await store("delete", { id: clicker.id });
            add.focus();
          } catch {
          } finally {
            remove.disabled = false;
          }
        });
        target.addEventListener("click", () => select(clicker.id));
        controls.append(interval, unit, toggle, remove);
        item.append(header, controls, target);
        list.append(item);
      }
      const name = item.querySelector(".clicker-name-input");
      const interval = item.querySelector(".interval-input");
      if (document.activeElement !== name) name.value = clicker.name;
      if (document.activeElement !== interval)
        interval.value = clicker.interval;
      name.title = clicker.selector;
      const badge = item.querySelector(".status-badge");
      badge.textContent = clicker.active ? "Running" : "Stopped";
      badge.classList.toggle("stopped", !clicker.active);
      const toggle = item.querySelector(".btn-stop");
      toggle.textContent = clicker.active ? "Stop" : "Start";
      toggle.classList.toggle("is-stopped", !clicker.active);
    });
  }
  add.disabled = stopAll.disabled = clear.disabled = true;
  try {
    [tab] = await api.tabs.query({ active: true, currentWindow: true });
    if (!model.parseSiteUrl(tab?.url))
      throw new Error(
        "Cannot run on this page. Open a regular HTTP or HTTPS website.",
      );
    document.getElementById("site-label").textContent = new URL(
      tab.url,
    ).hostname;
    let ping;
    try {
      ping = await api.tabs.sendMessage(
        tab.id,
        { action: "PING" },
        { frameId: 0 },
      );
    } catch {
      await api.scripting.insertCSS({
        target: { tabId: tab.id, frameIds: [0] },
        files: ["/content/content.css"],
      });
      await api.scripting.executeScript({
        target: { tabId: tab.id, frameIds: [0] },
        files: ["/shared/model.js", "/content/content.js"],
      });
      ping = await api.tabs.sendMessage(
        tab.id,
        { action: "PING" },
        { frameId: 0 },
      );
    }
    if (ping?.url !== tab.url)
      throw new Error("The page changed. Reopen KoalaClicker.");
    token = ping.token;
    clear.disabled = false;
    clear.addEventListener("click", () => {
      if (confirm("Delete all saved clickers for this website?"))
        store("clear").catch(() => {});
    });
    const result = await page("INIT");
    revision = result.revision;
    state = result.clickers;
    render();
    feedback.textContent = "";
    add.addEventListener("click", () => select());
    stopAll.addEventListener("click", () => store("stopAll").catch(() => {}));
    api.storage.onChanged.addListener((changes, area) => {
      const value = changes[`site:${new URL(tab.url).origin}`]?.newValue;
      if (area === "local" && value && value.revision > revision) {
        revision = value.revision;
        state = value.clickers;
        render();
      }
    });
    async function statuses() {
      try {
        const result = await page("STATUS");
        for (const item of list.children) {
          const badge = item.querySelector(".status-badge");
          if (result.states[item.dataset.id])
            badge.textContent = result.states[item.dataset.id];
        }
      } catch (cause) {
        error(cause.message);
        add.disabled = true;
      }
    }
    await statuses();
    setInterval(statuses, 1000);
  } catch (cause) {
    error(
      `${cause.message} Browser store pages and protected pages may block access.`,
    );
    empty.textContent =
      "Switch to a supported website, then reopen KoalaClicker.";
  }
});
