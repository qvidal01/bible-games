# Implementation Notes

- **Environment validation**: `src/shared/lib/env.ts` now validates Pusher and Upstash credentials. Realtime routes return 503 with actionable messaging when misconfigured. Client Pusher initialization will throw if public env vars are absent to surface configuration issues early.
- **Realtime separation**: Pusher server instances are lazily created to avoid touching secrets when env is missing. Broadcast endpoint only rate-limits when Upstash credentials exist; otherwise it logs a warning and continues.
- **Room store hardening**: Joining a room now respects room status (blocks joins once playing) and exposes `clearRooms()` for tests/admin tooling. TTL cleanup already runs every 30 minutes.
- **Testing**: Vitest is configured with path aliases; current coverage focuses on room store invariants and TTL cleanup. Expand coverage to game logic and validation rules as you evolve gameplay.
- **State persistence**: Rooms remain in-memory. For production/multi-node deployments, port `roomStore` to Redis/Upstash and ensure API routes use atomic operations.
- **Known gaps**: References to `/api/connections` in the Jeopardy game page are placeholders; either implement a connection tracker or remove the calls to reduce noise. Vulnerabilities reported by `npm install` remain to be triaged (`npm audit`).
- **Connections endpoint**: Added a lightweight `/api/connections` handler to track per-room connection counts and return a waiting-room response when capacity is exceeded. It is intentionally in-memory; swap to Redis for durability in multi-instance deployments.
- **Linting**: Replaced the removed `next lint` command with flat-config ESLint and relaxed experimental React Hook purity rules that produced false positives in UI animations. Lint now runs via `npm run lint` from the workspace.
- **Audit**: `npm audit` could not reach the registry in this environment (network EAI_AGAIN). Re-run in a networked environment to triage the 6 issues reported during install.
