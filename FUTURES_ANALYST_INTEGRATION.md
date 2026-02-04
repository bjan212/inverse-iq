# Futures Analyst Integration Guide

## Overview

This document explains how the Futures Analyst system has been integrated into the inverse-iq project.

## Directory Structure

```
inverse-iq/
├── futures-frontend/        # React frontend (from ai-prompt-builder/client)
├── futures-backend/         # tRPC backend (from ai-prompt-builder/server)
├── futures-config/          # Configuration files (package.json, vite.config.ts, etc.)
├── drizzle/                 # Database schema and migrations
├── shared/                  # Shared types and constants
├── server.js                # Original Express server (existing)
├── src/                     # Original Node.js backend (existing)
└── public/                  # Original HTML frontend (existing)
```

## Features Integrated

### ✅ Complete Futures Analyst System
- AI-powered trading signal generation
- Real-time market data from Binance API
- Technical analysis (RSI, MACD, Volume)
- 4-agent analysis system (Quant, Risk, Psychology, Contrarian)

### ✅ AI Ensemble System
- Queries multiple AI models simultaneously
- Compares and synthesizes outputs
- Meta-AI combines best elements from each response

### ✅ Inverse Learning System
- Analyzes trade history to learn from losses
- Inverts losing entry conditions into high-confidence signals
- Continuous learning from every closed trade
- Auto-updates patterns without manual intervention

### ✅ Binance Futures API Integration
- Real trade execution with HMAC-SHA256 authentication
- Position tracking and management
- Stop-loss and take-profit orders
- Up to 125x leverage support

### ✅ WebSocket Live Updates
- Real-time position tracking
- Order fill notifications
- Live P&L updates

### ✅ Trade History & Analytics
- Complete trade history with filters
- Win rate and P&L statistics
- CSV export functionality

## Setup Instructions

### 1. Install Dependencies

```bash
cd /home/ubuntu/inverse-iq/futures-config
npm install
```

### 2. Set Up Database

The Futures Analyst uses MySQL/TiDB for data storage. Update the `DATABASE_URL` in your environment:

```bash
# In inverse-iq/.env
DATABASE_URL="mysql://user:password@host:port/database"
```

Then push the schema:

```bash
cd /home/ubuntu/inverse-iq
npx drizzle-kit generate
npx drizzle-kit migrate
```

### 3. Start the Futures Analyst Server

```bash
cd /home/ubuntu/inverse-iq/futures-config
npm run dev
```

This will start:
- React frontend on port 3000
- tRPC backend API on `/api/trpc`

### 4. Access the Futures Analyst

Open your browser to: `http://localhost:3000/futures`

## Integration with Existing System

The Futures Analyst runs alongside your existing inverse-iq system:

- **Existing system**: Runs on `server.js` (port 3000 by default)
- **Futures Analyst**: Runs on Vite dev server (port 3001 or configurable)

You can:
1. Run both systems separately
2. Proxy Futures Analyst through your existing Express server
3. Merge the backends into a single unified API

## API Endpoints

### Trading Signals
- `POST /api/trpc/trading.generateSignal` - Generate AI trading signal

### Binance API
- `POST /api/trpc/binance.saveApiKeys` - Save Binance API credentials
- `POST /api/trpc/binance.executeTrade` - Execute trade on Binance
- `GET /api/trpc/binance.getPositions` - Get active positions
- `POST /api/trpc/binance.closePosition` - Close a position

### Inverse Learning
- `GET /api/trpc/inversePatterns.getAll` - Get all learned patterns
- `POST /api/trpc/binance.recordTradeClose` - Record trade close for learning

### Trade History
- `GET /api/trpc/tradeHistory.getHistory` - Get trade history with filters
- `GET /api/trpc/tradeHistory.getStatistics` - Get trading statistics

## Next Steps

1. **Merge with existing inverse learning**: Your `src/ai-engine/inverseSignalEngine.js` can be enhanced with the new inverse learning system
2. **Unified authentication**: Connect the Futures Analyst auth with your existing user system
3. **Shared database**: Use the same database for both systems
4. **UI integration**: Add a link to Futures Analyst from your existing `public/signals.html`

## Removed Features

✅ **Quiz removed**: The signal generation flow no longer includes any quiz or questionnaire before generating signals. Users can immediately click "Find Me the Most Favorable Coin to Trade" without answering questions.

## Support

For issues or questions, refer to the original ai-prompt-builder documentation or contact the development team.
