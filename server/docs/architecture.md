# Architecture

## High-Level Topology

- React frontend on Vercel
- Express API on Render
- MongoDB Atlas for persistence
- Socket.io for realtime state
- Chrome extension for tracking and blocking

## Core Services

- `AuthService`
- `TokenService`
- `FocusService`
- `StormService`
- `AnalyticsService`
- `PrescienceService`
- `MentatService`
- `ProfileService`
- `TeamService`
- `LeaderboardService`

## Realtime Events

- `spice:update`
- `storm:update`
- `streak:update`
- `leaderboard:update`
- `analytics:update`
