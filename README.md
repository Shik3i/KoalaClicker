# KoalaClicker

Current build: v1.3.0

Repeat synthetic mouse clicks on selected elements in a web page. Configure up to 50 targets per website, with independent names and intervals from 25 to 86,400,000 milliseconds.

## Use

Open KoalaClicker using its toolbar icon or `Alt+Shift+K` (`MacCtrl+Shift+K` on macOS). Choose **Add New Clicker**, select a page element, then reopen and press **Start**. A newly selected target is saved **stopped**. Cancel selection with Escape or Cancel.

Rename or change intervals directly in the popup. Valid input is sent immediately to local storage. **Saved** confirms completion; invalid intervals retain the previous saved value. **Stop all** stops this website in already invoked tabs. **Delete** removes one target; **Delete all** removes this website's configurations. **Select target again** replaces a target while keeping its ID and stopping it.

Closing the popup leaves clicks running. Navigation, reload and history restoration stop the document; reopen KoalaClicker to resume configured active targets. Settings are shared across paths of the same origin; different origins are separate.

## Limits

- Chrome 120+ and Firefox Desktop 140+ package API baselines. Actual browser versions tested are recorded by the browser jobs. Firefox Android 142+ is declared as an API baseline, not proof of physical-device acceptance.
- Only regular HTTP/HTTPS top-level documents. Browser-protected pages may reject injection. Frames, Shadow DOM and canvas contents are unsupported.
- Unique selectors are required. Hidden, disabled, ambiguous, covered and offscreen targets are skipped. A changed page can invalidate a structural selector; select the target again.
- Synthetic `mousedown`, `mouseup`, `click` events have `isTrusted=false`. They cannot supply trusted hardware input or user activation. Websites may reject them. Cookie Clicker's internal timing is no longer modified; its own click-rate rules apply.
- 25 ms is a requested interval, not a guarantee of 40 accepted clicks per second. Background throttling, minimization and suspension can reduce the rate. No accumulated clicks are replayed after sleep.
- Clicks can submit forms, navigate or cause target-page network requests. Selection suppresses events before ordinary page handlers, but a page's earlier window-capture listeners can observe input. Use only targets whose actions you intend.

## Install locally

Download [v1.3.0](https://github.com/Shik3i/KoalaClicker/releases/tag/v1.3.0).

- Chrome: extract `koalaclicker-chrome-v1.3.0.zip`, open `chrome://extensions`, enable Developer mode, choose Load unpacked.
- Firefox: extract `koalaclicker-firefox-v1.3.0.zip`, open `about:debugging#/runtime/this-firefox`, Load Temporary Add-on, choose `manifest.json`. Unsigned temporary installations end when Firefox restarts. Permanent distribution requires Mozilla signing.

Official store installation/rating links are withheld until real listings are available.

## Build and verify

Node.js 22.12+ and npm; no runtime framework or third-party library is shipped.

```sh
npm ci
npm run check
npm run test:browser:chrome
npm run test:browser:firefox
npm run test:website
```

`dist/chrome/`, `dist/firefox/`, `dist/website/` and their versioned ZIPs are the local builds. Browser executable overrides: `KOALACLICKER_CHROME`, `KOALACLICKER_FIREFOX`.

The Firefox browser test uses a disposable copy with a popup-tab bootstrap and an all-URLs grant required by Firefox tab screenshots. The isolated profile contains only repository fixtures and extension pages. Production permissions remain `activeTab`, `storage`, `scripting`. That harness does not prove physical toolbar activation. Chrome invokes the extension action through its browser protocol; popup controls use DOM events and page selection uses browser pointer input.

## Release

Prepare matching source/package/website versions before tagging. Merge the PR after verify, Chrome, Firefox, website and CodeQL checks succeed. An annotated tag must point to the checked `main` commit. The release workflow validates those gates, tests the built packages, creates Chrome/Firefox/source/website archives and provenance, verifies authenticated draft downloads, then publishes. Published releases are never replaced. Website and store deployment remain manual; see [deployment notes](deploy/DEPLOYMENT.md).

Store submission material: [assets/store](assets/store/README.md). [Privacy](PRIVACY.md) · [Legal](https://koalastuff.net/legal) · [Help](USAGE.md) · [Support](https://github.com/Shik3i/KoalaClicker/issues).
