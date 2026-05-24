# Arrakis Intelligence Platform

Arrakis Intelligence Platform is a realtime behavioral intelligence SaaS application for focus tracking, distraction detection, skill progression, roadmap management, analytics, Mentat guidance, team competition, and Chrome-based storm blocking.

## Live Deployments

- Frontend: https://arrakis-intelligence-platform.vercel.app
- Backend: https://arrakis-intelligence-platform.onrender.com

## Monorepo Structure

- `client/`: React + Vite + Tailwind + Framer Motion + Recharts frontend
- `server/`: Express clean architecture API with MongoDB, JWT auth, Google OAuth, Socket.io, and Mentat
- `extension/`: Manifest V3 Chrome extension for distraction tracking and blocking
- `docs/`: setup, deployment, production, and extension guides

## Core Systems

- `Spice System`: real focus sessions with timer-driven harvest logging
- `Storm System`: distraction logging, thresholds, and realtime storm state
- `Streak System`: consecutive focus-day tracking
- `Discipline Map`: skill gap analysis against target roles
- `Ascension Roadmap`: persisted roadmap phases with completion progress
- `Prescience Engine`: burnout and performance analysis
- `Mentat`: behavioral recommendations and next-best-action guidance
- `Leaderboard`: realtime user and team rankings
- `Profile + Settings`: editable operative identity and blocker preferences
- `Chrome Blocker`: extension sync for blocked sites, strict mode, and overrides

## Local Development

### Backend

```powershell
cd "C:\Users\Nitesh\OneDrive\Documents\Arrakis Intelligence Platform\server"
copy .env.example .env
npm install
npm run dev
```

### Frontend

```powershell
cd "C:\Users\Nitesh\OneDrive\Documents\Arrakis Intelligence Platform\client"
copy .env.example .env
npm install
npm run dev
```

### Optional Docker

```powershell
cd "C:\Users\Nitesh\OneDrive\Documents\Arrakis Intelligence Platform"
docker-compose up --build
```

## Required Environment Variables

### Server

- `PORT`
- `NODE_ENV`
- `CLIENT_URL`
- `APP_URL`
- `ALLOWED_ORIGINS`
- `MONGODB_URI`
- `JWT_ACCESS_SECRET`
- `JWT_REFRESH_SECRET`
- `REFRESH_COOKIE_NAME`
- `SECURE_COOKIES`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_REDIRECT_URI`
- `GOOGLE_SUCCESS_REDIRECT_URL`
- `GOOGLE_FAILURE_REDIRECT_URL`
- `MENTAT_PROVIDER`
- `OPENAI_API_KEY` if using remote Mentat

### Client

- `VITE_API_URL`
- `VITE_SOCKET_URL`
- `VITE_APP_URL`

## Production Notes

- Set `CLIENT_URL`, `APP_URL`, and `ALLOWED_ORIGINS` to `https://arrakis-intelligence-platform.vercel.app`
- Set `SECURE_COOKIES=true` on Render
- Point `GOOGLE_REDIRECT_URI` to `https://arrakis-intelligence-platform.onrender.com/api/v1/auth/google/callback`
- Keep `VITE_API_URL=https://arrakis-intelligence-platform.onrender.com/api/v1`
- Keep `VITE_SOCKET_URL=https://arrakis-intelligence-platform.onrender.com`

## Verification Commands

```powershell
cd "C:\Users\Nitesh\OneDrive\Documents\Arrakis Intelligence Platform\server"
node -e "import('./src/app.js').then(() => console.log('backend-import-ok'))"
```

```powershell
cd "C:\Users\Nitesh\OneDrive\Documents\Arrakis Intelligence Platform\client"
npm run build
```

```powershell
cd "C:\Users\Nitesh\OneDrive\Documents\Arrakis Intelligence Platform"
node --check extension\background.js
node --check extension\popup.js
node --check extension\block.js
node --check extension\content.js
```
