# Arrakis Intelligence Platform

Arrakis Intelligence Platform is a React and Express application for server-tracked focus sessions, distraction logging, skill progression, roadmap management, analytics, Mentat guidance, team competition, and browser-based storm blocking.

## Live Deployments

* Frontend: https://arrakis-intelligence-platform.vercel.app
* Backend: https://arrakis-intelligence-platform.onrender.com

## Browser Extension

Arrakis includes a Manifest V3 browser extension that provides realtime distraction tracking, Storm Zone blocking, strict mode enforcement, timed overrides, and synchronization with the Arrakis backend.

### Features

* Storm Zone website blocking
* Strict Mode enforcement
* Timed Override sessions
* Realtime activity tracking
* Backend synchronization
* Productivity analytics integration
* Arrakis account integration

### Download

The repository's `arrakis-extension.zip` is built from the current `extension/` source. It is not uploaded to GitHub Releases or browser stores automatically; published downloads may lag behind this repository until the existing release process runs.

### Browser Compatibility

The extension uses Manifest V3 APIs intended for Chrome and Chromium-based Microsoft Edge. Playwright automation has verified blocking behavior in bundled Chromium and Microsoft Edge, including popup settings persistence, strict blocking, hidden destination URLs, and Edge extension-worker restart recovery. Chromium coverage also checks timed overrides, context expiry, and pending-sync alarms. Manual installation and store compatibility have not been verified. Browser-store approval, Brave, and Opera are not claimed.

### Manual Installation

1. Extract the repository or download `arrakis-extension.zip` from the current source revision.
2. Extract the ZIP archive.
3. Open:

   * Edge → `edge://extensions`
   * Chrome → `chrome://extensions`
4. Enable **Developer Mode**.
5. Click **Load unpacked**.
6. Select the extracted extension folder.

## Monorepo Structure

* `client/` — React + Vite + Tailwind + Framer Motion + Recharts frontend
* `server/` — Express clean architecture API with MongoDB, JWT authentication, Google OAuth, Socket.io, and Mentat
* `extension/` — Manifest V3 browser extension for hostname-based distraction tracking and local site blocking
* `docs/` — Setup, deployment, production, and extension guides

## Core Systems

### Spice System

Real focus sessions with timer-driven harvest logging.

### Storm System

Distraction logging, thresholds, realtime storm detection, and focus protection.

### Streak System

Consecutive focus-day tracking and behavioral consistency monitoring.

### Discipline Map

Skill-gap analysis against target roles with progression tracking.

### Ascension Roadmap

Persisted roadmap phases with completion progress and milestone tracking.

### Prescience Engine

Burnout risk analysis, performance forecasting, and behavioral diagnostics.

### Mentat

Behavioral recommendations and next-best-action guidance.

### Leaderboard

Realtime user and team rankings.

### Profile & Settings

Editable operative identity and preferences. The extension's block list and enforcement settings are stored locally and are not synchronized from the web app.

### Browser Blocker

Hostname tracking and locally configured blocking, strict mode, and timed overrides.

## Local Development

Use Node.js 24.x for both packages. The client and server declare this engine version, and CI uses the same LTS release.

### Backend

```powershell
cd server
copy .env.example .env
npm ci
npm run dev
```

### Frontend

```powershell
cd client
copy .env.example .env
npm ci
npm run dev
```

### Optional Docker

```powershell
docker-compose up --build
```

## Required Environment Variables

### Server

* PORT
* NODE_ENV
* CLIENT_URL
* APP_URL
* ALLOWED_ORIGINS
* MONGODB_URI
* JWT_ACCESS_SECRET
* JWT_REFRESH_SECRET
* REFRESH_COOKIE_NAME
* SECURE_COOKIES
* GOOGLE_CLIENT_ID
* GOOGLE_CLIENT_SECRET
* GOOGLE_REDIRECT_URI
* GOOGLE_SUCCESS_REDIRECT_URL
* GOOGLE_FAILURE_REDIRECT_URL
* MENTAT_PROVIDER
* GEMINI_API_KEY (optional; server only)
* GEMINI_MODEL (defaults to `gemini-3.5-flash-lite`)
* GEMINI_TIMEOUT_MS (defaults to 15000)
* MENTAT_MAX_OUTPUT_TOKENS (defaults to 800)
* MENTAT_MAX_REQUESTS_PER_USER_DAY (defaults to 20; stored in shared MongoDB)
* MENTAT_MAX_REQUESTS_GLOBAL_DAY (defaults to 1000; stored in shared MongoDB)
* OPENAI_API_KEY and OPENAI_MODEL (optional; existing provider)

