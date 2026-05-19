# Extension Reviewer Guide

Welcome, Chrome Web Store and Firefox Add-ons review teams! 

KoalaClicker is a modern, privacy-focused auto-clicker built strictly with vanilla web technologies (HTML, CSS, and JS). We understand and appreciate your thoroughness in auditing browser extensions. This document is created to make your review process as smooth and fast as possible by explaining our architecture, permissions, and providing a quick test case.

---

## 🔒 Permission & Security Justifications

We operate under a strict **"Privacy-First"** and **"Zero-Telemetry"** model. The extension has no background tracking scripts, no external font/API calls, and no network access. All data remains exclusively on the user's local machine.

### 1. `activeTab`
*   **Why it is needed:** To interact with the current webpage *only when the user explicitly triggers it*.
*   **Security compliance:** Instead of asking for broad host permissions (e.g. `<all_urls>` or broad access to read all sites the user visits), we use `activeTab`. The extension does not run, load, or have any permissions on any page until the user clicks the extension's toolbar icon.

### 2. `storage`
*   **Why it is needed:** To store configured clicker settings (CSS selectors, intervals, and active/inactive states) locally on the user's device.
*   **Security compliance:** We use `chrome.storage.local`. All configurations are mapped strictly to the active tab's origin and path. **Absolutely no data is ever sent over the network**—the extension does not even declare the `declarativeNetRequest` or standard fetch permissions.

### 3. `scripting`
*   **Why it is needed:** To inject the main content script (`src/content/content.js`) and the lightweight game-engine bypass helper (`src/content/bypass.js`) into the active tab context.
*   **Security compliance:** Scripts are only injected dynamically upon user interaction (when they click the extension icon to manage clickers). We do not load any remote code. All code is completely local and packaged within the extension zip, meeting the standard MV3 security guidelines.

---

## ⚡ Game-Engine Bypass (`bypass.js`) and `web_accessible_resources`

In `manifest.json`, we declare `content/bypass.js` under `web_accessible_resources` and inject it into the active webpage.

*   **The Problem:** Many modern idle-games or web apps include anti-cheat systems that block automated clicks by checking game loops (e.g., in game engines like *Cookie Clicker*, the script checks `Game.lastClick` to detect inhuman clicking speed and blocks them).
*   **Our Solution:** To ensure compatibility, `content/bypass.js` is injected into the **`MAIN` JS execution world** of the webpage.
*   **Safety Audit:** The `bypass.js` file is extremely lightweight (only a few lines of code) and does nothing more than periodically set `window.Game.lastClick = 0` or similar variables if they exist in the page context. It has **no access** to extension storage, no network capability, and performs no cross-site scripting or credential extraction. It exists solely to let users play their favorite local games comfortably.

---

## 🧪 Quick 2-Step Review Verification

To verify that KoalaClicker behaves exactly as specified, you can test it on any standard button in seconds:

1.  **Open any simple test page** (e.g., [https://www.w3schools.com/tags/tryit.asp?filename=tryhtml_button_test](https://www.w3schools.com/tags/tryit.asp?filename=tryhtml_button_test) or any web-based clicker game).
2.  **Click the KoalaClicker Extension Icon** in the toolbar. The popup will load.
3.  **Click "Add New Clicker"**. The popup will automatically close and enter **Element Selection Mode** (you will see a sleek dark floating banner at the top of the webpage).
4.  **Hover and Click any Button** on the page. The extension will highlight the targeted button with a pulsing border, save its unique path, and instantly begin clicking it at your specified interval!
5.  **Reopen the Popup** to view active clickers, dynamically adjust their speed in milliseconds, rename them, or delete them safely.

---

Thank you for your dedication to keeping the extension ecosystem safe! If you have any technical questions or need further clarifications, please feel free to open a thread on our [GitHub Issues](https://github.com/Shik3i/KoalaClicker/issues).
