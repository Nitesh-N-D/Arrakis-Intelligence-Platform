# Deployment Guide

## Frontend

Deploy `client/` to Vercel with:

- Build command: `npm run build`
- Output directory: `dist`
- Environment variables:
  - `VITE_API_URL=https://arrakis-intelligence-platform.onrender.com/api/v1`
  - `VITE_SOCKET_URL=https://arrakis-intelligence-platform.onrender.com`
  - `VITE_APP_URL=https://arrakis-intelligence-platform.vercel.app`

## Backend

Deploy `server/` to Render with:

- Build command: `npm install`
- Start command: `npm start`
- Environment variables:
  - `NODE_ENV=production`
  - `CLIENT_URL=https://arrakis-intelligence-platform.vercel.app`
  - `APP_URL=https://arrakis-intelligence-platform.vercel.app`
  - `ALLOWED_ORIGINS=https://arrakis-intelligence-platform.vercel.app`
  - `MONGODB_URI=<atlas-uri>`
  - `JWT_ACCESS_SECRET=<strong-secret>`
  - `JWT_REFRESH_SECRET=<strong-secret>`
  - `SECURE_COOKIES=true`
  - `GOOGLE_REDIRECT_URI=https://arrakis-intelligence-platform.onrender.com/api/v1/auth/google/callback`
