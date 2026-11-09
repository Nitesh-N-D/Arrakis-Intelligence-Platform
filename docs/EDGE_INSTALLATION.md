# Installing the Arrakis extension in Microsoft Edge

Microsoft Edge is the only officially supported browser. The extension is **not yet published on
Microsoft Edge Add-ons**; until Microsoft approves a submission it is installed unpacked.

## Install (developer mode)

1. Download `arrakis-extension.zip` from the repository root and extract it to a folder you will
   keep (Edge loads the extension from that folder every time it starts), or use the repository
   `extension/` folder directly.
2. Open `edge://extensions`.
3. Turn on **Developer mode** (left sidebar, or the toggle at the bottom of the page).
4. Click **Load unpacked** and choose the extracted folder (the one that contains `manifest.json`).
5. Pin the Arrakis icon from the puzzle-piece menu so the popup is easy to reach.

## Connect your account

1. Open the Arrakis web app (`https://arrakis-intelligence-platform.vercel.app`, or
   `http://localhost:5173` in development) and sign in.
2. The app sends its short-lived access token to the extension. Only those two origins are trusted.
3. Open **Settings → Browser extension** in the app. It shows **Detected** only after the extension
   answers a real handshake, and **Connected to this account** only when the extension's sign-in
   belongs to the signed-in user.
4. Within about two minutes, and immediately after the token handoff, the extension downloads your
   account's blocking policy (blocked sites, strict mode, override minutes, when to block, and
   whether tracking is paused).

## Server configuration required for sync

Requests from the extension's service worker carry the extension origin (`chrome-extension://<id>`,
which is the scheme Edge uses as well). The API accepts only the origins listed in `CLIENT_URL`,
`APP_URL` and `ALLOWED_ORIGINS`. Add the installed extension's origin to `ALLOWED_ORIGINS`. The ID
appears on `edge://extensions` and changes between an unpacked install and a store install.

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
| Settings page says *Not detected* | Extension enabled? Page reloaded after install? Only the two trusted app origins can do the handshake. |
| *Detected* but not connected | Open the app while signed in. Tokens are short-lived, so after a long idle period reopen the app. |
| Popup says syncing failed | The API URL in the popup must end in `/api/v1`. HTTPS is required except on localhost. Check that `ALLOWED_ORIGINS` includes the extension origin. |
| Sites are not blocked | Check **When the extension blocks sites** in Settings. With *Only during focus sessions*, blocking starts within about two minutes of starting a timer. With *Never*, the extension only tracks. |
| Nothing is tracked | **Pause activity tracking** may be on. Internal pages (`edge://`) and background tabs are never tracked. |

## What has and has not been verified

* Automated Playwright smoke tests have loaded the unpacked extension in Microsoft Edge
  (`channel: "msedge"`) for popup settings and blocking.
* The policy-sync code in this release is covered by unit tests of its pure rules
  (`server/test/extensionDomainRules.test.js`). It has **not** been exercised end to end against a
  deployed API from a normal Edge profile.
* Chromium test results alone are not treated as proof of Edge compatibility.
