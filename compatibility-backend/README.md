# InverseIQ Continuous-Learning Compatibility Backend

This small Node.js service is the deployable replacement for the unavailable legacy backend. It deliberately exposes only the integration surface used by Xrypt: `GET /api/health`, `GET /api/ai/stats`, `GET /api/ai/continuous-learning`, and authenticated `POST /api/feedback/signal-outcome`.

Verified outcomes are persisted as local JSON state and are idempotent by `signalId`. A matching retry is acknowledged without double-counting. A conflicting outcome for the same signal is rejected and must be investigated rather than silently overwriting recorded learning data.

The service receives no exchange credentials, offers no trading routes, and makes no profitability claims. Configure `CONTINUOUS_LEARNING_API_KEY` with a long, random value before starting it. Keep `BIND_HOST=127.0.0.1` and place it behind a TLS reverse proxy for external access.

Run the contract tests with:

```bash
node --test compatibility-backend/server.test.js
```
