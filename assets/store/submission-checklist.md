# Manual submission checklist

Release version: 1.3.1. The repository's release checks validate the GitHub artifacts; store approval and public website deployment remain separate.

- [ ] Confirm final store developer identity/contact and account security in the actual dashboards.
- [ ] Confirm hosting, logged fields, processing location and full deletion schedule; finalize the pending operator paragraphs before deploying the website privacy page.
- [ ] Verify the actual public privacy-policy URL and `https://koalastuff.net/legal` before submitting.
- [ ] Upload the released production Chrome or Firefox ZIP, never a `build/` harness.
- [ ] Use `listing.md`, the German localization where desired, and browser-specific images from `chrome/` or `firefox/`.
- [ ] Complete live Privacy Practices/data declarations according to the code and reviewer notes. No blanket legal-compliance or no-data-processing claim.
- [ ] Supply the released reviewer source ZIP if requested; verify `SHA256SUMS` and provenance.
- [ ] Firefox: obtain Mozilla signing before permanent distribution. Test the signed package and physical toolbar/shortcut behavior.
- [ ] Test physical devices/platforms intended for the listing, especially Android. Declared API minimums are not device acceptance.
- [ ] After approval, add only real official installation/rating URLs; keep unavailable links hidden until then.
- [ ] Deploy the verified website archive manually and check live routes/headers. No repository workflow performs deployment or store submission.
