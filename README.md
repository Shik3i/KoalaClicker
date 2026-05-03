# KoalaClicker

KoalaClicker is a modern, lightweight, privacy-focused auto-clicker browser extension designed for idle games and repetitive web tasks. Built purely with Vanilla HTML, CSS, and JavaScript, it requires zero external dependencies and respects your privacy by never injecting scripts without your explicit action.

## Features

- **Privacy First**: Operates exclusively via the `activeTab` permission. It only runs when you click the extension icon.
- **Multiple Clickers**: Add and manage multiple clickable elements on a single page, each with its own customizable interval.
- **Cross-Browser**: Supports Google Chrome, Mozilla Firefox, and other Chromium-based browsers.
- **Zero Dependencies**: Pure Vanilla JS, ensuring the highest performance and the lowest footprint.
- **State Resumption**: Even though it doesn't automatically track you across page reloads, opening the popup after a reload instantly lets you resume your previously saved clickers on that site.

## Installation

### For Users
1. Download the latest `.zip` release for your browser from the [Releases](https://github.com/Shik3i/KoalaClicker/releases) page.
2. Unzip the file.
3. **Chrome / Edge**: 
   - Go to `chrome://extensions/` or `edge://extensions/`.
   - Enable "Developer mode".
   - Click "Load unpacked" and select the unzipped folder.
4. **Firefox**:
   - Go to `about:debugging#/runtime/this-firefox`.
   - Click "Load Temporary Add-on" and select the `manifest.json` file inside the unzipped folder.

### For Developers
1. Clone the repository: `git clone https://github.com/Shik3i/KoalaClicker.git`
2. Make your modifications inside the `src` directory.
3. Load the `src` folder as an unpacked extension in your browser.

## Building for Release

The project uses GitHub Actions to automatically package the extension for Chrome and Firefox.
Simply push a new tag (e.g., `v1.0.0`), and the `.github/workflows/release.yml` will automatically build and attach `koalaclicker-chrome.zip` and `koalaclicker-firefox.zip` to the new GitHub Release.
