# Arrakis Browser Extension

The Arrakis extension is a Manifest V3 companion for realtime distraction telemetry and Storm Zone enforcement. **Microsoft Edge is the only supported browser.** The code uses the standard `chrome.*` extension namespace, which Edge implements; that is an API name, not a statement of Chrome support. Partner Center manages the published listing and release submission.

## Features

- visible active-tab hostname duration tracking every 10 seconds
- buffered sync into `POST /storm/log`
- blocked-site redirect into a premium Storm Zone page
- strict mode hard blocking
- timed override when strict mode is disabled
- popup controls for blocked sites, strict mode and override duration; production API configuration and short-lived account-token handoff are managed automatically
- account policy sync: blocked sites, strict mode, override minutes, blocking policy (`always` / `focus-only` / `off`) and tracking pause follow the signed-in Arrakis account; see the repository's `docs/extension-setup-guide.md`

## Files

- `manifest.json`
- `background.js`
- `domainRules.js`
- `content.js`
- `popup.html`
- `popup.js`
- `block.html`
- `block.js`
- `styles.css`

## Handshake with the web app

On the trusted Arrakis origins only, the web app posts `EXTENSION_PING` with a random nonce and the signed-in user ID. The content script asks the background worker for `GET_HANDSHAKE_STATUS` (rejected for any other origin) and replies with `EXTENSION_HELLO`: protocol, version, browser (`edge` or `other-chromium`), whether a valid sign-in is present, whether it belongs to the same account, permission names, blocked-site count, strict mode, pending event count and last sync state/time. It never returns the token, account ID, hostnames or delivery messages. The Settings page shows "detected" only after a reply arrives.

## Setup

1. Open `edge://extensions` in Microsoft Edge
2. Turn on **Developer mode**
3. Click **Load unpacked**
4. Select the repository `extension/` folder (or the folder extracted from `dist/arrakis-edge-v1.1.0.zip`)

See [`docs/EDGE_INSTALLATION.md`](../docs/EDGE_INSTALLATION.md) for step-by-step instructions, updating and troubleshooting.

## Configure

1. Open the Arrakis app and sign in. The extension connects through the trusted app origin and uses the production Arrakis API.
2. Open the popup, add blocked domains, choose strict mode and set the override window.
3. Save configuration. Blocking policy and tracking pause are managed in your Arrakis account settings.

## Tracking Model

- only visible, focused tabs are tracked
- a content-script heartbeat runs every 10 seconds
- the background worker accumulates site time
- the extension flushes one minute at a time into the backend

## Blocking Model

- matching blocked hosts redirect to `block.html`
- original destinations stay in in-memory extension session storage for up to ten minutes; the block-page URL contains only a random context ID
- strict mode hides override and prevents bypass
- non-strict mode allows temporary override for the configured duration

## Notes

- opening the authenticated Arrakis app refreshes the extension's short-lived access token; if it expires while the app is closed, queued activity waits for the next authenticated app visit
- account changes clear queued activity so events from one operative cannot be uploaded under another operative
- if JWT is missing, activity remains buffered locally and sync status shows a warning
- browser internal pages (`edge://`) are not tracked
- automated unpacked-extension smoke coverage has exercised popup settings and blocking in Microsoft Edge; Edge service-worker restart and policy handoff are covered. Store installation still needs Partner Center validation.
- blocking uses exact hostname and subdomain matching, not full-path matching
- current source synchronizes hostnames and durations without page URLs or titles; pending sync events are deduplicated and expire after 24 hours
- failed syncs retry with bounded exponential backoff using a persisted Chrome alarm, even when no tabs remain open
- queued activity expires after 24 hours and is removed after eight failed delivery attempts
- the blocking flow uses `chrome.storage.session` (Chrome 102+); the original destination is cleared when used, expired, or when the extension/browser session ends
- the checked-in release ZIP should be rebuilt from this directory after source changes
