# Bible Games (JW Edition)

Next.js monorepo containing two real-time Bible trivia experiences (Jeopardy and Family Feud). Rooms are created via Next.js API routes and kept in memory for now; gameplay relies on Pusher for live updates with optional Upstash Redis rate limiting.

## What’s inside
- `apps/web`: Next.js 16 App Router UI, Zustand state for each game, API routes for rooms, Pusher auth/broadcast.
- `packages/*`: reserved for shared config/UI (currently empty placeholders).
- Tooling: Turbo for workspaces, TypeScript (strict), Tailwind CSS 4, Vitest for unit tests.

## Quickstart
1) Requirements: Node 18+ and npm 10 (packageManager pinned).
2) Install: `npm install` (from repo root).
3) Environment (apps/web/.env.local):
   ```
   NEXT_PUBLIC_PUSHER_KEY=pk_xxx
   NEXT_PUBLIC_PUSHER_CLUSTER=us2
   PUSHER_APP_ID=app_id
   PUSHER_SECRET=secret
   # Optional for broadcast rate limiting
   UPSTASH_REDIS_REST_URL=https://xxxx.upstash.io
   UPSTASH_REDIS_REST_TOKEN=token
   ```
4) Run the app:
   - Dev: `npm run dev --workspace @bible-games/web`
   - Build: `npm run build --workspace @bible-games/web`
   - Start: `npm run start --workspace @bible-games/web`
5) Tests: `npm test --workspace @bible-games/web` (Vitest).

## Notes
- Realtime features are disabled with a 503 response when Pusher env vars are missing.
- Room storage is in-memory with a 4-hour TTL; swap to Redis for production durability.
- Rate limiting for broadcasts is optional and auto-configures when Upstash creds exist.
