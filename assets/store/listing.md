# Store listing — English (primary)

Version: 1.3.0. Submission folder: `assets/store/`.

## Name

KoalaClicker

## Short description

Repeat clicks on selected page elements. Set intervals, save targets locally, and stop them from one popup.

## Full description

Choose the page element. Set the interval. Start when you are ready.

KoalaClicker repeats synthetic mouse clicks on elements you select in a web page. Use it for idle games or repetitive web tasks where the website permits this behavior.

- Save up to 50 targets per website, each with its own name and interval.
- Choose a whole-number interval from 25 to 86,400,000 milliseconds.
- New targets are saved stopped. Start or stop individual clickers from the popup.
- Stop all clickers for the current website, delete saved targets, or select a replacement target.
- Settings are shared across paths of the same website origin and tabs where you have invoked KoalaClicker.
- Cancel selection with Escape. Selection suppresses ordinary link and form activation.

Open the toolbar icon or use Alt+Shift+K (MacCtrl+Shift+K on macOS). Select Add New Clicker, choose a target, then reopen the popup and press Start. Closing the popup leaves active clickers running. Navigation and reload stop that document; reopen to resume saved active targets.

The extension stores origins, selectors, names, intervals and running states locally. It includes no telemetry, advertising, remote code or external fonts. It requests activeTab, storage and scripting, with no standing host permissions. Clicking a target can cause the target website to submit forms, navigate or make its own network requests.

Limits: supported top-level HTTP/HTTPS pages only. Frames, Shadow DOM and canvas contents are unsupported. Missing, hidden, disabled, covered, offscreen or ambiguous targets are skipped. Page changes may require selecting the target again. Events remain synthetic and untrusted; sites can reject them. Browser throttling and suspension affect timing, so a 25 ms setting does not guarantee 40 accepted clicks per second. No game timing fields are changed.

Source and help: https://github.com/Shik3i/KoalaClicker
Support: https://github.com/Shik3i/KoalaClicker/issues
Privacy: https://github.com/Shik3i/KoalaClicker/blob/main/PRIVACY.md
Legal: https://koalastuff.net/legal

## Single purpose

Repeat synthetic mouse clicks on user-selected elements of the currently invoked website, with local target and timing controls.

## Permission justifications

- activeTab: temporary access to the page after the user invokes the action or shortcut. Needed to select a target and run the configured clicks. No browsing-history or standing host access is requested.
- scripting: inject packaged selection, styling and click code into the invoked top-level document. No code is downloaded or evaluated remotely.
- storage: keep user-created origins, selectors, names, intervals, IDs, enabled states and revisions in browser-local extension storage. An event background context serializes writes across popup and content documents.

## Privacy Practices — review against the actual dashboard

The extension does not collect/transmit user data to the developer or a third party, sell data, serve ads, perform analytics or execute remote code. It does locally process the settings listed above. Select the dashboard answers describing no extension data collection/transmission, and use the linked policy to disclose local processing. Target-page requests and independently opened support/website links are separate activities. Do not assert that nothing can ever leave the device or that no data is processed.

Chrome Limited Use statement is in PRIVACY.md. Firefox manifest declares required data collection permissions as `none`, meaning no extension data collection/transmission outside the browser under Mozilla's taxonomy. Recheck live forms and the actual published privacy URL before submission; these notes are not a guarantee of approval or legal compliance.

## Official guidance consulted

- https://developer.chrome.com/docs/webstore/images — PNG/JPEG screenshots at 1280×800 or 640×400; small promo tile 440×280; marquee 1400×560. This package uses PNG and separate real captures.
- https://developer.chrome.com/docs/webstore/program-policies/user-data-faq — privacy policy and accurate disclosure of browsing information use.
- https://developer.chrome.com/docs/webstore/program-policies/limited-use — browser API information is limited to the described visible features.
- https://extensionworkshop.com/documentation/develop/firefox-builtin-data-consent/ — explicit no-collection declaration and consent taxonomy.
- https://extensionworkshop.com/documentation/publish/add-on-policies/ — accurate functionality and reviewer disclosure.

Official store installation and rating URLs have not been established in this repository. Keep them hidden until the operator supplies approved real listing URLs.
