# AI Guidelines for KoalaClicker

When developing or modifying code in this repository, AI agents must strictly adhere to the following rules:

1. **Zero Dependencies**: Absolutely no external libraries (like React, jQuery, Vue, or Tailwind) or package managers (npm) should be used. The extension must be pure Vanilla HTML, CSS, and JavaScript.
2. **No External Fonts**: Do not import external fonts (e.g., Google Fonts). Use system font stacks (`font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;`) for a modern, native feel.
3. **Privacy First**: Maintain the highest level of privacy. Use the `activeTab` permission. Do not request host permissions like `<all_urls>` unless explicitly approved by the user. Do not track analytics or send data externally.
4. **Cross-Browser Compatibility**: The extension must support both Google Chrome and Mozilla Firefox. Rely on the standard WebExtensions API (Manifest V3). Any browser-specific adjustments (like Firefox's `browser_specific_settings`) should be handled automatically via the GitHub Actions build pipeline.
5. **Clean Architecture**: Keep the `src` folder organized. Use clear names: `popup`, `content`, `assets`.
6. **Performance**: Ensure DOM manipulations in the content script are performant. Avoid excessive layout thrashing.

---

## Agent Onboarding: First Steps

If you are a new AI agent assigned to work on this repository, **you must complete the following steps before modifying any code**:

1. **Read `ARCHITECTURE.md`**: This is your single source of truth. It details the `activeTab` constraints, how state is preserved in `chrome.storage.local`, and how the Popup communicates with the Content Script via Message Passing.
2. **Review the Data Flow**: Understand that the Content Script is *stateless*. The Popup acts as the orchestrator. If the user reloads the page, the Content Script dies. Opening the popup is the *only* way to re-inject the script and resume the auto-clickers.
3. **Understand the Build System**: Review `.github/workflows/release.yml`. Do not attempt to add `webpack`, `rollup`, or `npm scripts`. The GitHub Action handles zipping and Manifest adjustments automatically.
4. **Inspect the CSS Selectors**: Look at `generateSelector` in `src/content/content.js`. Any modifications to how elements are identified must remain robust across page reloads.
