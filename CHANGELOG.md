# Changelog

## 2025-02-04
- Added environment validation utilities for Pusher and Upstash and hardened realtime endpoints to fail fast with 503 responses when misconfigured.
- Locked down room join flow server-side (status check, input validation) and exposed a safe `clearRooms` helper for admin/tests.
- Introduced Vitest with initial unit coverage for room store lifecycle and TTL cleanup.
- Documented repo layout, architecture, install steps, and operational notes.
- Replaced deprecated `next lint` with flat ESLint config, added `/api/connections` capacity handler, and resolved lint issues in join flows; `npm audit` still pending due to offline environment.
