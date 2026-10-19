# Extension Setup Guide

## Install

1. Open `chrome://extensions`
2. Enable Developer Mode
3. Click `Load unpacked`
4. Select the repository `extension/` directory

## Configure

1. Set backend API URL, for example `http://localhost:5000/api/v1`
2. Sign in to Arrakis on the trusted production app origin or local development origin; the short-lived access token is transferred to the extension automatically. For other local setups, paste a current access token manually.
3. Add blocked domains
4. Enable strict mode if you want hard blocking
5. Choose override minutes if strict mode is disabled
6. Save

## Validate

- open a blocked site
- confirm the Storm Zone page appears
- confirm override is hidden in strict mode
- confirm distraction logs appear in the Arrakis dashboard

Access tokens are short-lived. If synchronization pauses after a token expires, open the signed-in Arrakis app to refresh the extension connection. A new account clears queued activity from the previous account. Browser installation and these behaviors still require manual Chrome/Edge verification.

The blocking and timed-override flow uses `chrome.storage.session`, available in Chrome 102 and later. A blocked destination stays in extension memory for at most ten minutes; the extension block-page URL contains only a random context ID, not the destination URL. Restarting or reloading the extension clears this temporary context, so the user can navigate to the blocked site again to request an override.
