# Setup Guide

## Local Setup

Use Node.js 24.x and npm for both packages.

1. Copy `server/.env.example` to `server/.env`
2. Copy `client/.env.example` to `client/.env`
3. Start the local replica set with `docker compose up mongodb`, or configure `MONGODB_URI` to a MongoDB replica set. A standalone `mongod` does not support focus reward transactions.
4. Run `npm ci` in `server/` and `client/`
5. Start the backend with `npm run dev` in `server/`
6. Start the frontend with `npm run dev` in `client/`

## Default Local URLs

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:5000`
- Backend health: `http://localhost:5000/health`
