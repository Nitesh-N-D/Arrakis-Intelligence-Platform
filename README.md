# Arrakis Intelligence Platform

Arrakis Intelligence Platform is a startup-grade behavioral intelligence SaaS ecosystem built to measure discipline, detect distraction patterns, guide skill mastery, predict burnout risk, and operationalize progression with realtime feedback.

## Platform Summary

- `client/`: React + Vite + Tailwind + Framer Motion + Recharts
- `server/`: Express clean architecture with MongoDB, JWT auth, Google OAuth, Socket.io, Mentat, and Stripe-ready billing
- `extension/`: Chrome Extension (Manifest V3) for distraction tracking and hard-block enforcement

## Core Systems

- `Spice Engine`: 25-minute harvests earn 10 spice, 50-minute harvests earn 25 spice
- `Storm Engine`: logs distractions, calculates `CALM`, `DUST`, `SANDSTORM`, and `SPICE STORM`
- `Streak Engine`: updates consecutive active days automatically on session completion
- `Skill Intelligence`: compares user skills against role matrices with weighted priorities
- `Ascension System`: persists roadmap phases and auto-activates the next phase when one is completed
- `Prescience Engine`: computes burnout risk, averages, and interventions
- `Mentat`: AI-assisted behavior guidance with heuristic fallback and optional OpenAI provider
- `Leaderboard`: live user and team rankings by spice and streak
- `Billing Layer`: Stripe-ready plan model with `free` and `pro` entitlements

## Architecture

```text
Browser / Extension
  |
  +-- React dashboard
  +-- Chrome blocker / tracker
  |
  +-- REST + Socket.io
       |
       v
  Express API
    +-- controllers
    +-- middleware
    +-- services
    +-- repositories
    +-- models
    +-- socket
    +-- dune domain engines
       |
       v
  MongoDB / Atlas

External Integrations
  +-- Google OAuth
  +-- Stripe Billing
  +-- OpenAI Responses API (optional Mentat provider)
```

See [server/docs/architecture.md](./server/docs/architecture.md) for the expanded breakdown.

## Auth and Security

- JWT access tokens for API and socket auth
- refresh token rotation with secure `httpOnly` cookie support
- hashed refresh tokens at rest
- Google OAuth with Passport
- Helmet enabled
- in-memory rate limiting for global and auth-sensitive paths
- CORS restricted to configured app origins
- production env validation for critical secrets

## Product Surface

- live dashboard with glassmorphism UI
- real countdown timer with pause, resume, reset, and auto-harvest
- Storm overlay with audio alarm behavior while distraction pressure is active
- Mentat panel for next-best-action guidance
- pricing page with Free vs Pro positioning and checkout / portal hooks
- onboarding checklist and user-facing empty or retry states
- mobile navigation shell with sidebar and command menu
- SEO metadata, manifest, robots, and sitemap assets

## Local Development

### 1. Configure environment

Copy:

- [server/.env.example](./server/.env.example) -> `server/.env`
- [client/.env.example](./client/.env.example) -> `client/.env`

Key values:

- `MONGODB_URI`
- `JWT_ACCESS_SECRET`
- `JWT_REFRESH_SECRET`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- optional: `OPENAI_API_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_PRICE_PRO_MONTHLY`

### 2. Install dependencies

```bash
cd server
npm install
cd ../client
npm install
```

### 3. Seed sample data

```bash
cd server
npm run seed
```

### 4. Run locally

Backend:

```bash
cd server
npm run dev
```

Frontend:

```bash
cd client
npm run dev
```

Open `http://localhost:5173`.

## Demo Credentials

- Email: `paul@arrakis.ai`
- Password: `Arrakis@123`

## Docker

```bash
docker-compose up --build
```

## Deployment

- Frontend: Vercel using [client/vercel.json](./client/vercel.json)
- Backend: Render using [render.yaml](./render.yaml)
- Database: MongoDB Atlas

Guides:

- [docs/setup-guide.md](./docs/setup-guide.md)
- [docs/deployment-guide.md](./docs/deployment-guide.md)
- [docs/production-guide.md](./docs/production-guide.md)
- [docs/extension-setup-guide.md](./docs/extension-setup-guide.md)

## Extension

The Chrome extension:

- tracks visible active-site time every 10 seconds
- buffers activity and flushes storm logs in minute increments
- maintains blocked site policies
- supports strict mode hard blocking
- supports timed overrides when strict mode is disabled

See [extension/README.md](./extension/README.md).

## API Reference

See:

- [server/docs/api.md](./server/docs/api.md)
- [server/docs/architecture.md](./server/docs/architecture.md)

Primary routes:

- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/refresh`
- `GET /api/v1/auth/google`
- `POST /api/v1/spice/harvest`
- `POST /api/v1/storm/log`
- `GET /api/v1/analytics/dashboard`
- `GET /api/v1/prescience/analyze`
- `POST /api/v1/mentat/analyze`
- `GET /api/v1/billing/plans`
- `POST /api/v1/billing/checkout-session`
- `POST /api/v1/billing/customer-portal`

## Current Entitlement Model

- `free`: focus tracking, storm logging, leaderboard, baseline analytics, concise Mentat insight
- `pro`: full Mentat guidance, strict blocker posture, richer analytics, billing portal support

## QA Status

Validation targets in this repo:

- backend import check
- frontend production build
- OAuth callback flow
- realtime updates for spice, storm, streak, and leaderboard
- extension tracking and strict-mode blocking


