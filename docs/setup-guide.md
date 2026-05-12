# Setup Guide

## Local prerequisites

- Node.js 20+
- MongoDB local or Atlas
- Chrome for the extension

## Server

1. Copy `server/.env.example` to `server/.env`
2. Set MongoDB and JWT secrets
3. Optional: configure Google OAuth, OpenAI, and Stripe
4. Run:

```bash
cd server
npm install
npm run seed
npm run dev
```

## Client

1. Copy `client/.env.example` to `client/.env`
2. Confirm `VITE_API_URL` and `VITE_SOCKET_URL`
3. Run:

```bash
cd client
npm install
npm run dev
```

## Extension

See [extension-setup-guide.md](./extension-setup-guide.md).
