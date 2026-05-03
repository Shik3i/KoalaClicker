# KoalaClicker Architecture

This document explains the technical foundation and data flows of the KoalaClicker extension. It is built entirely with Vanilla JavaScript, HTML, and CSS, adhering to Manifest V3 standards.

## 1. Core Principles
- **Zero Dependencies**: The project uses no external libraries. Everything is built natively for maximum performance and minimal footprint.
- **Privacy-First (activeTab)**: The extension uses the `activeTab` permission. It only ever gains access to a web page when the user explicitly clicks the extension icon in the toolbar. It does **not** automatically inject scripts on page load.
- **Stateless Content Scripts**: Because the `activeTab` permission drops upon page reload, the content script relies on `chrome.storage.local` to restore state if the user clicks the extension icon again.

## 2. Component Overview

### A. The Popup (`src/popup/`)
The popup acts as the control center.
- **Responsibilities**: Displays active clickers, allows adding/removing clickers, and modifies the click intervals.
- **Initialization**: Upon opening, it checks `chrome.storage.local` using the current tab's Origin + Pathname as the key. If clickers exist, it renders them. It also injects the content script into the active tab if it's not already running.

### B. The Content Script (`src/content/`)
The script injected into the active webpage.
- **Responsibilities**: Handles the DOM traversal for element selection, generates unique CSS selectors, and runs the actual `setInterval` auto-clicking loops.
- **Isolation**: Uses an IIFE to avoid polluting the global window object.

## 3. Data Flow & Communication

The extension relies heavily on Message Passing between the Popup and the Content Script.

### Example Flow: Adding a New Clicker
1. **User Action**: The user clicks "Add New Clicker" in the popup.
2. **Popup Action**: The popup sends a message to the content script and closes itself so the user can interact with the page.
   ```javascript
   chrome.tabs.sendMessage(tab.id, { action: 'ENTER_SELECTION_MODE', url: siteKey });
   window.close();
   ```
3. **Content Script Action**: Receives the message, displays a banner, and adds `mouseover` and `click` listeners to highlight elements.
4. **Element Selection**: The user clicks an element on the page. The content script prevents the default click behavior, generates a unique DOM path selector, and saves it to storage.
   ```javascript
   const selector = generateSelector(e.target);
   chrome.storage.local.get([currentSiteKey], (result) => {
     // Append new clicker and save
     chrome.storage.local.set({ [currentSiteKey]: updatedClickers }, () => {
       syncClickers(updatedClickers); // Start the interval
     });
   });
   ```

### Example Flow: Syncing Timers
Whenever the popup updates a clicker's interval or toggles its state, it saves to storage and sends a `SYNC_CLICKERS` message:
```javascript
// Popup
chrome.tabs.sendMessage(tab.id, { action: 'SYNC_CLICKERS', clickers: updatedList, url: siteKey });
```
```javascript
// Content Script
function syncClickers(clickers) {
  // Clear any timers that are no longer active
  // Restart timers for active clickers with the exact requested interval
  activeTimers[clicker.id] = setInterval(() => {
    triggerClick(clicker.selector);
  }, clicker.interval);
}
```

## 4. DOM Selector Generation
To ensure we can find the element again even if the page is slightly reloaded, the content script generates a robust CSS selector.
If the element has an ID, it uses the ID. If not, it builds a structural path up the DOM tree using `:nth-of-type()`.
```javascript
// Example generated output:
"body > div#app > main > button:nth-of-type(2)"
```

## 5. Build Pipeline
The `.github/workflows/release.yml` handles creating production-ready `.zip` files.
When a tag like `v1.0.5` is pushed:
1. It extracts `1.0.5` and injects it into `manifest.json`.
2. It zips the `src/` folder for Chrome.
3. It dynamically injects `browser_specific_settings` (required for Firefox MV3) into the manifest and zips the folder for Firefox.
4. It creates a GitHub release and attaches the ZIPs.
