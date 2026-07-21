(() => {
  const MIN_INTERVAL = 25;
  const MAX_INTERVAL = 86400000;
  const MAX_CLICKERS = 50;
  const MAX_NAME_LENGTH = 80;
  const MAX_SELECTOR_LENGTH = 2048;

  function parseSiteUrl(value) {
    try {
      const url = new URL(value);
      return url.protocol === 'http:' || url.protocol === 'https:' ? url : null;
    } catch {
      return null;
    }
  }

  function fallbackId(selector, index) {
    let hash = 2166136261;
    for (const char of selector) {
      hash ^= char.charCodeAt(0);
      hash = Math.imul(hash, 16777619);
    }
    return `migrated-${index}-${(hash >>> 0).toString(16)}`;
  }

  function normalizeClickers(value) {
    if (!Array.isArray(value)) return [];

    return value.slice(0, MAX_CLICKERS).flatMap((clicker, index) => {
      if (!clicker || typeof clicker !== 'object') return [];
      if (typeof clicker.selector !== 'string' || !clicker.selector || clicker.selector.length > MAX_SELECTOR_LENGTH) return [];

      const parsedInterval = parseInt(clicker.interval, 10);
      const interval = Math.min(MAX_INTERVAL, Math.max(MIN_INTERVAL, Number.isFinite(parsedInterval) ? parsedInterval : 250));
      const id = typeof clicker.id === 'string' && clicker.id
        ? clicker.id.slice(0, 128)
        : fallbackId(clicker.selector, index);
      const name = typeof clicker.name === 'string' && clicker.name.trim()
        ? clicker.name.trim().slice(0, MAX_NAME_LENGTH)
        : `Clicker ${index + 1}`;

      return [{ selector: clicker.selector, name, interval, active: clicker.active === true, id }];
    });
  }

  globalThis.KoalaClickerModel = Object.freeze({
    MAX_INTERVAL,
    MAX_NAME_LENGTH,
    MIN_INTERVAL,
    normalizeClickers,
    parseSiteUrl
  });
})();
