# Production Guide

## Recommended environment posture

- set `NODE_ENV=production`
- set strong JWT secrets
- enable `SECURE_COOKIES=true`
- use HTTPS for frontend and backend
- set real Stripe and Google OAuth credentials
- set `MENTAT_PROVIDER=openai` only when `OPENAI_API_KEY` is configured

## Operational checks

- verify `/health`
- test login and refresh flow
- test Google OAuth
- test a focus harvest and socket updates
- test a distraction log and storm transition
- test Stripe checkout and webhook delivery
- test extension strict mode on a blocked domain

## Scaling notes

- move rate limiting and session metadata to Redis when horizontally scaling
- persist job-style webhook reconciliation for Stripe retries
- add queue-backed analytics fanout if event volume grows
- add tenant scoping and org-level billing for larger team deployments
