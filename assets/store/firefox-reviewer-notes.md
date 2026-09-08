# Firefox reviewer notes — 1.3.0

Single purpose: repeat synthetic mouse clicks on elements the user selects in an invoked top-level page. No account, credentials, remote code or extension network client.

## Reproduce

Node.js 22.12+ and npm:

```sh
npm ci
npm run check
npm run test:browser:chrome
npm run test:browser:firefox
npm run test:website
```

Source files are readable and copied into `dist/chrome` / `dist/firefox`. Firefox's manifest replaces the Chrome service worker declaration with an event background script list and adds Mozilla identifiers/minimum versions/data declaration. The version is already committed before the release tag; the build cannot override it.

The reviewer source ZIP contains the exact release commit. Browser ZIPs contain no tests, harness permissions or npm libraries. `SHA256SUMS`, `INVENTORY.json`, `PROVENANCE.json` and GitHub attestations identify the released artifacts.

## Manual browser steps

1. Load the production Firefox package temporarily from `about:debugging#/runtime/this-firefox`. The unsigned package is temporary until Mozilla signing.
2. Open the repository fixture `tests/fixtures/garden.html` via a local HTTP server, or a regular HTTPS page with a non-destructive button. Invoke the toolbar icon (or configured shortcut).
3. Choose Add New Clicker. Escape cancels. Repeat selection and choose a button: the target is saved **stopped** without invoking its ordinary link/form action.
4. Reopen, rename, set 250 ms and press Start. Observe the page's counter. Stop, resume, select a replacement target and delete it.
5. Add two targets, press Stop all, reopen another tab on the same origin and verify shared settings. A new tab needs its own invocation before page code runs.
6. Start a target, reload or navigate, and observe that clicks stop. Reopen to restore configured active targets. Close the popup while running and observe that clicks continue.
7. Hidden, disabled, covered, offscreen, missing or ambiguous targets are skipped. Frames, Shadow DOM and canvas contents are unsupported.

Earlier window-capture listeners belonging to the page can still observe selection input. Synthetic events never become trusted hardware events. Website rules and browser throttling apply. The old Cookie Clicker MAIN-world clock adjustment is removed; no Game object is modified.

`activeTab`, `scripting`, `storage` are the only production permissions. The background script performs ordered local storage operations; content documents run click timers. Firefox declares `data_collection_permissions.required: ["none"]` because the extension does not collect/transmit data outside the browser. Local origins/selectors/names/settings are nevertheless processed. Target-page actions and independently opened links have separate network effects.

Automated Firefox tests use a disposable fixture profile, an extension-owned popup tab, and a test-only all-URLs grant required for real tab screenshots. This is not a claim of physical toolbar/shortcut activation. Production permission restrictions are separately asserted in package checks; do not submit `build/` harness files. Physical Android, other OS/window-manager and arbitrary-website behavior are not inferred from these tests.

Development-only `image-size@2.0.2` advisories remain without an upstream release. Firefox lint preloads a guard disabling unused vulnerable ICNS/JXL/HEIF parsers; a malformed-ICNS regression and normal PNG validation run in the checks. No npm dependency is included in the submitted extension.
