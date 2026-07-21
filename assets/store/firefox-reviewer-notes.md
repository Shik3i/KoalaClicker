# Firefox Reviewer Notes

KoalaClicker has one purpose: the user selects an element in the active tab and
the extension dispatches synthetic mouse clicks at the configured interval.

## Test procedure

1. Open any ordinary HTTPS page containing a button.
2. Open KoalaClicker and select `Add New Clicker`.
3. Select the button on the page.
4. Reopen the popup and verify the clicker is listed and running.
5. Change the interval, stop and restart the clicker, then delete it.
6. Reload the page, reopen KoalaClicker, and verify locally saved state resumes.

No account or test credentials are required. The extension transmits no data.
It uses only `activeTab`, `storage`, and `scripting`; it has no host permissions.

The packaged MAIN-world compatibility helper is limited to
`orteil.dashnet.org`. Immediately before a user-configured click on that host,
it resets Cookie Clicker's local `Game.lastClick` timing field. The helper is
inactive on all other hosts.

## Reproducing the package

Requirements: Node.js 22 and npm.

```bash
npm ci
npm run check
npm run build:extension -- --version=1.2.10
```

The unminified source is copied directly into `dist/firefox`; the build changes
only the browser-specific manifest and creates the ZIP. No runtime third-party
libraries are included.
