# Arrakis Intelligence Platform

Production-grade SaaS platform for skill-gap intelligence, focus analytics, distraction control, and realtime behavioral feedback.

## 1. High-Level Architecture

```text
client (React + Vite + Tailwind + Recharts + Framer Motion)
  -> REST + Socket.io
server (Express clean architecture)
  -> controllers
  -> services
  -> repositories
  -> models
  -> middleware
  -> dune engines
MongoDB Atlas / local MongoDB
```

## 2. Database Schema

### User
- Identity, role, provider
- Skills array with proficiency levels
- Target role and personalization preferences
- Total spice, rank, streak, storm state

### FocusSession
- Session type, duration, timestamps
- Productivity score
- Spice earned

### DistractionLog
- App/source
- Duration
- Severity
- Metadata and logged time

### RefreshToken
- User relation
- Token, expiry, revocation metadata

## 3. Backend Implementation

Server structure:

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

Core engines:
- `SpiceEngine`: converts focus sessions into spice gain.
- `StormEngine`: aggregates distraction time and activates Storm Mode.
- `RankEngine`: maps total spice to progression tiers.
- `SkillAnalyzerService`: weighted gap analysis, completion score, and roadmap generation.
- `PrescienceService`: burnout-risk heuristics and recommendations.

Key endpoints:
- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/refresh`
- `GET /api/v1/auth/me`
- `POST /api/v1/skills/analyze`
- `POST /api/v1/spice/harvest`
- `POST /api/v1/storm/log`
- `GET /api/v1/analytics/dashboard`
- `GET /api/v1/prescience/analyze`

## 4. Frontend Implementation

Client structure:

```text
client/
  src/
    components/
    pages/
    hooks/
    services/
    context/
```

UI modules:
- Authentication screens
- Prescience dashboard
- Storm overlay animation
- Spice meter and rank badge
- Focus and storm Recharts visualizations
- Live websocket updates for storm, rank, and analytics refresh

## 5. Realtime Integration

Socket events:
- `storm:update`
- `spice:update`
- `rank:update`
- `analytics:update`

Clients authenticate sockets with the JWT access token and join a user-specific room.

## 6. Deployment Setup

### Local development

1. Copy `server/.env.example` to `server/.env`
2. Copy `client/.env.example` to `client/.env`
3. Install dependencies in `server` and `client`
4. Start MongoDB locally or use Atlas
5. Run `npm run dev` in both apps

### Docker

```bash
docker-compose up --build
```

### Vercel frontend

- Root directory: `client`
- Build command: `npm run build`
- Output directory: `dist`
- Env vars: `VITE_API_URL`, `VITE_SOCKET_URL`

### Render backend

- Root directory: `server`
- Build command: `npm install`
- Start command: `npm start`
- Use `render.yaml`

### MongoDB Atlas

- Create cluster
- Add IP allowlist for deployment platforms
- Create application database user
- Set `MONGODB_URI` in Render/server env

## 7. Seed Data

Run:

```bash
cd server
npm run seed
```

Seed operative:
- Email: `paul@arrakis.ai`
- Password: `Arrakis@123`

## Request / Response Examples

Register:

```json
{
  "name": "Jessica",
  "email": "jessica@arrakis.ai",
  "password": "Arrakis@123",
  "targetRole": "AI Systems Engineer"
}
```

Harvest spice:

```json
{
  "duration": 50,
  "type": "deep-50",
  "productivityScore": 88,
  "notes": "Architecture sprint"
}
```

Storm log response shape:

```json
{
  "success": true,
  "data": {
    "stormState": {
      "stormModeActive": true,
      "escalationLevel": "high",
      "totalMinutes": 135,
      "thresholdMinutes": 120,
      "pressureIndex": 113
    }
  }
}
```

## Architecture Diagram

```text
                   +------------------------------+
                   |    React Command Surface     |
                   |  Login / Dashboard / Charts  |
                   +--------------+---------------+
                                  |
                       HTTPS + Socket.io
                                  |
                 +----------------+----------------+
                 |          Express API             |
                 | auth, skills, spice, storm, ai   |
                 +--------+-------------+-----------+
                          |             |
              +-----------+---+   +-----+------------------+
              | Dune Engines  |   | Services + Repos       |
              | spice storm   |   | auth analytics focus   |
              | rank skills   |   | prescience oauth       |
              +-----------+---+   +-----+------------------+
                          |             |
                          +------+------+ 
                                 |
                           MongoDB Atlas
```