Mentat supports `heuristic`, `openai`, and `gemini`. Missing remote keys and provider failures return clearly labeled heuristic guidance. Gemini receives aggregated focus/distraction totals, skill-gap summaries, streak and burnout calculations, plus an optional question limited to 500 characters. AI daily budgets and API request limits use atomic MongoDB counters shared across server instances. Google's project quota remains authoritative.

### Client

* VITE_API_URL
* VITE_SOCKET_URL

## Production Notes

* CLIENT_URL=https://arrakis-intelligence-platform.vercel.app
* APP_URL=https://arrakis-intelligence-platform.vercel.app
* ALLOWED_ORIGINS=https://arrakis-intelligence-platform.vercel.app
* SECURE_COOKIES=true
* GOOGLE_REDIRECT_URI=https://arrakis-intelligence-platform.onrender.com/api/v1/auth/google/callback
* VITE_API_URL=https://arrakis-intelligence-platform.onrender.com/api/v1
* VITE_SOCKET_URL=https://arrakis-intelligence-platform.onrender.com

## Verification Commands

### Backend Import Check

```powershell
cd server
npm test
npm run check:import
```

Replica-set integration tests are separate from the fast unit suite. They require an isolated MongoDB replica set and a URI whose database name is exactly `arrakis_integration_test`:

```powershell
$env:MONGODB_TEST_URI = "mongodb://127.0.0.1:27017/arrakis_integration_test?replicaSet=rs0"
npm run test:integration
```

Never set `MONGODB_TEST_URI` to production or a database containing user data. The integration suite deletes only the fixture records it creates.

The client uses Node's built-in test runner for socket recovery behavior:

```powershell
cd client
npm test
```

### Frontend Build Check

```powershell
cd client
npm run build
```

### Extension Validation

```powershell
node --check extension\background.js
node --check extension\domainRules.js
node --check extension\popup.js
node --check extension\block.js
node --check extension\content.js
```

The CI workflow also checks that `arrakis-extension.zip` contains the same files as `extension/`.

## Technology Stack

### Frontend

* React
* Vite
* Tailwind CSS
* Framer Motion
* Recharts
* Socket.io Client

### Backend

* Node.js
* Express
* MongoDB
* JWT Authentication
* Google OAuth
* Socket.io

### Extension

* Manifest V3
* JavaScript
* Chrome Extension APIs
* Edge Extension APIs

## Privacy

See [PRIVACY.md](PRIVACY.md) for data flow and retention. When Gemini or OpenAI is enabled, aggregated analytics and the submitted question are sent to that provider. Updated extension source transmits hostnames and durations without page titles or full URLs. Previously released extension builds may transmit both, and packaging/publishing is required before existing users receive the source change.

Users can export their profile, focus-session history, distraction records, and roadmap as JSON from Settings. Account deletion requires a recently authenticated session and identity confirmation; local-password accounts must also confirm their password. Deletion transactionally removes personal records and refresh tokens, removes team membership, and transfers team ownership to the oldest remaining member (or removes an empty team). There is no general retention scheduler for active accounts.

## Known limitations

* API and AI request ceilings use MongoDB. Requests that require rate limiting return 503 while the database is unavailable.
* Focus completion uses a MongoDB transaction. Local MongoDB and production MongoDB URIs must connect to a replica set; `docker-compose.yml` initializes a single-node set for development.
* Extension source changes are included in the tracked `arrakis-extension.zip`; publishing the updated package still requires the existing release process.
* Extension retries use stored event IDs, a persisted alarm, exponential backoff, an eight-attempt limit, and a 24-hour expiry. Unpacked Chromium and Edge automation passed; manual installation, publishing, and store compatibility still need owner verification.
* Extension account-token handoff and logout/account-switch behavior have not been exercised end to end in real Chrome and Edge profiles.
* The client uses Tailwind CSS 4, which targets Safari 16.4+, Chrome 111+, and Firefox 128+. The production and full dependency audits are clean.

## License

MIT License

## Author

N.D. Nitesh

## Repository

https://github.com/Nitesh-N-D/Arrakis-Intelligence-Platform

---

Built to help users reclaim focus, reduce distractions, and compound productivity through behavioral intelligence.
