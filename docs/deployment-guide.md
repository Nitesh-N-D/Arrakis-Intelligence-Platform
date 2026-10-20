# Deployment Guide

## Frontend

Deploy `client/` to Vercel with:

- Build command: `npm run build`
- Output directory: `dist`

`client/vercel.json` runs the build during deployment and regenerates `dist`. The repository tracks selected static files under `client/dist`; Vercel's configured build command produces the bundled assets for each deployment.
- Environment variables:
  - `VITE_API_URL=https://arrakis-intelligence-platform.onrender.com/api/v1`
  - `VITE_SOCKET_URL=https://arrakis-intelligence-platform.onrender.com`

## Backend

Deploy `server/` to Render with:

- Runtime: Docker, using `server/Dockerfile` (Node.js 24 LTS)
- Install command: `npm ci`
- Start command: `npm start` (the Dockerfile's `CMD`)
- Environment variables:
  - `NODE_ENV=production`
  - `CLIENT_URL=https://arrakis-intelligence-platform.vercel.app`
  - `APP_URL=https://arrakis-intelligence-platform.vercel.app`
  - `ALLOWED_ORIGINS=https://arrakis-intelligence-platform.vercel.app`
  - `MONGODB_URI=<atlas-replica-set-uri>`
  - `JWT_ACCESS_SECRET=<strong-secret>`
  - `JWT_REFRESH_SECRET=<strong-secret>`
  - `MENTAT_PROVIDER=heuristic` (or `gemini` / `openai`)
  - `GEMINI_API_KEY=<server-only-secret>` when using Gemini
  - `GEMINI_MODEL=gemini-3.5-flash-lite`
  - `SECURE_COOKIES=true`
  - `GOOGLE_REDIRECT_URI=https://arrakis-intelligence-platform.onrender.com/api/v1/auth/google/callback`

Each JWT secret must contain at least 32 characters. The focus completion transaction requires MongoDB replica-set support; configure Atlas or another replica set. Do not put Gemini or OpenAI keys in Vercel/Vite variables.
