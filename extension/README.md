# Arrakis Chrome Extension

This Manifest V3 extension adds distraction tracking and Storm Zone blocking for the Arrakis Intelligence Platform.

## Included Files

- `manifest.json`: extension manifest and permissions
- `background.js`: service worker for sync, blocking, and storage coordination
- `content.js`: page heartbeat tracker
- `popup.html` / `popup.js`: control panel for backend URL, JWT, and blocked sites
- `block.html` / `block.js`: Storm Zone experience for blocked destinations
- `styles.css`: shared dark Arrakis styling

## Features

1. Tracks active visible site usage from browser tabs.
2. Sends distraction activity into the Arrakis backend through `POST /storm/log`.
3. Maintains a `blockedSites` list in extension storage.
4. Redirects blocked sites into a Storm Zone block page.
5. Lets the user configure backend URL, JWT token, and blocked sites in the popup.
6. Supports a temporary 5-minute override for blocked sites.

## Important Integration Note

The current backend model requires distraction `duration >= 1`, and the storm analytics appear to treat duration as minutes. Because of that, this extension:

- tracks activity every 10 seconds in the content script
- buffers heartbeats inside extension storage
- flushes to `/storm/log` once 60 seconds have accumulated for a site

This preserves realistic analytics instead of overcounting by sending `duration: 1` every 10 seconds.

## Setup

1. Open Chrome and go to `chrome://extensions`.
2. Enable `Developer mode`.
3. Click `Load unpacked`.
4. Select the `extension/` directory from this repository.

## Configure The Extension

1. Click the Arrakis extension icon.
2. Set `Backend API URL`.
   - Example local value: `http://localhost:5000/api/v1`
3. Paste a valid Arrakis JWT access token into `JWT Access Token`.
   - The current web app stores it as `arrakis_access_token`.
4. Add blocked domains one per line.
   - Example:
     - `youtube.com`
     - `instagram.com`
     - `reddit.com`
5. Click `Save Configuration`.

## How Tracking Works

- Only pages that are both visible and focused are tracked.
- The content script sends a heartbeat every 10 seconds.
- The background service worker buffers heartbeats by host.
- After a full minute is accumulated, the extension posts a storm log:

```json
{
  "appName": "youtube.com",
  "duration": 1,
  "severity": "low",
  "metadata": {
    "device": "desktop",
    "category": "entertainment",
    "source": "chrome-extension",
    "trackedSeconds": 60,
    "heartbeatSeconds": 10
  }
}
```

## Blocking Behavior

- If the active site host matches an entry in `blockedSites`, the extension redirects that tab to `block.html`.
- The block screen displays:
  - `You are entering a Storm Zone`
- The user can:
  - return to the previous page
  - override blocking for 5 minutes for that host

## Assumptions

- The Arrakis backend route is authenticated with a Bearer JWT.
- The backend accepts the existing payload shape documented in `server/docs/api.md`.
- Blocking is host-based, not full-path based.
- Chrome internal pages such as `chrome://` are not tracked or blocked.

## Dev Notes

- Configuration is stored in `chrome.storage.local`.
- The extension does not modify any files outside `extension/`.
- If the JWT is missing, activity continues buffering locally and sync status will show a warning.
