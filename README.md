# Arrakis Intelligence Platform

Arrakis Intelligence Platform is a realtime behavioral intelligence SaaS application for focus tracking, distraction detection, skill progression, roadmap management, analytics, Mentat guidance, team competition, and browser-based storm blocking.

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

Latest Extension Release:

* https://github.com/Nitesh-N-D/Arrakis-Intelligence-Platform/releases/latest

### Browser Support

* Microsoft Edge
* Google Chrome
* Brave Browser
* Opera

### Microsoft Edge Add-ons Store

The Arrakis Intelligence Platform extension has been submitted to the Microsoft Edge Add-ons Store and is currently under review.

The Edge Add-ons listing URL will be added here once approved.

### Manual Installation

1. Download the latest extension release.
2. Extract the ZIP archive.
3. Open:

   * Edge → `edge://extensions`
   * Chrome → `chrome://extensions`
   * Brave → `brave://extensions`
4. Enable **Developer Mode**.
5. Click **Load unpacked**.
6. Select the extracted extension folder.

## Monorepo Structure

* `client/` — React + Vite + Tailwind + Framer Motion + Recharts frontend
* `server/` — Express clean architecture API with MongoDB, JWT authentication, Google OAuth, Socket.io, and Mentat
* `extension/` — Manifest V3 browser extension for distraction tracking and blocking
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

Editable operative identity, preferences, and blocker configuration.

### Browser Blocker

Extension synchronization for blocked sites, strict mode, and timed overrides.

## Local Development

### Backend

```powershell
cd server
copy .env.example .env
npm install
npm run dev
```

### Frontend

```powershell
cd client
copy .env.example .env
npm install
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
* OPENAI_API_KEY (optional)

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
node -e "import('./src/app.js').then(() => console.log('backend-import-ok'))"
```

### Frontend Build Check

```powershell
cd client
npm run build
```

### Extension Validation

```powershell
node --check extension\background.js
node --check extension\popup.js
node --check extension\block.js
node --check extension\content.js
```

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

Arrakis Intelligence Platform requires user authentication and may process browsing activity, focus sessions, blocked-site activity, and productivity telemetry to provide analytics, distraction detection, and behavioral intelligence features.

## License

MIT License

## Author

N.D. Nitesh

## Repository

https://github.com/Nitesh-N-D/Arrakis-Intelligence-Platform

---

Built to help users reclaim focus, reduce distractions, and compound productivity through behavioral intelligence.
