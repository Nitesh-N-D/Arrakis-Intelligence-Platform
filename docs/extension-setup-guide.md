# Extension Guide

Supported browser: **Microsoft Edge only**. The code uses the `chrome.*` extension namespace
because Edge implements it; that is an API name, not a claim of Chrome support. Installation steps
are in [EDGE_INSTALLATION.md](EDGE_INSTALLATION.md).

## What the extension does

* Records the **hostname and duration** of the visible, focused tab in 10-second heartbeats and
  sends whole minutes to `POST /storm/log` (`metadata.source: "edge-extension"`).
* Never reads page contents, form fields, passwords, full URLs or page titles.
* Redirects blocked hostnames (exact host or subdomain) to the Storm Zone page. In non-strict mode
  the user can take a timed override.

## Account policy sync (v1.2.0)

The account is the source of truth for the blocking policy:

| Field | Meaning |
| --- | --- |
| `blockedSites`, `strictMode`, `overrideMinutes` | Blocking rules |
| `blockingPolicy` | `always`, `focus-only` (only while a focus session is running) or `off` |
| `trackingPaused` | When on, the extension buffers nothing and the API discards extension logs |
| `version` | Optimistic-concurrency counter |

* **Pull:** `GET /profile/extension-policy` runs after the token handoff and then every two
  minutes (an `alarms` timer). The policy is adopted only when its `accountId` equals the `sub`
  claim of the signed-in token. Switching accounts resets the local policy first.
* **Push:** saving in the popup sends `PUT /profile/extension-policy` with `baseVersion`. If the
  account changed elsewhere the server answers `409`, the extension downloads the server copy, and
  the popup says the newer settings were kept.
* Without a sign-in, popup settings stay local to the browser.
* With `focus-only`, blocking can start or stop up to two minutes after a timer starts or ends.

## Validate

* Open a blocked site and confirm the Storm Zone page appears.
* In strict mode the override button is hidden.
* Distraction minutes appear on the dashboard.
* Change the blocked sites in the web app's Settings; within two minutes the popup shows the change.

The blocking flow keeps the original destination in `chrome.storage.session` for at most ten
minutes. The block-page URL contains only a random context ID.
