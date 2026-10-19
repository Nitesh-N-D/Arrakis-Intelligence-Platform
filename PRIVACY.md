# Privacy

Arrakis processes account information, focus-session state, distraction logs, profile and roadmap data, settings, and team membership to provide the platform features. Authentication uses access tokens and a refresh-token cookie. The extension stores its configuration and activity buffer in browser extension local storage. When the authenticated Arrakis app is open on the trusted production or local development origin, it transfers the short-lived access token to the extension for authorized synchronization; the extension also retains manual token configuration for local setups. Logging out clears the extension token. Changing accounts clears queued activity to prevent cross-account attribution.

## Browser activity

The extension observes the hostname of visible, focused HTTP and HTTPS tabs and accumulates time in ten-second increments. It synchronizes the hostname, duration, a generated event identifier, and derived broad category to the configured Arrakis API. Pending sync records expire after 24 hours. The current source does not transmit full page URLs or page titles. When a blocked site redirects to the extension's block page, the original destination is held in in-memory extension session storage for up to ten minutes so a timed override can continue to it. The extension page URL contains only a random context identifier, and the destination is removed after use or expiry; session storage is cleared when the extension reloads or the browser restarts.

The authenticated leaderboard displays operative names, ranks, focus streaks, Spice totals, and team names; it does not expose account email addresses. The API still accepts URL and page-title metadata from other clients for compatibility. Older extension builds may have sent page URLs and titles. The checked-in `arrakis-extension.zip` includes the current source, but publishing it still requires the existing release process. No account-data deletion endpoint or retention schedule was found; records remain in MongoDB until separately removed by an administrator.

## Mentat and third parties

With `MENTAT_PROVIDER=heuristic`, Mentat uses server-side deterministic rules and makes no AI-provider request. With `MENTAT_PROVIDER=gemini` or `openai` and a configured key, the server sends aggregated seven-day focus and distraction totals, derived analytics, a small skill-gap summary, streak information, and the user's question to the selected provider. It does not send raw browser activity, full URLs, page titles, email addresses, or authentication tokens. Google's or OpenAI's terms and privacy policy govern their processing of requests. Provider outages or missing keys use a response labeled as heuristic fallback.

## Retention and security

Focus sessions, distraction logs, refresh-token hashes, profile data, and roadmap/team records are persisted in MongoDB. Refresh-token records expire through the database TTL index. This repository does not implement a user-facing data export or account deletion flow. The API avoids logging request URLs in production and does not log request bodies. Configure production credentials only in the server environment; never use `VITE_` variables for provider keys.
