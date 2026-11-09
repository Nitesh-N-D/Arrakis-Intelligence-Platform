# Installing the Arrakis extension in Microsoft Edge

Microsoft Edge is the only officially supported browser. The Microsoft Edge Add-ons listing is
managed in Partner Center. Use an unpacked install to validate a local release candidate.

## Install (developer mode)

1. Extract `dist/arrakis-edge-v1.1.0.zip` to a folder you will keep (Edge loads the extension from
   that folder every time it starts), or use the repository `extension/` folder directly.
2. Open `edge://extensions`.
3. Turn on **Developer mode** (left sidebar, or the toggle at the bottom of the page).
4. Click **Load unpacked** and choose the extracted folder (the one that contains `manifest.json`).
5. Pin the Arrakis icon from the puzzle-piece menu so the popup is easy to reach.

## Connect your account

1. Open the Arrakis web app at `https://arrakis-intelligence-platform.vercel.app` and sign in.
2. The app sends its short-lived access token to the extension. Only the production Arrakis web origin is trusted.
3. Open **Settings → Browser extension** in the app. It shows **Detected** only after the extension
   answers a real handshake, and **Connected to this account** only when the extension's sign-in
   belongs to the signed-in user.
4. Within about two minutes, and immediately after the token handoff, the extension downloads your
   account's blocking policy (blocked sites, strict mode, override minutes, when to block, and
   whether tracking is paused).

## Server configuration required for sync

Requests from the extension's service worker carry the extension origin (`chrome-extension://<id>`).
The API accepts only origins listed in `CLIENT_URL`, `APP_URL` and `ALLOWED_ORIGINS`. The published
extension origin is `chrome-extension://ejflgebapfppgfkomjendlfjpcdhbjki`; unpacked test installs
have a different ID and require their own origin in `ALLOWED_ORIGINS` for account sync.

## Update

1. Replace the folder contents with the new release (or `git pull`).
2. On `edge://extensions` click **Reload** on the Arrakis card.
3. Reopen the Arrakis web app so the extension receives a fresh token.

## Remove

Click **Remove** on `edge://extensions`. This deletes the extension's local settings and any
queued activity that has not been synced. Data already synced stays in your account until you delete
it from Settings → Delete account, or until your chosen retention period expires.

## Troubleshooting

| Symptom | What to check |
| --- | --- |
| Settings page says *Not detected* | Extension enabled? Page reloaded after install? The handshake is accepted only from the official Arrakis app origin. |
| *Detected* but not connected | Open the app while signed in. Tokens are short-lived, so after a long idle period reopen the app. |
| Popup says syncing failed | The extension uses the production Arrakis API over HTTPS. Check that `ALLOWED_ORIGINS` includes the installed extension origin and reopen the Arrakis app to refresh sign-in. |
| Sites are not blocked | Check **When the extension blocks sites** in Settings. With *Only during focus sessions*, blocking starts within about two minutes of starting a timer. With *Never*, the extension only tracks. |
| Nothing is tracked | **Pause activity tracking** may be on. Internal pages (`edge://`) and background tabs are never tracked. |

## What has and has not been verified

* Automated Playwright smoke tests load the unpacked release candidate in Microsoft Edge and test
  the account handshake, policy sync, account isolation, all blocking modes, pause behavior, and
  buffering/retry against a local mock API.
* These smoke tests do not modify a production account or prove the Partner Center package install;
  the deployed API and store submission still require owner-side validation.
* Chromium test results alone are not treated as proof of Edge compatibility.
