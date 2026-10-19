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

The extension uses Manifest V3 APIs intended for Chrome and Chromium-based Microsoft Edge. Installation, blocking behavior, restart recovery, and store compatibility have not yet been manually verified in either browser. Brave and Opera are untested and are not claimed as supported.

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
* MENTAT_MAX_REQUESTS_PER_USER_DAY (defaults to 20; process-local)
* MENTAT_MAX_REQUESTS_GLOBAL_DAY (defaults to 1000; process-local)
* OPENAI_API_KEY and OPENAI_MODEL (optional; existing provider)

Mentat supports `heuristic`, `openai`, and `gemini`. Missing remote keys and provider failures return clearly labeled heuristic guidance. Gemini receives aggregated focus/distraction totals, skill-gap summaries, streak and burnout calculations, plus an optional question limited to 500 characters. These request ceilings are not shared across Render instances; Google's project quota remains authoritative.

### Client

* VITE_API_URL
* VITE_SOCKET_URL
* VITE_APP_URL

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

## Known limitations

* API and AI ceilings use process memory and are not shared across server instances.
* Focus completion uses a MongoDB transaction. Local MongoDB and production MongoDB URIs must connect to a replica set; `docker-compose.yml` initializes a single-node set for development.
* Extension source changes are included in the tracked `arrakis-extension.zip`; publishing the updated package still requires the existing release process.
* Extension retries use stored event IDs, a persisted alarm, exponential backoff, an eight-attempt limit, and a 24-hour expiry. Browser integration testing is still required.
* Chrome/Edge installation, blocking, and service-worker restart recovery were not exercised; manual browser verification is still required.
* The client uses Tailwind CSS 4, which targets Safari 16.4+, Chrome 111+, and Firefox 128+. The production and full dependency audits are clean.

## License

MIT License

## Author

N.D. Nitesh

## Repository

https://github.com/Nitesh-N-D/Arrakis-Intelligence-Platform

---

Built to help users reclaim focus, reduce distractions, and compound productivity through behavioral intelligence.
