# Xrypt Copilot Instructions

## Big Picture (read first)
- Express + WebSocket server lives in [server.js](../server.js); it wires routes, WebSocket streaming, middleware order, and interval jobs.
- Submission flow: `/api/submit` → [scripts/automatedSubmissionHandler.js](../scripts/automatedSubmissionHandler.js) → collectors → validators → payment → AI update → JSON persistence in `data/` + `output/`.
- AI stack: [src/ai-engine/hybridEngine.js](../src/ai-engine/hybridEngine.js) extends [src/ai-engine/selfImprovingEngine.js](../src/ai-engine/selfImprovingEngine.js). It merges public patterns with trader loss patterns and caches signals to prevent spam.
- Signal tracking + notifications are coupled: [src/tracking/signalTracker.js](../src/tracking/signalTracker.js) is injected into [src/notifications/notificationManager.js](../src/notifications/notificationManager.js) and AI engines; notifications are deduped per signal.
- Data is JSON-first. Keep schema keys stable in `data/*.json` and `output/**` (patterns, subscribers, active signals, submission artifacts).

## Critical Workflows
- Install: `npm install` (Node 18+). Start server: `npm start` (same as `npm run dev`). PM2 config: [ecosystem.config.js](../ecosystem.config.js).
- Bootstrap public AI data: `npm run bootstrap` → [scripts/bootstrapHybridAI.js](../scripts/bootstrapHybridAI.js) → `data/hybrid_pattern_database.json`.
- Collect trader data: `npm run collect -- --platform binance --api-key X --api-secret Y` → [scripts/collect.js](../scripts/collect.js) → collectors in [src/collectors/](../src/collectors/).
- Smoke test: `npm test` runs [scripts/testHybridSystem.js](../scripts/testHybridSystem.js).
- Health check: `GET /api/health` should return `status: ok`.

## Project Conventions & Patterns
- Middleware order in [server.js](../server.js) is intentional: env → session/auth → helmet/cors/body → logging (dev) → sanitization → rate limiters → routes → static. Preserve order.
- Validation/sanitization is centralized in [src/middleware/validation.js](../src/middleware/validation.js); don’t bypass `sanitizeHtml`.
- Rate limiting, CORS, admin auth live in [src/middleware/security.js](../src/middleware/security.js). Health check is skipped from global limiter.
- Collectors use exchange-specific signing and paging (e.g., Binance HMAC in [src/collectors/binanceCollector.js](../src/collectors/binanceCollector.js)); reuse delay helpers to avoid bans.
- Use existing confidence/scoring helpers in AI engines; avoid bespoke recalculation logic that drifts from [src/ai-engine/hybridEngine.js](../src/ai-engine/hybridEngine.js).

## Integrations & Endpoints
- Core APIs in [server.js](../server.js): submissions, exchanges, networks, payouts, feedback (`/api/feedback/*`), notifications (`/api/notifications/*`), admin session/login.
- WebSocket events: `connected`, `status`, `log`, `ai_update`, `complete`, `error` keyed by `connectionId`.
- DEX integration routes live under `/api/dex/*` and use [src/dex/walletTradingIntegration.js](../src/dex/walletTradingIntegration.js).

## Data & Ops
- Backup and monitoring: [src/utils/backupManager.js](../src/utils/backupManager.js), [src/ai-engine/dataPipeline.js](../src/ai-engine/dataPipeline.js). Keep interval timers in [server.js](../server.js).
- Env-driven config: `.env` for PORT, ALLOWED_ORIGINS, ADMIN_API_KEY, SMTP/Telegram tokens, encryption keys. Never commit secrets.

## References
- Architecture: [docs/PLATFORM_ARCHITECTURE.md](../docs/PLATFORM_ARCHITECTURE.md)
- Hybrid AI: [docs/HYBRID_AI_GUIDE.md](../docs/HYBRID_AI_GUIDE.md)
- Notifications: [docs/NOTIFICATION_SYSTEM.md](../docs/NOTIFICATION_SYSTEM.md)
