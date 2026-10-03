# Hostinger Deployment (Node.js 20.x + Vite)

## Runtime
- Node.js version: `20.19+` (required by Vite 7)
- App type: Node.js
- Entry/start command: `npm start`
- Working directory: project root
- Prestart guard: `npm start` runs a preflight check for Node version and required production env vars

## One-time setup on server
1. Install dependencies:
   ```bash
   npm install
   ```
2. Build frontend:
   ```bash
   npm run build
   ```
3. Start API server:
   ```bash
   npm start
   ```

## Hostinger panel values
- Build command: `npm run build`
- Start command: `npm start`
- Install command: `npm install`

## Required environment variables
- `NODE_ENV=production`
- `PORT` (Hostinger assigned port, if required)
- `JWT_SECRET`
- `ETHERSCAN_API_KEY`
- `CORS_ORIGIN`

If any required production env var is missing, startup fails fast with a clear preflight error.

## Optional environment variables
- `CUSTOM_RPC_ENDPOINT`
- `BASE_RPC_ENDPOINT`
- `ALCHEMY_API_KEY`
- `CDP_KEY_ID`
- `CDP_API_KEY`
- `BASESCAN_API_KEY`
- `COINMARKETCAP_API_KEY` (enables `/hcgi/api/crypto/prices`; the endpoint returns a 500 if unset)

## Health check
After start, verify:
```bash
curl -sS http://127.0.0.1:$PORT/hcgi/api/health
```
Expected response:
```json
{"status":"ok"}
```

## Notes
- Static web files are served from `dist/apps/web` in production.
- API routes are mounted under `/hcgi/api`.
- The app reads `.env` from the repository root.
