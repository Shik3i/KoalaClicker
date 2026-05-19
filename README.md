<div align="center">
  <h1><img src="src/assets/Logo_Cut_128.png" width="38" height="38" valign="middle"> KoalaClicker</h1>
  <p><strong>A modern, lightweight, privacy-focused auto-clicker browser extension.</strong></p>

  <p>
    <a href="https://github.com/Shik3i/KoalaClicker/releases/latest"><img src="https://img.shields.io/github/v/release/Shik3i/KoalaClicker?color=bd93f9&label=Latest%20Release&style=flat-square" alt="Latest Release"></a>
    <a href="https://github.com/Shik3i/KoalaClicker/blob/main/LICENSE"><img src="https://img.shields.io/badge/License-MIT-50fa7b?style=flat-square" alt="License"></a>
    <img src="https://img.shields.io/badge/Dependencies-0-ff79c6?style=flat-square" alt="Zero Dependencies">
    <img src="https://img.shields.io/badge/Vanilla-JS%20%7C%20HTML%20%7C%20CSS-f1fa8c?style=flat-square" alt="Vanilla Stack">
  </p>
</div>

---

KoalaClicker is designed for idle games and repetitive web tasks. Built purely with Vanilla HTML, CSS, and JavaScript, it requires **zero external dependencies**, contains **absolutely no tracking or telemetry**, is **100% ad-free**, and respects your privacy by never automatically injecting scripts without your explicit action.

## ✨ Features

- 🔒 **Privacy First**: Operates exclusively via the `activeTab` permission. It only runs when you click the extension icon. **Absolutely zero tracking, no telemetry, and 100% ad-free.**
- 🎯 **Multiple Clickers**: Add and manage multiple clickable elements on a single page, each with its own customizable interval.
- 🌐 **Cross-Browser**: Supports Google Chrome, Mozilla Firefox, and other Chromium-based browsers.
- ⚡ **Zero Dependencies**: Pure Vanilla JS, ensuring the highest performance and the lowest footprint.
- 💾 **State Resumption**: Even though it doesn't automatically track you across page reloads, opening the popup after a reload instantly lets you resume your previously saved clickers on that site!

## 📦 Installation

### For Users

1. Download the latest `.zip` release for your browser from the **[Latest Releases](https://github.com/Shik3i/KoalaClicker/releases/latest)** page.
2. Unzip the downloaded file.
3. **Chrome / Edge / Brave**: 
   - Navigate to `chrome://extensions/` or `edge://extensions/`.
   - Toggle on **"Developer mode"** in the top right.
   - Click **"Load unpacked"** and select the unzipped folder.
4. **Firefox**:
   - Navigate to `about:debugging#/runtime/this-firefox`.
   - Click **"Load Temporary Add-on"** and select the `manifest.json` file inside the unzipped folder.

### For Developers

1. Clone the repository: 
   ```bash
   git clone https://github.com/Shik3i/KoalaClicker.git
   ```
2. Make your modifications inside the `src` directory.
3. Load the `src` folder as an unpacked extension in your browser.
4. *(Optional)* Read the [ARCHITECTURE.md](ARCHITECTURE.md) to understand the data flows.
