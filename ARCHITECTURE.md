# Architecture

KoalaClicker 1.3.0 ships vanilla HTML/CSS/JavaScript with no runtime libraries. npm dependencies support build, tests and Firefox validation only.

- `src/popup/`: action popup, immediate field operations, persisted-state feedback, status polling and document-bound page actions.
- `src/background.js`: sole storage writer. A promise queue serializes read/modify/write operations across popups and content documents. Operations patch individual IDs/fields; stale edits cannot reinsert deleted records. Failures do not poison later requests. Chrome uses an MV3 service worker; Firefox uses an event background page.
- `src/shared/model.js`: URL validation, bounded normalization and deterministic migration IDs.
- `src/content/content.js`: on-demand top-level selection, unique selectors, synthetic events, timers, storage-change synchronization and document/route invalidation. No static content scripts or standing host permissions.

Storage records use `site:<origin>` with `{revision, clickers}`. Each clicker contains ID, selector, name, interval and active flag. Legacy origin and origin-plus-path records are merged locally, deduplicated by ID and selector and removed only after a successful new write. Overflow is reported without discarding originals. Empty records can retain the origin/revision after deletion; uninstall removes all extension storage.

The popup first injects packaged files if PING fails, then verifies the exact page URL and document token. The background rechecks tokens on document-bound mutations. Content listeners reject stale tokens, reset on navigation and stop timers on pagehide/history transitions. Timer callbacks also detect route changes and invalid extension contexts. Reopening resumes persisted active settings on the current document. The browser may retain an activeTab grant across some same-origin navigation, but this extension does not automatically reinject.

Each timer resolves the selector again and requires a single, visible, enabled, uncovered target in the viewport. It emits untrusted mousedown/mouseup/click events. Page handlers govern effects. Selecting targets captures pointer/mouse events at window level, cancels default behavior, and supports Escape; earlier page capture listeners remain an unavoidable limit. The selection banner uses an isolated ShadowRoot for style containment.

The old MAIN-world helper reset Cookie Clicker's Game.lastClick clock. Version 1.3.0 removes that page-state mutation and uses the same synthetic event path for all sites, respecting website timing and trust checks.

Build copies source and creates browser-specific manifests; it never rewrites a tagged version. Browser tests use these builds. The release adds an exact-commit reviewer source archive, a website archive, full SHA256 inventories and attestations. Draft assets are downloaded and verified before publication. Deployment is manual.
