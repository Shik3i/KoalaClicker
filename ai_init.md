# AI Guidelines for KoalaClicker

When developing or modifying code in this repository, AI agents must strictly adhere to the following rules:

1. **Zero Dependencies**: Absolutely no external libraries (like React, jQuery, Vue, or Tailwind) or package managers (npm) should be used. The extension must be pure Vanilla HTML, CSS, and JavaScript.
2. **No External Fonts**: Do not import external fonts (e.g., Google Fonts). Use system font stacks (`font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;`) for a modern, native feel.
3. **Privacy First**: Maintain the highest level of privacy. Use the `activeTab` permission. Do not request host permissions like `<all_urls>` unless explicitly approved by the user. Do not track analytics or send data externally.
4. **Cross-Browser Compatibility**: The extension must support both Google Chrome and Mozilla Firefox. Rely on the standard WebExtensions API (Manifest V3). Any browser-specific adjustments (like Firefox's `browser_specific_settings`) should be handled automatically via the GitHub Actions build pipeline.
5. **Clean Architecture**: Keep the `src` folder organized. Use clear names: `popup`, `content`, `assets`.
6. **Performance**: Ensure DOM manipulations in the content script are performant. Avoid excessive layout thrashing.
