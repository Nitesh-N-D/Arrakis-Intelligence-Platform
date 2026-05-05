# Arrakis Intelligence Platform API

Base URL: `http://localhost:5000/api/v1`

## Auth

### `POST /auth/register`

```json
{
  "name": "Jessica",
  "email": "jessica@arrakis.ai",
  "password": "Arrakis@123",
  "targetRole": "AI Systems Engineer",
  "skills": [
    { "name": "React", "level": 4 },
    { "name": "Node.js", "level": 3 }
  ]
}
```

### `POST /auth/login`

```json
{
  "email": "paul@arrakis.ai",
  "password": "Arrakis@123"
}
```

### `POST /auth/refresh`

```json
{
  "refreshToken": "jwt-refresh-token"
}
```

### `GET /auth/google`

Starts Google OAuth through Passport and redirects the user to Google.

### `GET /auth/google/callback`

Completes Google OAuth, issues JWT + refresh token, and redirects to the frontend callback URL:

`/auth/callback?accessToken=...&refreshToken=...&provider=google`

## Spice / Focus

### `POST /spice/harvest`

```json
{
  "duration": 25,
  "type": "pomodoro-25",
  "notes": "Morning harvest"
}
```

Response highlights:

```json
{
  "success": true,
  "data": {
    "session": {
      "duration": 25,
      "spiceEarned": 10
    },
    "operative": {
      "totalSpice": 120,
      "focusStreak": 5
    }
  }
}
```

## Storm

### `POST /storm/log`

```json
{
  "appName": "YouTube",
  "duration": 45,
  "severity": "high",
  "site": "youtube.com",
  "url": "https://youtube.com/watch?v=abc123",
  "source": "extension",
  "metadata": {
    "device": "desktop",
    "category": "video",
    "pageTitle": "Live stream",
    "source": "extension"
  }
}
```

Storm levels:
- `0-59`: `CALM`
- `60-119`: `DUST`
- `120-179`: `SANDSTORM`
- `180+`: `SPICE STORM`

## Skills

### `POST /skills/analyze`

```json
{
  "targetRole": "AI Systems Engineer",
  "skills": [
    { "name": "React", "level": 4 },
    { "name": "Node.js", "level": 4 },
    { "name": "MongoDB", "level": 2 }
  ]
}
```

Returns:
- weighted completion
- missing skills
- ordered `disciplineMap`

## Roadmap

### `GET /roadmap/current`

Returns the persisted ascension roadmap for the authenticated operative.

### `POST /roadmap/phases/:phaseId/complete`

Marks the current phase as complete, upgrades the underlying skill, and activates the next phase automatically.

## Analytics

### `GET /analytics/dashboard`

Returns:
- operative summary
- focus session count
- distraction event count
- spice harvest trend
- storm pressure trend
- discipline map
- roadmap state
- leaderboard summary

## Leaderboard

### `GET /leaderboard/users`

Returns the top operatives ranked by `totalSpice`, with `focusStreak`, `currentRank`, and `team`.

### `GET /leaderboard/teams`

Returns the top teams ranked by `totalSpice`, with aggregated streak and member count.

## Teams

### `POST /team/create`

```json
{
  "name": "Fremen Vanguard"
}
```

### `POST /team/join`

```json
{
  "teamId": "6818f0bcbf0a1f2f0a1f2f0a"
}
```

You can also join by name:

```json
{
  "name": "Fremen Vanguard"
}
```

## Prescience

### `GET /prescience/analyze`

Returns:
- `burnoutRisk`
- `riskBand`
- focus/distraction/streak averages
- recommendations
