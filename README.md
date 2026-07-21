<div align="center">
  <h1>
    <img src="src/assets/Logo_Cut_128.png" width="32" height="32" alt="KoalaClicker Logo" valign="middle">
    KoalaClicker
  </h1>
  <p><strong>A modern, privacy-first auto-clicker for idle games and repetitive web tasks.</strong></p>

  <p>
    <a href="https://github.com/Shik3i/KoalaClicker/releases/latest"><img src="https://img.shields.io/github/v/release/Shik3i/KoalaClicker?color=bd93f9&label=Latest%20Release&style=flat-square" alt="Latest Release"></a>
    <a href="https://github.com/Shik3i/KoalaClicker/blob/main/LICENSE"><img src="https://img.shields.io/badge/License-MIT-50fa7b?style=flat-square" alt="License: MIT"></a>
    <img src="https://img.shields.io/badge/Manifest-V3-bd93f9?style=flat-square" alt="Manifest V3">
    <img src="https://img.shields.io/badge/Dependencies-0-ff79c6?style=flat-square" alt="Zero Dependencies">
    <img src="https://img.shields.io/badge/Tracking-None-50fa7b?style=flat-square" alt="No Tracking">
  </p>

  <p>
    <a href="https://github.com/Shik3i/KoalaClicker/releases/latest">
      <img src="https://img.shields.io/badge/⬇%20Download%20for%20Chrome-4285F4?style=for-the-badge&logo=googlechrome&logoColor=white" alt="Download for Chrome">
    </a>
    &nbsp;
    <a href="https://github.com/Shik3i/KoalaClicker/releases/latest">
      <img src="https://img.shields.io/badge/⬇%20Download%20for%20Firefox-FF7139?style=for-the-badge&logo=firefox&logoColor=white" alt="Download for Firefox">
    </a>
  </p>
</div>

---

KoalaClicker lets you automate clicks on any element on any webpage — ideal for idle games like Cookie Clicker, farming simulators, or any repetitive web task. It is built entirely with **Vanilla HTML, CSS, and JavaScript**, has **zero external dependencies**, **no tracking whatsoever**, and is **100% ad-free**.

Unlike most auto-clickers on the market, KoalaClicker uses the **`activeTab` permission model** — it has **zero access** to any page until *you* explicitly click the extension icon. Your CSS selectors and settings are stored 100% locally on your device via `chrome.storage.local` and never transmitted anywhere.

---

## ✨ Features

| Feature | Details |
|---|---|
| 🔒 **Privacy First** | Uses `activeTab` only. No access to any tab until you click the icon. Zero tracking, zero telemetry, 100% ad-free. |
| 🎯 **Multiple Clickers** | Add up to **50 parallel clickers** per website, each with its own interval and label. |
| ⚡ **Ultra-Fast Clicking** | Minimum interval of **25ms** (40 clicks/sec). Handles multiple elements simultaneously. |
| 🎮 **Cookie Clicker Compatibility** | Applies a narrowly scoped timing adjustment only on the official Cookie Clicker host. |
| ✏️ **Inline Editing** | Rename clickers, adjust intervals, start/stop individually — all live in the popup. |
| 👁 **Live Highlighting** | Hover over a clicker card in the popup and the corresponding element is highlighted on the page in real time. |
| 💾 **State Resumption** | Clickers are saved per-site. Reopen the popup after a page reload to resume instantly. |
| 🌐 **Cross-Browser** | Works on Chrome, Firefox, Edge, Brave, and any Chromium-based browser. |
| 🪶 **Lightweight** | Pure Vanilla JS — no frameworks, no build tools, no bloat. |

---

## 📦 Installation

### Option A — Chrome Web Store *(coming soon)*

> The extension will be available directly on the Chrome Web Store. Click Install — no unzipping required.

### Option B — Manual Install (Releases)

1. Go to the **[Latest Releases](https://github.com/Shik3i/KoalaClicker/releases/latest)** page and download the `.zip` for your browser.
2. Unzip the downloaded file.

**Chrome / Edge / Brave:**
- Open `chrome://extensions/`
- Enable **Developer mode** (top right toggle)
- Click **Load unpacked** → select the unzipped folder

**Firefox:**
- Open `about:debugging#/runtime/this-firefox`
- Click **Load Temporary Add-on** → select the `manifest.json` inside the unzipped folder

---

## 🚀 Quick Start

1. **Navigate** to any webpage (e.g. an idle game).
2. **Click** the KoalaClicker icon in your browser toolbar.
3. Press **"Add New Clicker"** — the popup closes and Element Selection Mode activates.
4. **Hover** over any element on the page — it will glow pink to confirm your target.
5. **Click** the element to register it. The clicker starts immediately!
6. Reopen the popup anytime to rename, adjust the speed, pause, or delete clickers.

> 💡 **Pro Tip:** After a page reload, click the extension icon once — active clickers for that website reload and resume.

---

## 🔒 Privacy & Security

KoalaClicker is designed to be the most privacy-respecting auto-clicker available:

- **`activeTab` only**: The extension gains page access *only* when you explicitly click its icon. It cannot read your browsing history, access other tabs, or run in the background.
- **No background requests**: KoalaClicker sends no browsing or clicker data anywhere and performs no automatic network requests. External links open only after a user click.
- **Local storage only**: Your configurations (selectors, intervals, names) are stored exclusively in `chrome.storage.local` on your device.
- **No eval()**: No dynamic code execution from external sources.
- **Open Source**: The entire codebase is here for you to audit.

Read the full [Privacy Policy](PRIVACY.md).

---

## 🛠 For Developers

```bash
git clone https://github.com/Shik3i/KoalaClicker.git
cd KoalaClicker
npm ci
npm run check
# Load the /dist/chrome folder as an unpacked extension in chrome://extensions/
```

- All extension code lives in [`src/`](src/)
- Read [`ARCHITECTURE.md`](ARCHITECTURE.md) for a full breakdown of the data flows and component design
- Read [`USAGE.md`](USAGE.md) for the full user guide and FAQ
- The GitHub Actions workflow in [`.github/workflows/release.yml`](.github/workflows/release.yml) uses the local build script to inject the tag version and build both Chrome and Firefox ZIPs on every `v*.*.*` tag push
- Store-ready artwork, screenshots, listing copy, and the submission checklist live in [`assets/store/`](assets/store/)

**Stack:** Vanilla JS · Vanilla CSS · HTML5 · Manifest V3 · Zero runtime dependencies

---

## 📄 License

Released under the [MIT License](LICENSE). © 2026 Shik3i
