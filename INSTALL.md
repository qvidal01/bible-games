# Install & Run

## Prerequisites
- Node.js >= 18
- npm >= 10

## Setup
1) Install dependencies from the repo root:
   ```
   npm install
   ```
2) Configure environment for `apps/web` (create `.env.local`):
   ```
   NEXT_PUBLIC_PUSHER_KEY=pk_xxx
   NEXT_PUBLIC_PUSHER_CLUSTER=us2
   PUSHER_APP_ID=app_id
   PUSHER_SECRET=secret
   # Optional: enable Redis-backed rate limiting for broadcasts
   UPSTASH_REDIS_REST_URL=https://xxxx.upstash.io
   UPSTASH_REDIS_REST_TOKEN=token
   ```

## Commands
- Development server: `npm run dev --workspace @bible-games/web`
- Production build: `npm run build --workspace @bible-games/web`
- Start production server: `npm run start --workspace @bible-games/web`
- Lint: `npm run lint --workspace @bible-games/web`
- Tests: `npm test --workspace @bible-games/web`

## Notes
- Turbo is configured at the root; running `npm run dev` without `--workspace` will start all workspaces defined with a `dev` script.
- Room storage is in-memory; for multi-instance deployments configure Redis and migrate room state accordingly.
