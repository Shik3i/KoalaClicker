# Submission Checklist

## Release package

- [ ] Increment `package.json`, `package-lock.json`, `src/manifest.json`, and website version together
- [ ] Run `npm ci`
- [ ] Run `npm run check`
- [ ] Run `npm run lint:firefox`
- [ ] Confirm zero lint errors and zero lint warnings
- [ ] Manually test the unpacked Chrome and Firefox packages
- [ ] Create and push a new `vX.Y.Z` tag only after all checks pass

## Chrome Web Store

- [ ] Upload `dist/koalaclicker-chrome-vX.Y.Z.zip`
- [ ] Upload `icon-128.png`
- [ ] Upload `promo-small-440x280.png`
- [ ] Upload at least one `1280x800` screenshot
- [ ] Paste the single-purpose and permission justifications from `listing.md`
- [ ] Complete Privacy Practices with accurate local-data handling
- [ ] Confirm developer contact email and two-step verification
- [ ] Verify the public privacy-policy URL over HTTPS

## Firefox Add-ons

- [ ] Upload `dist/koalaclicker-firefox-vX.Y.Z.zip`
- [ ] Upload `dist/koalaclicker-source-vX.Y.Z.zip` as reviewer source when requested
- [ ] Confirm Desktop minimum Firefox 140 and Android minimum Firefox 142
- [ ] Confirm `data_collection_permissions.required: ["none"]`
- [ ] Provide concise reviewer testing instructions
- [ ] Verify the public privacy-policy URL over HTTPS

## Manual smoke test

- [ ] Add two clickers on the same origin
- [ ] Rename both clickers
- [ ] Change intervals, including the 25 ms minimum
- [ ] Stop, restart, and delete clickers
- [ ] Reload the page, reopen the popup, and verify restoration
- [ ] Verify highlighting and selection cancellation
- [ ] Verify no automatic or background network requests originate from the extension
- [ ] Verify browser console contains no extension errors
