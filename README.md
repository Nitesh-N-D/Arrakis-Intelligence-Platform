# Arrakis Intelligence Platform

Arrakis Intelligence Platform is a production-oriented behavioral intelligence SaaS system built to measure discipline, track focus, detect distraction pressure, guide skill growth, predict burnout, and enforce long-term progression.

## 1. Architecture

```text
client (React + Vite + Tailwind + Framer Motion + Recharts)
  -> REST + Socket.io
server (Express clean architecture)
  -> controllers
  -> services
  -> repositories
  -> models
  -> middleware
  -> dune domain engines
mongodb (MongoDB / Atlas)
```

Core domain engines:
- `SpiceEngine`: fixed focus-to-spice conversion.
- `StormEngine`: daily distraction aggregation into CALM, DUST, SANDSTORM, and SPICE STORM.
- `SkillAnalyzerService`: weighted discipline map and ordered learning priority.
- `RoadmapService`: persisted multi-phase ascension roadmap with auto-advance.
- `PrescienceService`: burnout-risk prediction and behavioral guidance.

## 2. Database Schema

### User
- Identity and auth fields
- Role and OAuth provider
- Skills array with levels
- Target role
- Total spice
- Current rank
- Focus streak
- Last active date
- Storm mode state

### FocusSession
- Duration
- Session type
- Spice earned
- Timestamps
- Productivity score

### DistractionLog
- App/source name
- Duration
- Severity
- Logged time

### RefreshToken
- User reference
- Token lifecycle metadata

### RoadmapPlan
- Persisted roadmap per user
- Ordered phases
- Phase status (`locked`, `active`, `done`, `skipped`)
- Tasks and duration

## 3. Backend

Server layout:

```text
server/
  src/
    config/
    controllers/
    services/
    repositories/
    models/
    middleware/
    routes/
    socket/
    dune/
    utils/
    seed/
  docs/
```

Implemented capabilities:
- JWT auth with refresh tokens
- Google OAuth-ready structure
- Protected routes middleware
- Focus harvest storage and streak calculation
- Real storm logging and level calculation
- Realtime `spice:update`, `storm:update`, and `streak:update`
- Skill-gap analysis with weighted scoring
- Persisted roadmap progression
- Dashboard and prescience analytics

## 4. Frontend

Client layout:

```text
client/
  src/
    components/
    pages/
    hooks/
    services/
    context/
```

Implemented capabilities:
- Login and registration
- Live dashboard with glassmorphism UI
- Real countdown timer with pause/resume/reset
- Auto-harvest on timer completion
- Spice meter and rank badge
- Storm overlay
- Recharts analytics
- Prescience recommendation panel
- Discipline map and roadmap completion flow

## 5. Timer System

Exact focus rules:
- `25 minutes -> 10 spice`
- `50 minutes -> 25 spice`

Timer behavior:
- Start on `Harvest 25` or `Harvest 50`
- Buttons lock during active session
- Pause and resume supported
- Completion auto-calls `/spice/harvest`
- UI updates via REST refresh and Socket.io events

## 6. Realtime

Socket events:
- `spice:update`
- `storm:update`
- `streak:update`
- `analytics:update`

Sockets authenticate with the same JWT access token used by REST requests.

## 7. Local Run

### Option A: standard local run

1. Copy [server/.env.example](./server/.env.example) to `server/.env`
2. Copy [client/.env.example](./client/.env.example) to `client/.env`
3. Install dependencies:

```bash
cd server
npm install
cd ../client
npm install
```

4. Start MongoDB locally, or use Atlas
5. Seed demo data:

```bash
cd server
npm run seed
```

6. Run backend:

```bash
cd server
npm run dev
```

7. Run frontend in another terminal:

```bash
cd client
npm run dev
```

8. Open `http://localhost:5173`

### Option B: Docker

```bash
docker-compose up --build
```

## 8. Demo Credentials

- Email: `paul@arrakis.ai`
- Password: `Arrakis@123`

## 9. Deployment

### Frontend -> Vercel
- Root: `client`
- Build command: `npm run build`
- Output: `dist`
- Config: [client/vercel.json](./client/vercel.json)

### Backend -> Render
- Root: `server`
- Build command: `npm install`
- Start command: `npm start`
- Config: [render.yaml](./render.yaml)

### Database -> MongoDB Atlas
- Create cluster
- Create database user
- Add IP allowlist
- Set `MONGODB_URI` in Render/server env

## 10. API Reference

See:
- [server/docs/api.md](./server/docs/api.md)
- [server/docs/architecture.md](./server/docs/architecture.md)

Primary endpoints:
- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `GET /api/v1/auth/me`
- `POST /api/v1/spice/harvest`
- `POST /api/v1/storm/log`
- `POST /api/v1/skills/analyze`
- `GET /api/v1/analytics/dashboard`
- `GET /api/v1/prescience/analyze`
- `GET /api/v1/roadmap/current`
- `POST /api/v1/roadmap/phases/:phaseId/complete`
