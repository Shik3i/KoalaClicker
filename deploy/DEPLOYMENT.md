# Manual website and store handoff

Build: `npm ci` then `npm run build:extension`. The verified website is `dist/website/`; durable release archive: `koalaclicker-website-v1.3.1.zip`. Verify published `SHA256SUMS` before extracting.

Only the operator deploys. This repository performs no website upload, hosting configuration, server change or store submission.

Before website deployment:

1. Confirm the actual host, processing location, logged fields and full log-deletion policy. Replace the explicit pending-operator paragraphs in `website/datenschutz.html` and `PRIVACY.md` with verified information, then rebuild. Rotation alone is not deletion.
2. Confirm the intended domain `clicker.koalastuff.net` and the operator/contact information at `https://koalastuff.net/legal`.
3. Upload the verified static archive manually. Configure the document root for the extracted contents. `deploy/Caddyfile` is an optional template; its relative root assumes running from the repository root with the local build in `dist/website`.
4. Configure HTTPS and validate local routes, assets, language switching, Privacy/Legal, security headers and 404 behavior on the deployed host. The template deliberately does not enable HSTS preload or assert a live TLS state.

Store material is in `assets/store/`. Chrome uploads, Mozilla signing, reviewer answers and store publication remain manual. Use the production browser ZIPs, never `build/` test harnesses. Firefox unsigned ZIPs support temporary debugging only. Add official installation/rating URLs after real listings are approved; no listing IDs are invented.
