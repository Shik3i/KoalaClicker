# Store Listing Copy

## Name

KoalaClicker

## Short description

Privacy-first auto-clicker for games and repetitive web tasks. 100% local.

## Single purpose

KoalaClicker lets users select elements on the active webpage and repeatedly
trigger synthetic mouse clicks at a user-configured interval.

## Long description

KoalaClicker is a lightweight auto-clicker for idle games and repetitive web
tasks. Select an element, choose an interval, and control multiple independent
clickers from a compact popup.

Features:

- Up to 50 clickers per website
- Configurable intervals from 25 ms
- Start, stop, rename, and delete clickers independently
- Live element highlighting
- Local per-site configuration
- No accounts, analytics, advertising, telemetry, or automatic network requests
- Open-source, readable Manifest V3 code

Privacy by design:

KoalaClicker uses `activeTab` instead of broad host permissions. It can access a
page only after the user invokes the extension for that tab. Page origins and
user-created clicker settings remain in local browser extension storage and are
never transmitted.

Compatibility note:

KoalaClicker sends synthetic mouse events. Websites can detect or reject
synthetic input, so compatibility cannot be guaranteed for every page.
On the official Cookie Clicker host (`orteil.dashnet.org`), a packaged
MAIN-world helper resets Cookie Clicker's local `Game.lastClick` timing field
immediately before a user-configured click. It is inactive on every other host.

## Permission justifications

### activeTab

Grants temporary access to the current tab only after the user invokes
KoalaClicker. This is required to let the user select and click elements without
requesting persistent access to all websites.

### storage

Stores user-created CSS selectors, labels, intervals, and enabled states locally
so configurations are available when the user reopens KoalaClicker. No stored
information is transmitted.

### scripting

Injects the packaged content script, CSS, and optional packaged MAIN-world game
compatibility helper into the user-invoked active tab. No remote code is loaded.

## Chrome Privacy Practices guidance

- Data is not sold or transferred.
- Data is not used for advertising, creditworthiness, or unrelated purposes.
- Declare local handling accurately: the extension processes website origin,
  selected-element CSS selectors, and clicker configuration locally.
- Privacy policy URL:
  `https://clicker.koalastuff.net/datenschutz.html`

## Firefox data collection

The package declares `data_collection_permissions.required: ["none"]` because
no information is transmitted outside the extension or local browser.
