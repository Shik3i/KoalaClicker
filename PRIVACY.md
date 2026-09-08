# KoalaClicker privacy policy

Effective date: September 8, 2026. Extension version: 1.3.0.

KoalaClicker processes settings locally to repeat clicks on elements you select. Local processing is still data processing. The extension contains no analytics, advertising, telemetry, remote code, external fonts or network client. No runtime third-party libraries are shipped; development and validation use npm dependencies.

## Local information and control

The extension stores website origins (scheme, hostname and port), CSS selectors, names, intervals, enabled states, clicker IDs and a revision counter in `storage.local`. A selector or name can contain information from the page, so choose names accordingly. It reads the current page URL to authorize document actions; older origin-plus-path storage keys are migrated locally. No browsing-history permission is requested.

Settings are shared across paths of the same origin, and updates reach tabs where you previously invoked KoalaClicker. Origins stay separate. Reloading or navigating stops that document; reopening the popup restores configured active targets. Closing a popup does not stop running clickers. Browser throttling, minimization and suspension can delay them.

Delete removes a target. Delete all removes configurations for the current website, including migrated legacy copies; an empty origin record and revision may remain. Stop all disables targets without deleting their settings. Uninstalling the extension removes its local extension storage. There is no remote backup. Storage migration writes the new copy before deleting legacy data; a failed write preserves the original.

## Permissions and access

- `activeTab`: temporary page access after you invoke the extension using its toolbar action or configured shortcut. Browser-protected pages can deny access.
- `scripting`: injects packaged selection and click code into the top-level document you invoked.
- `storage`: saves and synchronizes local settings across extension contexts.

No standing host permissions or automatic content-script registration are requested. An event-driven background script serializes local storage changes; click timers run in invoked pages, including eligible background tabs. Page access is not automatically re-established after navigation by this extension.

## Target pages and external links

Synthetic clicks can trigger actions, submissions and network requests made by the target website under that website's rules. This is distinct from uploading or tracking by KoalaClicker. Links to GitHub, legal information, support or future store listings open external services only when you choose them. Their own privacy policies apply.

## Website and support

The informational website is separate from the extension. It stores the chosen language under `koalaclicker-lang` in website localStorage; clearing that website's site data removes it. It uses local assets and no analytics. Hosting may process connection information. The actual hosting provider, location, logged fields and complete deletion schedule must be confirmed by the operator before deployment; this repository does not establish those facts.

Support messages you submit to GitHub are processed by GitHub and may be public. Do not include private page content. Operator/contact information: https://koalastuff.net/legal.

## Chrome Web Store Limited Use

Browser API information is used solely for the visible clicker features described here. It is not sold, used for advertising or transferred by the extension. KoalaClicker's use of information received from Google APIs adheres to the Chrome Web Store User Data Policy, including its Limited Use requirements.

Firefox's `data_collection_permissions.required: ["none"]` describes the absence of extension data collection/transmission outside the browser under Mozilla's taxonomy; it does not mean local settings are unprocessed.
