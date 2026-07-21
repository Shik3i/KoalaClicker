// KoalaClicker game compatibility helper (MAIN world).
// This compatibility adjustment is intentionally limited to the official
// Cookie Clicker host and runs only before a user-configured click.
(() => {
  const supportedHosts = new Set(['orteil.dashnet.org']);

  if (supportedHosts.has(location.hostname) && !globalThis.__koalaClickerCompatibilityInstalled) {
    globalThis.__koalaClickerCompatibilityInstalled = true;

    document.addEventListener('koala-clicker:before-click', () => {
      if (typeof Game !== 'undefined' && typeof Game.lastClick !== 'undefined') {
        Game.lastClick = 0;
      }
    });
  }
})();
