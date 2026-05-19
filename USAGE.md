# KoalaClicker User Guide & FAQ

Welcome to **KoalaClicker**! This guide is designed to help you get the most out of your modern, lightweight, privacy-focused auto-clicker. 

---

## 🚀 Quick Start Guide

Getting KoalaClicker up and running takes less than 10 seconds!

### Step 1: Open the Extension
Navigate to the webpage where you want to automate clicks, and click the **KoalaClicker icon** in your browser's toolbar. 

### Step 2: Add a Clicker
*   Click the purple **"Add New Clicker"** button in the popup.
*   The popup will automatically close, and you will enter **Element Selection Mode** (indicated by a floating banner at the top of your screen).
*   Simply hover over any clickable element on the page (like a button, image, or link) and **click it**. 

### Step 3: Configure and Click!
*   The element will immediately start being clicked. 
*   Reopen the popup at any time to:
    *   **Toggle active status**: Start or stop individual clickers instantly.
    *   **Adjust interval**: Type a custom click speed in milliseconds (`ms`). The minimum interval is a blazing-fast **25ms** (40 clicks per second!).
    *   **Rename**: Give your clickers descriptive names (e.g. *"Main Cookie"*, *"Buy Upgrade"*).
    *   **Delete**: Remove clickers you no longer need.

---

## 🔒 Understanding the "Privacy-First" Model

Most browser clickers ask for permissions to read all your data on all websites at all times. KoalaClicker does not.

To protect your credentials and browsing history, we use the `activeTab` permission. This means:
1.  **Strict Isolation**: KoalaClicker has **no access** to any tab until you explicitly click the extension icon on that page.
2.  **Page Reloads**: If you reload a page, the browser automatically revokes our access for safety. **Don't worry!** If you want to resume clicking, simply click the extension toolbar icon again. The extension will automatically detect your previously configured clickers for that site and load them instantly!

---

## 💡 Advanced Tips

### 🏎️ Maximize Clicking Speed (Bypassing Limits)
Some games or websites have anti-cheat mechanisms that try to detect automated clicks by reading timing offsets.
*   KoalaClicker features an **automatic game-engine bypass** (injected securely as `bypass.js`).
*   It continually resets common anti-cheat variables (such as `Game.lastClick` in *Cookie Clicker*) to ensure your clicks register even at ultra-low intervals like **25ms**.
*   To keep your browser responsive, we recommend keeping intervals above **50ms** if you have more than 10 clickers active simultaneously.

### 🎯 Targeting Elements Without IDs
Many modern websites use dynamic, randomized CSS class names and IDs (e.g., `button-abc123xyz` or `css-92hf84`). 
*   KoalaClicker automatically detects and bypasses these dynamic IDs using smart pattern matching.
*   If an element does not have a stable ID, it climbs up the DOM tree and creates a robust structural path (e.g. `body > div > main > button:nth-of-type(3)`).
*   If a button is not registering, try selecting its parent container or target the text directly!

---

## ❓ Frequently Asked Questions (FAQ)

#### Q: Why does the popup close when I click "Add New Clicker"?
**A:** This is a design feature! In order to let you hover and select elements directly on the active webpage, the popup must close so the browser returns focus to the web page.

#### Q: Why did the clicking stop after I reloaded the page?
**A:** For your security, the browser strips all active permissions from extensions upon page reload. Simply click the extension icon in the toolbar, and KoalaClicker will immediately resume all your active clickers exactly where you left off.

#### Q: Does KoalaClicker send my data anywhere?
**A:** **No.** KoalaClicker operates 100% locally on your computer. It does not use any cloud servers, analytics tools, or tracking pixels. Your configurations are saved securely inside your browser's local sandbox (`chrome.storage.local`).

#### Q: What is the maximum number of clickers I can add?
**A:** You can add up to **50 parallel clickers** per website. This allows you to completely automate complex games or multi-step form tasks easily.

---

*Enjoying KoalaClicker? Check out our [GitHub Repository](https://github.com/Shik3i/KoalaClicker) to star the project, report bugs, or contribute code!*
