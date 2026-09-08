// Injected only after the user invokes the extension on this document.
(() => {
  if (globalThis.koalaClickerInjected) return;
  globalThis.koalaClickerInjected = true;
  const api = globalThis.browser || chrome;
  let documentToken = crypto.randomUUID();
  let route = location.href;
  let enabled = false;
  let revision = -1;
  let clickers = [];
  let selection = null;
  let hovered = null;
  const timers = new Map();
  const status = new Map();
  const host = document.createElement("div");
  host.style.cssText =
    "all:initial;position:fixed;inset:0;pointer-events:none;z-index:2147483647";
  const shadow = host.attachShadow({ mode: "closed" });
  const banner = document.createElement("div");
  banner.style.cssText =
    "display:none;pointer-events:auto;position:absolute;top:12px;left:50%;transform:translateX(-50%);max-width:90vw;background:#282a36;color:#f8f8f2;padding:14px;border:2px solid #bd93f9;border-radius:8px;font:14px system-ui";
  banner.setAttribute("role", "status");
  const label = document.createElement("span");
  const cancel = document.createElement("button");
  cancel.type = "button";
  cancel.textContent = "Cancel (Esc)";
  cancel.style.cssText =
    "margin-left:12px;padding:8px;background:#bd93f9;color:#1e1e2e;border:0;border-radius:4px";
  banner.append(label, cancel);
  shadow.append(banner);
  document.documentElement.append(host);
  cancel.addEventListener("click", () => exitSelection());

  function unhighlight() {
    if (hovered) hovered.classList.remove("koala-clicker-highlight");
    hovered = null;
  }
  function exitSelection() {
    selection = null;
    banner.style.display = "none";
    unhighlight();
    for (const type of [
      "pointerdown",
      "pointerup",
      "mousedown",
      "mouseup",
      "click",
      "dblclick",
      "auxclick",
      "contextmenu",
    ])
      window.removeEventListener(type, intercept, true);
    window.removeEventListener("mouseover", highlight, true);
    window.removeEventListener("keydown", escape, true);
  }
  function stop() {
    for (const timer of timers.values()) clearInterval(timer.handle);
    timers.clear();
    exitSelection();
    enabled = false;
    documentToken = crypto.randomUUID();
  }
  function validDocument() {
    if (!api.runtime.id || route !== location.href) {
      stop();
      route = location.href;
      return false;
    }
    return enabled;
  }
  function escape(event) {
    if (event.key === "Escape") {
      event.preventDefault();
      event.stopImmediatePropagation();
      exitSelection();
    }
  }
  function highlight(event) {
    if (event.composedPath().includes(host)) return;
    unhighlight();
    hovered = event.target;
    hovered?.classList?.add("koala-clicker-highlight");
  }
  function selectorFor(element) {
    if (
      !(element instanceof Element) ||
      element.getRootNode() !== document ||
      element.shadowRoot ||
      /^(iframe|frame|canvas)$/i.test(element.localName)
    )
      throw new Error(
        "Select a regular page element. Frames, Shadow DOM and canvas contents are not supported.",
      );
    const unique = (selector) =>
      document.querySelectorAll(selector).length === 1 &&
      document.querySelector(selector) === element;
    for (const attr of ["data-testid", "data-cy", "id"]) {
      const value = element.getAttribute(attr);
      if (!value) continue;
      const candidate = `[${attr}="${CSS.escape(value)}"]`;
      if (unique(candidate)) return candidate;
    }
    const path = [];
    let current = element;
    while (current instanceof Element) {
      const siblings = [
        ...(current.parentElement?.children || [current]),
      ].filter((item) => item.localName === current.localName);
      path.unshift(
        `${CSS.escape(current.localName)}:nth-of-type(${siblings.indexOf(current) + 1})`,
      );
      const candidate = path.join(" > ");
      if (candidate.length > KoalaClickerModel.MAX_SELECTOR_LENGTH) break;
      if (unique(candidate)) return candidate;
      current = current.parentElement;
    }
    throw new Error(
      "A unique selector could not be created. Select another element.",
    );
  }
  function notice(text) {
    label.textContent = text;
    cancel.textContent = "Close";
    banner.style.display = "block";
  }
  async function intercept(event) {
    if (!selection || event.composedPath().includes(host)) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    if (event.type !== "click") return;
    const selected = selection;
    try {
      if (!validDocument())
        throw new Error("The page changed. Reopen KoalaClicker.");
      const selector = selectorFor(event.composedPath()[0]);
      exitSelection();
      const result = await api.runtime.sendMessage({
        action: "STORE",
        op: selected.id ? "patch" : "add",
        url: route,
        token: documentToken,
        id: selected.id,
        selector,
        patch: { selector, active: false },
      });
      if (!result?.ok)
        throw new Error(result?.error || "Could not save the target.");
      if (!validDocument()) return;
      sync(result);
      notice("Target saved, stopped. Open KoalaClicker to start it.");
    } catch (error) {
      exitSelection();
      notice(error.message);
    }
  }
  function targetFor(selector) {
    try {
      const matches = document.querySelectorAll(selector);
      if (matches.length !== 1)
        return {
          reason: matches.length ? "Ambiguous target" : "Target missing",
        };
      const element = matches[0];
      const rect = element.getBoundingClientRect();
      const style = getComputedStyle(element);
      if (
        !rect.width ||
        !rect.height ||
        style.visibility !== "visible" ||
        element.closest('[inert], [hidden], [aria-disabled="true"]') ||
        element.matches(":disabled")
      )
        return { reason: "Target unavailable" };
      for (
        let ancestor = element;
        ancestor;
        ancestor = ancestor.parentElement
      ) {
        if (Number(getComputedStyle(ancestor).opacity) === 0)
          return { reason: "Target unavailable" };
      }
      const x = rect.left + rect.width / 2;
      const y = rect.top + rect.height / 2;
      const hit = document.elementFromPoint(x, y);
      if (!hit || !(hit === element || element.contains(hit)))
        return { reason: "Target covered or offscreen" };
      return { element, x, y };
    } catch {
      return { reason: "Invalid selector" };
    }
  }
  function tick(clicker) {
    if (!validDocument() || selection) return;
    const target = targetFor(clicker.selector);
    status.set(clicker.id, target.reason || "Running");
    if (!target.element) return;
    const options = {
      view: window,
      bubbles: true,
      cancelable: true,
      composed: true,
      clientX: target.x,
      clientY: target.y,
      button: 0,
      detail: 1,
    };
    // Synthetic mouse events remain untrusted. Page handlers may reject them.
    for (const type of ["mousedown", "mouseup", "click"]) {
      if (!validDocument() || !target.element.isConnected) break;
      target.element.dispatchEvent(
        new MouseEvent(type, {
          ...options,
          buttons: type === "mousedown" ? 1 : 0,
        }),
      );
    }
  }
  function sync(state) {
    if (!enabled || state.revision < revision) return;
    revision = state.revision;
    clickers = KoalaClickerModel.normalizeClickers(state.clickers);
    for (const [id, timer] of timers) {
      const item = clickers.find(
        (clicker) => clicker.id === id && clicker.active,
      );
      if (
        !item ||
        item.interval !== timer.interval ||
        item.selector !== timer.selector
      ) {
        clearInterval(timer.handle);
        timers.delete(id);
        status.delete(id);
      }
    }
    for (const clicker of clickers) {
      if (clicker.active && !timers.has(clicker.id))
        timers.set(clicker.id, {
          ...clicker,
          handle: setInterval(() => tick(clicker), clicker.interval),
        });
    }
  }
  api.storage.onChanged.addListener((changes, area) => {
    const key = `site:${location.origin}`;
    if (area !== "local" || !Object.hasOwn(changes, key)) return;
    const state = changes[key].newValue;
    if (validDocument())
      sync(state || { revision: revision + 1, clickers: [] });
  });
  api.runtime.onMessage.addListener((message, sender, respond) => {
    if (sender.id !== api.runtime.id) return false;
    if (message?.action === "PING") {
      if (route !== location.href) {
        stop();
        route = location.href;
      }
      respond({ ok: true, token: documentToken, url: location.href });
      return false;
    }
    if (message?.token !== documentToken || message.url !== location.href) {
      respond({ ok: false, error: "The page changed. Reopen KoalaClicker." });
      return false;
    }
    if (message.action === "INIT") {
      enabled = true;
      revision = -1;
      api.runtime.sendMessage({ action: "STORE", op: "get", url: route }).then(
        (result) => {
          if (result?.ok && validDocument()) sync(result);
          respond(result);
        },
        (error) => respond({ ok: false, error: error.message }),
      );
      return true;
    }
    if (!validDocument()) {
      respond({ ok: false, error: "Reopen KoalaClicker to resume this page." });
      return false;
    }
    if (message.action === "SELECT") {
      exitSelection();
      selection = { id: message.id };
      label.textContent = "Select a target. It will be saved stopped.";
      cancel.textContent = "Cancel (Esc)";
      banner.style.display = "block";
      for (const type of [
        "pointerdown",
        "pointerup",
        "mousedown",
        "mouseup",
        "click",
        "dblclick",
        "auxclick",
        "contextmenu",
      ])
        window.addEventListener(type, intercept, true);
      window.addEventListener("mouseover", highlight, true);
      window.addEventListener("keydown", escape, true);
    } else if (message.action === "STATUS") {
      respond({
        ok: true,
        states: Object.fromEntries(
          clickers.map((item) => [
            item.id,
            item.active
              ? targetFor(item.selector).reason || "Running"
              : "Stopped",
          ]),
        ),
      });
      return false;
    }
    respond({ ok: true });
    return false;
  });
  window.addEventListener("pagehide", stop);
  window.addEventListener("popstate", () => {
    stop();
    route = location.href;
  });
  window.addEventListener("hashchange", () => {
    stop();
    route = location.href;
  });
})();
