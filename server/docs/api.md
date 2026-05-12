# Arrakis API

Base URL: `http://localhost:5000/api/v1`

## Error Shape

```json
{
  "success": false,
  "message": "Human readable message",
  "details": null
}
```

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

Response:

- access token in JSON
- refresh token in JSON for compatibility
- refresh token cookie set as `httpOnly`

### `POST /auth/login`

```json
{
  "email": "paul@arrakis.ai",
  "password": "Arrakis@123"
}
```

### `POST /auth/refresh`

Uses refresh cookie automatically. Body token is still accepted for compatibility.

### `POST /auth/logout`

Clears refresh cookie and revokes the stored refresh token.

### `GET /auth/google`

Starts Google OAuth.

### `GET /auth/google/callback`

Completes Google OAuth, sets the refresh cookie, and redirects the frontend with an access token.

## Focus / Spice

### `POST /spice/harvest`

```json
{
  "duration": 25,
  "type": "pomodoro-25",
  "notes": "Morning harvest"
}
```

Rules:

- `25 -> 10 spice`
- `50 -> 25 spice`

## Storm

### `POST /storm/log`

```json
{
  "appName": "YouTube",
  "duration": 45,
  "severity": "high",
  "metadata": {
    "device": "desktop",
    "category": "video",
    "source": "extension",
    "pageTitle": "Live stream",
    "pageUrl": "https://youtube.com/watch?v=abc123"
  }
}
```

Storm bands:

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

Returns weighted completion, missing skills, and an ordered `disciplineMap`.

## Analytics

### `GET /analytics/dashboard`

Returns:

- operative profile
- focus and distraction counts
- spice and storm trend series
- performance signals
- skill analysis
- roadmap
- leaderboard summary

## Prescience

### `GET /prescience/analyze`

Returns:

- `burnoutRisk`
- `riskBand`
- averages
- recommendations

## Roadmap

### `GET /roadmap/current`

Returns the current persisted roadmap.

### `POST /roadmap/phases/:phaseId/complete`

Completes the phase, upgrades the skill, and activates the next available phase.

## Leaderboard

### `GET /leaderboard/users`

Top users by spice and streak.

### `GET /leaderboard/teams`

Top teams by spice and aggregated streak.

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
  "name": "Fremen Vanguard"
}
```

## Mentat

### `POST /mentat/analyze`

```json
{
  "question": "What should I optimize tomorrow morning?"
}
```

Response:

```json
{
  "success": true,
  "data": {
    "provider": "heuristic",
    "summary": "Mentat sees a recoverable rhythm...",
    "dailyRecommendations": [
      "Protect the next morning with a guaranteed 25-minute harvest."
    ],
    "warnings": [],
    "nextBestAction": "Complete one roadmap task and finish one harvest.",
    "focusSchedule": {
      "recommendedStartHour": "09:00",
      "recommendedPrimarySession": 25,
      "recommendedRecoveryWindow": "Use a 5-minute reset between harvests."
    }
  }
}
```

## Billing

### `GET /billing/plans`

Returns the Free and Pro plans exposed to the frontend.

### `GET /billing/status`

Returns the authenticated user billing state.

### `POST /billing/checkout-session`

Creates a Stripe Checkout Session for the Pro subscription.

### `POST /billing/customer-portal`

Creates a Stripe Billing Portal session.

### `POST /billing/webhook`

Consumes Stripe webhook events.

Notes:

- the route expects the raw request body
- signature verification uses `STRIPE_WEBHOOK_SECRET`
- supported events update the local user billing plan and subscription state
