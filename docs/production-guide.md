# Production Guide

## Production Readiness Checklist

- MongoDB Atlas is connected
- Render environment variables are configured
- Vercel environment variables are configured
- `SECURE_COOKIES=true`
- `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET` are each at least 32 characters
- Google OAuth redirect matches the Render backend callback URL
- Frontend origin matches `CLIENT_URL`, `APP_URL`, and `ALLOWED_ORIGINS`
- Backend health endpoint returns success at `/health`
- Frontend loads, logs in, and restores sessions correctly
- Socket events update spice, storm, streak, and leaderboard in realtime

## Mentat provider settings

Set these on the Render service, never in a Vite variable:

* `MENTAT_PROVIDER=gemini` (or `openai` / `heuristic`)
* `GEMINI_API_KEY` (optional; configure privately in Render)
* `GEMINI_MODEL=gemini-3.5-flash-lite`
* `GEMINI_TIMEOUT_MS=15000`
* `MENTAT_MAX_OUTPUT_TOKENS=800`
* `MENTAT_MAX_REQUESTS_PER_USER_DAY=20`
* `MENTAT_MAX_REQUESTS_GLOBAL_DAY=1000`

If the key is missing or Gemini fails, requests return explicitly labeled heuristic guidance. The local ceilings are process-local; use a shared durable limiter before scaling horizontally. Google's project quota is controlled in Google AI Studio/Cloud and is not guaranteed by these local values. Don't commit or send the key through chat.

The prompt includes aggregated seven-day focus and distraction totals, calculated signals, a small skill-gap summary, streak, and an optional question. It excludes browser logs, page URLs, page titles, tokens, and email addresses. Questions and aggregated context are transmitted to Gemini when enabled.

Focus completion and the Spice reward are committed in one MongoDB transaction. Configure `MONGODB_URI` to a replica set capable of transactions (MongoDB Atlas replica sets satisfy this); standalone MongoDB cannot complete harvest requests. Docker Compose initializes a single-member replica set for development.
