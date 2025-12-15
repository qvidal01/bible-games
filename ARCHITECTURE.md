# Architecture

## Overview
- **Monorepo**: Turbo + npm workspaces (`apps/*`, `packages/*`).
- **Web app**: `apps/web` is a Next.js 16 App Router project with Tailwind CSS 4 and TypeScript (strict). Game state uses Zustand stores per game.
- **Realtime**: Pusher presence channels for player/session sync. Environment is validated; missing Pusher config disables realtime endpoints with 503 responses.
- **Persistence**: Room metadata is held in-memory (`src/shared/lib/roomStore`). TTL of 4 hours, cleanup task runs every 30 minutes. Swap to Redis/Upstash for production durability and multi-instance support.
- **API surface**:
  - `POST /api/rooms`: create room (validated with Zod).
  - `GET /api/rooms`: list public rooms (optionally filtered by game type).
  - `GET/POST /api/rooms/[code]`: inspect or mutate a specific room (join, leave, status updates with validation).
  - `POST /api/pusher/auth`: Pusher auth for private/presence channels.
  - `POST /api/game/broadcast`: authorized server-side broadcast; rate limited when Upstash is configured.
  - `POST /api/connections`: in-memory connection counter to gate capacity and optionally place callers into a waiting room.

## Frontend flows
- Landing page lists games and public rooms.
- Jeopardy and Family Feud have dedicated lobby pages to create/join rooms, leveraging shared validation and invite components.
- Game pages (`/jeopardy/game/[roomCode]`, `/family-feud/game/[roomCode]`) subscribe to Pusher channels for real-time state; Zustand stores drive UI rendering.

## Shared modules
- `src/shared/lib/validation.ts`: Zod schemas and helpers for player names, room codes, meeting links, and room creation payloads.
- `src/shared/lib/pusher.ts`: Client/server Pusher factories with environment validation plus shared channel/event constants.
- `src/shared/lib/roomStore.ts`: In-memory room registry with TTL enforcement and admin/testing helpers.
- `src/shared/components/*`: Error boundaries, loading states, QR invite utilities reused across pages.

## Build & tooling
- Turbo orchestrates tasks; Next handles bundling.
- Vitest for unit tests (currently covering room store invariants).
- ESLint via `next lint`; Tailwind 4 PostCSS pipeline (no custom config needed).

## Operational considerations
- Realtime and rate-limiting features are guarded by env validation to fail fast with actionable errors.
- Because rooms are in-memory, a single instance should be used or the store should be swapped for Redis to avoid cross-node drift.
- No database migrations are required in the current in-memory setup.
