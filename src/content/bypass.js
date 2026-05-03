// KoalaClicker Game Engine Bypass (MAIN World)
// This script runs in the webpage's native context to bypass anti-cheat cooldowns.
setInterval(() => {
  if (typeof Game !== 'undefined' && typeof Game.lastClick !== 'undefined') {
    Game.lastClick = 0;
  }
}, 10);
