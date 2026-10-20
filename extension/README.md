# Arrakis Browser Extension

The Arrakis extension is a Manifest V3 companion for realtime distraction telemetry and Storm Zone enforcement. It targets Chrome and Chromium-based Microsoft Edge; other Chromium browsers are not verified.

## Features

- visible active-tab hostname duration tracking every 10 seconds
- buffered sync into `POST /storm/log`
- blocked-site redirect into a premium Storm Zone page
- strict mode hard blocking
- timed override when strict mode is disabled
- local configuration for API URL, JWT, blocked sites, strict mode, and override window

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

## Setup

1. Open `chrome://extensions` in Chrome or `edge://extensions` in Edge
2. Enable Developer Mode
3. Click `Load unpacked`
4. Select the repository `extension/` folder

## Configure

1. Open the popup
2. Set backend API URL
3. Open the Arrakis app and sign in; the extension receives the short-lived access token from the trusted app origin. A JWT can also be entered manually for local setups.
4. Add blocked domains
5. Choose whether strict mode is enabled
6. Set override minutes if strict mode is disabled
7. Save configuration

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
- Chrome internal pages are not tracked
- automated unpacked-extension smoke coverage has exercised popup settings and blocking in Chromium and Microsoft Edge; Edge service-worker restart and Chromium timed-override behavior are covered. Store installation and account-token handoff in normal browser profiles still need manual verification.
- blocking uses exact hostname and subdomain matching, not full-path matching
- current source synchronizes hostnames and durations without page URLs or titles; pending sync events are deduplicated and expire after 24 hours
- failed syncs retry with bounded exponential backoff using a persisted Chrome alarm, even when no tabs remain open
- queued activity expires after 24 hours and is removed after eight failed delivery attempts
- the blocking flow uses `chrome.storage.session` (Chrome 102+); the original destination is cleared when used, expired, or when the extension/browser session ends
- the checked-in release ZIP should be rebuilt from this directory after source changes
