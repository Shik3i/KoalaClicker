// KoalaClicker game compatibility helper (MAIN world).
// Runs only immediately before an active clicker dispatches a click. This avoids
// permanent polling and leaves page state untouched while KoalaClicker is idle.
if (!globalThis.__koalaClickerCompatibilityInstalled) {
  globalThis.__koalaClickerCompatibilityInstalled = true;

  document.addEventListener('koala-clicker:before-click', () => {
    if (typeof Game !== 'undefined' && typeof Game.lastClick !== 'undefined') {
      Game.lastClick = 0;
    }
  });
}
