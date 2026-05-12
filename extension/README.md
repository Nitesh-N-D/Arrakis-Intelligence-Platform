# Arrakis Chrome Extension

The Arrakis Chrome Extension is a Manifest V3 companion for realtime distraction telemetry and Storm Zone enforcement.

## Features

- active-tab distraction tracking every 10 seconds
- buffered sync into `POST /storm/log`
- blocked-site redirect into a premium Storm Zone page
- strict mode hard blocking
- timed override when strict mode is disabled
- local configuration for API URL, JWT, blocked sites, strict mode, and override window

## Files

- `manifest.json`
- `background.js`
- `content.js`
- `popup.html`
- `popup.js`
- `block.html`
- `block.js`
- `styles.css`

## Setup

1. Open `chrome://extensions`
2. Enable Developer Mode
3. Click `Load unpacked`
4. Select the repository `extension/` folder

## Configure

1. Open the popup
2. Set backend API URL
3. Paste a valid JWT access token
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
- strict mode hides override and prevents bypass
- non-strict mode allows temporary override for the configured duration

## Notes

- if JWT is missing, activity remains buffered locally and sync status shows a warning
- Chrome internal pages are not tracked
- blocking uses host matching, not full-path matching
