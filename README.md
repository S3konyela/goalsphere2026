# GoalSphere MVP

A launch-ready football platform MVP with:
- React + Vite frontend
- Sanity articles integration
- Supabase teams integration
- Football fixtures via Vercel serverless proxy

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```
2. Copy environment variables:
   ```bash
   cp .env.example .env
   ```
   On Windows PowerShell, use:
   ```powershell
   cp .env.example .env
   ```
3. Fill in `.env` with your own values, including `VITE_SANITY_PROJECT_ID` and `VITE_SANITY_DATASET` if needed.

> After editing `.env`, stop and restart the Vite server so the new variables are loaded.

## Run locally

Use Vite for normal frontend development:
```bash
npm run dev
```

For fixtures proxy support in local development, use Vercel dev:
```bash
npx vercel dev
```

## Deploy to Vercel

1. Connect this repository to Vercel.
2. Set the environment variables in the Vercel dashboard.
3. Vercel will use `npm run build` automatically.

## Project structure

- `src/` — React app source files
- `src/services/` — data integration services
- `api/fixtures.js` — serverless proxy for the football fixtures API
- `vercel.json` — Vercel deployment configuration
