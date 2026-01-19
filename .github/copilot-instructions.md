# Xrypt Copilot Instructions

Use these notes to stay productive and consistent when editing this repo.

## Architecture & Data Flow
- Main server is Express + WebSocket in [server.js](../server.js); routes cover submissions, health, exchanges, payouts, notifications, and admin views.
- Submission path: `/api/submit` → [scripts/automatedSubmissionHandler.js](../scripts/automatedSubmissionHandler.js) → collectors → AI engine → updates JSON databases under `data/` and `output/`.
- AI stack: [src/ai-engine/hybridEngine.js](../src/ai-engine/hybridEngine.js) extends self-improving engine; combines public bootstrap data with trader loss patterns and caches signals to avoid spam.
- Signal tracking and notifications are coupled: [src/tracking/signalTracker.js](../src/tracking/signalTracker.js) is injected into [src/notifications/notificationManager.js](../src/notifications/notificationManager.js) and AI engines for WebSocket + email/Telegram delivery.
- Data persistence is JSON-first: pattern DBs (`data/pattern_database.json`, `data/hybrid_pattern_database.json`, `data/online_signals.json`), subscribers (`data/subscribers.json`), active signals (`data/active_signals.json`), submissions/validation outputs (`output/`). Keep schema keys stable when editing.

## Key Workflows
- Install: `npm install` at repo root. Node 18+ expected.
- Run API/WebSocket server: `npm start` (same as `npm run dev`); pm2 config lives in [ecosystem.config.js](../ecosystem.config.js).
- Bootstrap public AI data: `npm run bootstrap` → pulls Binance public data via [scripts/bootstrapHybridAI.js](../scripts/bootstrapHybridAI.js) and fills `data/hybrid_pattern_database.json`.
- Collect private trader data: `npm run collect -- --platform binance --api-key X --api-secret Y` uses [scripts/collect.js](../scripts/collect.js) and [src/collectors/binanceCollector.js](../src/collectors/binanceCollector.js); validates quality tiers and feeds AI + payouts.
- Tests/smoke: `npm test` runs [scripts/testHybridSystem.js](../scripts/testHybridSystem.js) to exercise collectors/engine.
- Health check: `GET /api/health` should return `status: ok`; curl after start or pm2 deploys.

## API & Notifications
- Core endpoints in [server.js](../server.js): submissions (`/api/submit`), status, exchanges, networks, requirements, enhanced payouts, feedback endpoints (`/api/feedback/*`), notification subscribe/stats/test routes, and admin session/login routes.
- WebSockets send `connected`, `status`, `log`, `ai_update`, `complete`, `error` events keyed by `connectionId`; server overrides `console.log` during submissions to stream to clients.
- Notification preferences and storage are defined in [src/notifications/notificationManager.js](../src/notifications/notificationManager.js); respects per-subscriber filters (confidence, symbols, direction) and supports email/Telegram via nodemailer + node-telegram-bot-api.

## Security, Validation, Conventions
- Rate limiting, helmet, CORS, admin auth, and logging live in [src/middleware/security.js](../src/middleware/security.js); keep defaults unless intentional. Health check is skipped from global limiter.
- Input validation/sanitization in [src/middleware/validation.js](../src/middleware/validation.js) (submissions, feedback, subscriptions); sanitizeHtml runs globally—avoid bypassing.
- Admin auth supports sessions + optional `ADMIN_API_KEY` and IP whitelist. Static `admin.html` is blocked unless logged in; keep middleware order when changing routes.
- Environment: `.env` for PORT, NODE_ENV, ALLOWED_ORIGINS, ADMIN_API_KEY, session secrets, SMTP/Telegram tokens, encryption keys. Never commit secrets.
- Data pipeline & backups: [src/ai-engine/dataPipeline.js](../src/ai-engine/dataPipeline.js) monitors DB health; [src/utils/backupManager.js](../src/utils/backupManager.js) handles snapshots. Preserve interval timers started in [server.js](../server.js).

## AI/Collector Notes
- HybridEngine confidence is weighted by source (public/trader/combined), occurrences, recency, losses, and pattern type; use existing helpers rather than bespoke scoring to avoid drift.
- Public bootstrap uses [src/collectors/binancePublicCollector.js](../src/collectors/binancePublicCollector.js) + [src/ai-engine/publicDataAnalyzer.js](../src/ai-engine/publicDataAnalyzer.js); adjust symbols/days in scripts/bootstrapHybridAI.js if changing coverage.
- Trader ingestion expects losses-first patterns; see `extractLossPatterns` and `getPatternKey` in [src/ai-engine/selfImprovingEngine.js](../src/ai-engine/selfImprovingEngine.js) when modifying structure.
- Collectors follow Binance REST signing (HMAC SHA256) and rate-limit-friendly paging; reuse delay helpers to avoid bans.

## Frontend/Integration
- Public assets under [public/](../public/) include admin UI; keep `/admin.html` protected. Frontend integration (Quantum Futures) is separate repo noted in [docs/PLATFORM_ARCHITECTURE.md](../docs/PLATFORM_ARCHITECTURE.md); server supplies signals + notifications via REST/WS.

## When Editing
- Preserve JSON file formats; prefer additive changes and keep backups aligned with [src/utils/backupManager.js](../src/utils/backupManager.js).
- Maintain middleware order in [server.js](../server.js): env load → session/auth → helmet/cors/body → logging (dev) → sanitization → rate limiters → routes → static.
- Favor existing utilities (sleep/delay, pattern calculators, validators) instead of re-rolling logic to keep metrics consistent.

## References
- Architecture: [docs/PLATFORM_ARCHITECTURE.md](../docs/PLATFORM_ARCHITECTURE.md)
- Hybrid AI details: [docs/HYBRID_AI_GUIDE.md](../docs/HYBRID_AI_GUIDE.md)
- Notifications: [docs/NOTIFICATION_SYSTEM.md](../docs/NOTIFICATION_SYSTEM.md)
