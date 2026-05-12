# Deployment Guide

## Frontend on Vercel

- root directory: `client`
- build command: `npm run build`
- output directory: `dist`
- configure `VITE_API_URL`, `VITE_SOCKET_URL`, `VITE_APP_URL`, `VITE_GOOGLE_SITE_VERIFICATION`

## Backend on Render

- root directory: `server`
- build command: `npm install`
- start command: `npm start`
- configure MongoDB, JWT, Google OAuth, Stripe, and optional OpenAI env vars

## MongoDB Atlas

- create cluster
- create application user
- allow backend egress IPs
- set `MONGODB_URI` in Render or server env

## Stripe

- configure `STRIPE_SECRET_KEY`
- configure `STRIPE_PRICE_PRO_MONTHLY`
- configure `STRIPE_WEBHOOK_SECRET`
- point Stripe webhook to `/api/v1/billing/webhook`

## Google OAuth

- configure consent screen
- add callback URL: `/api/v1/auth/google/callback`
- align frontend redirect URLs with deployed app URLs
