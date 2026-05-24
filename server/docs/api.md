# API Documentation

## Auth

- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/refresh`
- `POST /api/v1/auth/logout`
- `GET /api/v1/auth/me`
- `GET /api/v1/auth/google/url`
- `GET /api/v1/auth/google`
- `GET /api/v1/auth/google/callback`

## Focus and Storm

- `POST /api/v1/spice/harvest`
- `POST /api/v1/focus`
- `POST /api/v1/storm/log`

## Analytics and Intelligence

- `GET /api/v1/analytics/dashboard`
- `GET /api/v1/prescience/analyze`
- `POST /api/v1/mentat/analyze`
- `POST /api/v1/skills/analyze`
- `GET /api/v1/roadmap/current`
- `POST /api/v1/roadmap/phases/:phaseId/complete`

## Leaderboards and Teams

- `GET /api/v1/leaderboard/users`
- `GET /api/v1/leaderboard/teams`
- `POST /api/v1/team/create`
- `POST /api/v1/team/join`

## Profile and Settings

- `GET /api/v1/profile`
- `PATCH /api/v1/profile`
- `PATCH /api/v1/profile/settings`
