// KoalaClicker game compatibility helper (MAIN world).
// Runs in the page context so clicker games that track native timing state can keep responding.
if (!globalThis.__koalaClickerCompatibilityInterval) {
  globalThis.__koalaClickerCompatibilityInterval = setInterval(() => {
    if (typeof Game !== 'undefined' && typeof Game.lastClick !== 'undefined') {
      Game.lastClick = 0;
    }
  }, 10);
}
