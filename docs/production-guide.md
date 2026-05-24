# Production Guide

## Production Readiness Checklist

- MongoDB Atlas is connected
- Render environment variables are configured
- Vercel environment variables are configured
- `SECURE_COOKIES=true`
- Google OAuth redirect matches the Render backend callback URL
- Frontend origin matches `CLIENT_URL`, `APP_URL`, and `ALLOWED_ORIGINS`
- Backend health endpoint returns success at `/health`
- Frontend loads, logs in, and restores sessions correctly
- Socket events update spice, storm, streak, and leaderboard in realtime
