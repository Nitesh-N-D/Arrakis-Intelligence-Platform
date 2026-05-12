# Arrakis Architecture

## System Diagram

```text
React Client
  +-- Auth flows
  +-- Dashboard
  +-- Pricing
  +-- Mentat panel
  +-- Socket listeners
        |
        | REST / Socket.io
        v
Express API
  +-- controllers
  +-- middleware
  +-- services
  +-- repositories
  +-- models
  +-- socket
        |
        +-- Google OAuth
        +-- Stripe Billing
        +-- OpenAI Responses API (optional)
        |
        v
MongoDB

Chrome Extension
  +-- active-site tracker
  +-- storm logger
  +-- strict-mode blocker
```

## Backend Layering

### Controllers

Translate HTTP requests into service calls and shape response payloads.

### Services

Own business logic:

- `FocusService`
- `StormService`
- `AnalyticsService`
- `PrescienceService`
- `RoadmapService`
- `MentatService`
- `StripeService`
- `LeaderboardService`
- `AuthService`

### Repositories

Encapsulate Mongoose reads and writes for:

- users
- focus sessions
- distraction logs
- roadmap plans
- refresh tokens
- teams

### Domain Engines

- `SpiceEngine`: focus duration -> spice conversion
- `RankEngine`: spice total -> rank tier
- `StormEngine`: distraction totals -> storm level
- `SkillAnalyzerService`: weighted skill comparison against role matrices

## Auth Flow

### Local auth

1. register or login
2. issue JWT access token
3. issue refresh token and persist hashed token record
4. set refresh token in `httpOnly` cookie
5. frontend retries expired sessions using `/auth/refresh`

### Google OAuth

1. frontend sends user to `/auth/google`
2. Passport authenticates with Google
3. backend issues access token and refresh cookie
4. frontend callback receives only the access token in query params
5. future refreshes use the cookie path

## Billing Flow

1. frontend requests available plans
2. authenticated user requests checkout session
3. backend ensures Stripe customer exists
4. backend creates subscription checkout session
5. Stripe webhook updates local billing state
6. frontend opens customer portal for self-serve plan management

## Mentat Flow

1. frontend calls `POST /mentat/analyze`
2. backend composes context from dashboard analytics and prescience
3. Mentat chooses provider:
   - `heuristic`
   - `openai`
4. response returns summary, recommendations, warnings, next best action, and focus schedule

## Realtime Events

- `spice:update`
- `storm:update`
- `streak:update`
- `analytics:update`
- `leaderboard:update`

## Extension Flow

1. content script emits a heartbeat every 10 seconds while the page is active and visible
2. background worker buffers usage by host
3. each full minute flushes a storm log into the API
4. blocked domains redirect into `block.html`
5. strict mode disables override entirely
6. non-strict mode allows timed bypass
