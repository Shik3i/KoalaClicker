# Using KoalaClicker 1.3.0

1. Install the browser-specific package as described in README.md. Open an ordinary HTTP/HTTPS page.
2. Invoke the toolbar icon or configured shortcut (`Alt+Shift+K`; macOS: `MacCtrl+Shift+K`). Browser shortcut settings may override it.
3. Choose Add New Clicker. Select a regular visible element in the main document. Escape or Cancel exits selection. The target is saved stopped. The next 500 ms of page mouse input are consumed to prevent an accidental second click; reopening the popup ends this guard.
4. Reopen the popup. Choose a name and an interval of 25–86,400,000 whole milliseconds. Press Start. Stop or Stop all ends clicks; closing the popup does not.
5. Select target again replaces a target and stops it. Delete removes it; Delete all clears this website after confirmation.

## Status and recovery

- Running: configured active and currently usable; the website may still reject synthetic clicks.
- Stopped: no timer for this target.
- Target missing / Ambiguous target / Invalid selector: page structure changed. Select the target again.
- Target unavailable / Target covered or offscreen: reveal, enable, uncover or scroll the target into view.
- Saving…: operation dispatched; Saved confirms the write. A storage error means completion was not confirmed. Reopen to inspect saved state and retry. Invalid intervals keep the previous value.
- Page changed / blocked access: reopen on a supported page. Reload, SPA routes, history restoration and navigation stop that document. No automatic injection on new pages.

Settings apply to the entire origin (scheme, hostname, port), across its paths and tabs where the extension was invoked. Other origins are separate. Previously configured active targets resume when you reopen the popup. Stop all affects already invoked tabs of this origin. A new tab receives no script until invocation.

Frame contents, Shadow DOM, canvas contents and trusted hardware input are unsupported. SVG elements can receive synthetic mouse events; websites decide whether to react. A structural selector can refer to a different element after page reordering; verify the page and reselect when needed. Earlier page window-capture handlers may see selection input.

Background tabs, minimized windows and sleeping devices throttle or suspend timers. No exact rate or catch-up is promised. Disable/uninstall invalidates extension access; documents stop on their next execution opportunity. Closing the target tab ends its timers.

For full local data removal, uninstall the extension. Delete all removes this origin's configurations and legacy copies; an empty origin record may remain. Website language preference is separate: clear that website's site data.
