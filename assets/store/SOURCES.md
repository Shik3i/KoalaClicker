# Image sources and reproduction

Version: 1.3.1.

Existing koala-and-mouse artwork is retained: `icon-master.png`, `icon-source-chroma.png`, `promo-art-master.png` and the repository's `src/assets/Logo_Cut_*.png`. The historical source description identified the master as generated artwork. No new external artwork or remote product screenshots were downloaded for this release.

`icon-128.png` matches the production 128px icon. `icon-preview.png` shows actual 16/32/48/128px browser rendering; the 32px view uses the existing 48px asset. The mouse motif and existing colors are preserved.

Real captures are in `screenshots/`. Each browser's `evidence.json` records its version, release version, test scope and activation method. The page shown is the repository-owned `tests/fixtures/garden.html`; it contains no accounts or private content.

- Chrome: actual installed production extension action, opened with CDP `Extensions.triggerAction`. Popup controls use DOM events; target selection uses browser pointer input. Raw popup and selection captures come from the browser compositor.
- Firefox: actual packaged extension UI in a test tab, captured through Firefox `tabs.captureVisibleTab`. The disposable harness grants all-URLs solely for this capture API and fixes the fixture tab used by the popup. The production ZIP does not contain these modifications. These images do not establish physical toolbar activation.

The final `chrome/` and `firefox/` PNGs frame those captures with separate English captions. A Firefox raw screenshot includes unused space to the right; the presentation frame clips that unused area without inventing or replacing UI. Promo tiles use the existing icon and text only.

Reproduce after a successful build:

```sh
npm run test:browser:chrome
npm run test:browser:firefox
node scripts/render-store.mjs
```

Review `preview.html` and the raw captures visually. Run the browser suites again after any UI change before regenerating the compositions. The website's popup images are copies of the current raw Chrome captures; its social preview is the generated promo composition.

`archive/` and `store_assets/marquee.png` are historical artwork. They are not current screenshots or submission recommendations.
