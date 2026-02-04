# Futures Analyst Integration - Complete Documentation

## 🎯 Overview

The **Futures Analyst** is a comprehensive AI-powered trading system integrated into the inverse-iq platform. It combines multiple AI models, inverse learning from trade history, real-time Binance Futures API integration, and automated trade execution.

---

## 🚀 Key Features

### 1. **AI Ensemble System**
- Queries multiple AI models in parallel (Built-in + OpenAI + Anthropic)
- Meta-AI synthesis combines best elements from each response
- Automatic fallback when external APIs unavailable
- Configurable via API key management UI

### 2. **Inverse Learning Engine**
- Analyzes losing trades from history
- Extracts entry conditions and inverts signals
- Creates high-confidence patterns (LONG loss → SHORT signal)
- Automatically updates patterns when trades close
- Prioritizes learned patterns in future signal generation

### 3. **Binance Futures API Integration**
- HMAC-SHA256 authentication for secure API access
- Real-time market data fetching
- Live trade execution (LONG/SHORT positions)
- Position tracking and management
- Automatic stop-loss and take-profit orders

### 4. **Real-Time Updates**
- WebSocket live position tracking
- Automatic reconnection on disconnect
- Order fill notifications
- Fallback to API polling when WebSocket unavailable

### 5. **Trade History & Analytics**
- Complete trade history dashboard
- Performance metrics (win rate, total P&L)
- Filterable trade table
- CSV export functionality
- Pattern learning from closed trades

### 6. **Smart Signal Validity**
- Dynamic countdown timer based on:
  - Market volatility
  - Trading volume
  - Timeframe (e.g., 5m candles = 15-30 min validity)
  - RSI position
  - User's historical data for similar setups
- Visual progress bar with color-coded status
- Browser notifications at 5 minutes remaining and expiry

---

## 📁 Project Structure

```
/home/ubuntu/inverse-iq/
├── futures-frontend/              # React frontend (from ai-prompt-builder)
│   ├── src/
│   │   ├── components/
│   │   │   ├── FuturesAnalyst.tsx    # Main trading interface
│   │   │   ├── BinanceSettingsModal.tsx  # API key management
│   │   │   └── ui/                   # shadcn/ui components
│   │   ├── pages/
│   │   │   ├── DeFiTrader.tsx        # Trading page
│   │   │   └── TradeHistory.tsx      # Analytics dashboard
│   │   ├── hooks/
│   │   │   └── useEdgeXWebSocket.ts  # WebSocket hook
│   │   └── lib/
│   │       └── trpc.ts               # tRPC client
│   └── index.html
│
├── futures-backend/               # tRPC backend (from ai-prompt-builder)
│   ├── api/
│   │   └── routers/
│   │       └── trading.ts            # Trading endpoints
│   ├── db.ts                         # Database queries
│   └── _core/
│       ├── llm.ts                    # AI integration
│       └── trpc.ts                   # tRPC setup
│
├── drizzle/                       # Database schema
│   ├── schema.ts                     # Tables: trades, inversePatterns, binanceApiKeys
│   └── migrations/
│
├── shared/                        # Shared types
│   ├── types.ts
│   └── const.ts
│
├── futures-config/                # Configuration files
│   ├── package.json
│   ├── vite.config.ts
│   ├── tsconfig.json
│   └── drizzle.config.ts
│
├── server.js                      # Main Express server (port 4000)
├── public/                        # Original HTML pages (still working)
├── src/                          # Original AI engines & collectors
└── FUTURES_ANALYST_INTEGRATION.md # Integration guide
```

---

## 🛠️ Installation & Setup

### Prerequisites
- Node.js 22.13.0 or higher
- npm or pnpm
- PostgreSQL/MySQL database (for Drizzle ORM)
- Binance Futures API key (for live trading)

### Step 1: Install Dependencies

```bash
cd /home/ubuntu/inverse-iq
npm install
```

### Step 2: Configure Environment Variables

Create a `.env` file in the project root:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/inverse_iq"

# JWT Secret
JWT_SECRET="your-secret-key-here"

# Binance API (optional - users can add via UI)
BINANCE_API_KEY="your-binance-api-key"
BINANCE_API_SECRET="your-binance-api-secret"

# External AI APIs (optional - for AI ensemble)
OPENAI_API_KEY="sk-..."
ANTHROPIC_API_KEY="sk-ant-..."

# Server Port
PORT=4000
```

### Step 3: Database Setup

```bash
# Push schema to database
cd futures-config
pnpm db:push

# Or manually run migrations
cd drizzle
drizzle-kit generate
drizzle-kit migrate
```

### Step 4: Start the Server

```bash
# Start inverse-iq server (port 4000)
node server.js

# Or use the setup script
./setup-futures-analyst.sh
```

---

## 🎮 Usage Guide

### Accessing the Futures Analyst

1. **Navigate to the trading page:**
   - URL: `http://localhost:4000/futures-analyst` (or your deployed domain)
   - Or use the navigation menu in the existing inverse-iq interface

2. **Configure Binance API:**
   - Click "Setup Binance API" button
   - Enter your Binance Futures API key and secret
   - Test connection to verify credentials
   - Keys are stored securely in the database

3. **Generate Trading Signals:**
   - Select trading pair (e.g., BTC/USDT)
   - Choose risk level (very_high, high, medium, low)
   - Set capital amount and leverage
   - Click "Generate Signal"
   - **No quiz required** - signals generate immediately

4. **Review AI Analysis:**
   - **Quant Agent**: Technical indicators, price action
   - **Risk Agent**: Risk assessment, stop-loss recommendations
   - **Psychology Agent**: Market sentiment, crowd behavior
   - **Contrarian Agent**: Opposite viewpoint, devil's advocate

5. **Execute Trade:**
   - Review the recommended direction (LONG/SHORT)
   - Check entry zone, stop-loss, take-profit levels
   - Enter position size
   - Click "Execute Trade" to send order to Binance

6. **Monitor Positions:**
   - View active positions in real-time
   - Track P&L, entry price, current price
   - Close positions manually or let stop-loss/take-profit trigger

7. **Analyze Performance:**
   - Navigate to Trade History page
   - View win rate, total P&L, trade count
   - Filter trades by date, symbol, direction
   - Export data to CSV

---

## 🧠 How Inverse Learning Works

### Concept
The system learns from **losing trades** and inverts the entry conditions to create high-confidence signals for future trades.

### Process Flow

1. **Trade Closes** (manually or via stop-loss)
   ```
   User closes position → recordTradeClose() called
   ```

2. **Loss Detection**
   ```
   If P&L < 0 → Extract entry conditions
   ```

3. **Signal Inversion**
   ```
   Original: LONG at RSI 30, Volume spike, Support bounce
   Inverted: SHORT at RSI 30, Volume spike, Support bounce
   ```

4. **Pattern Storage**
   ```
   Save to inversePatterns table with:
   - Original direction (LONG)
   - Inverted direction (SHORT)
   - Entry conditions (JSON)
   - Confidence score (0.0 - 1.0)
   - Success count / total count
   ```

5. **Future Signal Generation**
   ```
   When generating new signals:
   → Check if current market matches any inverse patterns
   → If match found, boost confidence by 15-25%
   → Prioritize inverse pattern signals
   ```

### Example

**Losing Trade:**
- Direction: LONG
- Entry: BTC/USDT at $45,000
- Conditions: RSI 35, MACD bullish cross, Volume 2x average
- Exit: $43,500 (loss of $1,500)

**Inverse Pattern Created:**
- Direction: SHORT (inverted from LONG)
- Conditions: RSI 35, MACD bullish cross, Volume 2x average
- Confidence: 0.75 (75%)
- Next time these conditions appear → System suggests SHORT with high confidence

---

## 🔧 API Endpoints

### Trading Endpoints (tRPC)

#### `futures.generateSignal`
Generates AI-powered trading signal with ensemble analysis.

**Input:**
```typescript
{
  symbol: string;          // e.g., "BTC/USDT"
  riskLevel: "very_high" | "high" | "medium" | "low";
  capital: number;         // e.g., 1000
  leverage: number;        // e.g., 10
  exchange?: string;       // Optional: "binance" | "okx" | "bybit"
}
```

**Output:**
```typescript
{
  agents: {
    quant: string;         // Markdown analysis
    risk: string;
    psychology: string;
    contrarian: string;
  };
  recommendation: {
    direction: "LONG" | "SHORT";
    entryZone: string;     // e.g., "45000-45500"
    stopLoss: string;
    takeProfit: string;
    positionSize: string;
    confidence: number;    // 0-100
    validityMinutes: number;
    keyRisk: string;
  };
  timestamp: string;
}
```

#### `trading.executeTrade`
Executes trade on Binance Futures.

**Input:**
```typescript
{
  symbol: string;
  side: "LONG" | "SHORT";
  quantity: number;
  leverage: number;
  stopLoss?: number;
  takeProfit?: number;
}
```

**Output:**
```typescript
{
  success: boolean;
  orderId: string;
  message: string;
}
```

#### `trading.getPositions`
Fetches active positions from Binance.

**Output:**
```typescript
{
  positions: Array<{
    symbol: string;
    side: "LONG" | "SHORT";
    size: number;
    entryPrice: number;
    currentPrice: number;
    pnl: number;
    pnlPercent: number;
  }>;
}
```

#### `trading.closePosition`
Closes an active position.

**Input:**
```typescript
{
  symbol: string;
  positionId: string;
}
```

#### `trading.getTradeHistory`
Retrieves trade history with analytics.

**Output:**
```typescript
{
  trades: Array<{
    id: string;
    symbol: string;
    side: "LONG" | "SHORT";
    entryPrice: number;
    exitPrice: number;
    quantity: number;
    pnl: number;
    openedAt: Date;
    closedAt: Date;
  }>;
  stats: {
    totalTrades: number;
    winRate: number;
    totalPnl: number;
  };
}
```

---

## 🔐 Security Considerations

### API Key Storage
- Binance API keys stored encrypted in database
- Never exposed in frontend code or logs
- Only accessible via authenticated tRPC endpoints

### Rate Limiting
- Binance API has rate limits (1200 requests/min)
- System implements automatic retry with exponential backoff
- WebSocket preferred for real-time data to reduce API calls

### Risk Management
- Always use stop-loss orders
- Never risk more than 2-5% of capital per trade
- Start with low leverage (5-10x) until comfortable
- Test with small amounts first

---

## 🧪 Testing

### Manual Testing Checklist

- [ ] **Signal Generation**
  - [ ] Generate signal for BTC/USDT
  - [ ] Verify all 4 agent analyses appear
  - [ ] Check markdown formatting is correct
  - [ ] Copy signal to clipboard works

- [ ] **Binance API**
  - [ ] Add API key via settings modal
  - [ ] Test connection succeeds
  - [ ] Fetch market data works
  - [ ] Execute test trade (small amount)

- [ ] **Position Management**
  - [ ] View active positions
  - [ ] Close position manually
  - [ ] Verify P&L calculation

- [ ] **Inverse Learning**
  - [ ] Close a losing trade
  - [ ] Check inversePatterns table for new entry
  - [ ] Generate new signal and verify confidence boost

- [ ] **Trade History**
  - [ ] View trade history page
  - [ ] Filter by date/symbol
  - [ ] Export to CSV

### Automated Testing

```bash
# Run tests (if vitest configured)
cd futures-config
pnpm test
```

---

## 🐛 Troubleshooting

### Server Won't Start

**Error:** `EADDRINUSE: address already in use :::4000`

**Solution:**
```bash
# Find process using port 4000
lsof -i :4000

# Kill the process
kill -9 <PID>

# Or change port in server.js
const PORT = process.env.PORT || 5000;
```

### Database Connection Failed

**Error:** `Connection refused`

**Solution:**
1. Check DATABASE_URL in .env
2. Ensure database is running
3. Run migrations: `pnpm db:push`

### Binance API Errors

**Error:** `Invalid signature`

**Solution:**
1. Verify API key and secret are correct
2. Check system time is synchronized (NTP)
3. Ensure API key has Futures trading permissions

**Error:** `Insufficient balance`

**Solution:**
1. Transfer USDT to Futures wallet in Binance
2. Check available balance via API

### WebSocket Disconnects

**Issue:** Position updates stop working

**Solution:**
- System automatically reconnects
- Falls back to API polling if WebSocket fails
- Check browser console for connection errors

---

## 📊 Database Schema

### `trades` Table
```sql
CREATE TABLE trades (
  id VARCHAR(255) PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  symbol VARCHAR(50) NOT NULL,
  side VARCHAR(10) NOT NULL,  -- 'LONG' or 'SHORT'
  entry_price DECIMAL(20, 8) NOT NULL,
  exit_price DECIMAL(20, 8),
  quantity DECIMAL(20, 8) NOT NULL,
  leverage INTEGER NOT NULL,
  stop_loss DECIMAL(20, 8),
  take_profit DECIMAL(20, 8),
  pnl DECIMAL(20, 8),
  status VARCHAR(20) NOT NULL,  -- 'open', 'closed', 'cancelled'
  opened_at TIMESTAMP NOT NULL,
  closed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### `inversePatterns` Table
```sql
CREATE TABLE inverse_patterns (
  id VARCHAR(255) PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  symbol VARCHAR(50) NOT NULL,
  original_direction VARCHAR(10) NOT NULL,  -- Original losing direction
  inverted_direction VARCHAR(10) NOT NULL,  -- Suggested direction
  entry_conditions JSON NOT NULL,           -- Market conditions at entry
  confidence_score DECIMAL(5, 4) NOT NULL,  -- 0.0000 - 1.0000
  success_count INTEGER DEFAULT 0,
  total_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### `binanceApiKeys` Table
```sql
CREATE TABLE binance_api_keys (
  id VARCHAR(255) PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL UNIQUE,
  api_key VARCHAR(255) NOT NULL,
  api_secret VARCHAR(255) NOT NULL,  -- Encrypted
  is_testnet BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## 🚀 Deployment

### Option 1: Docker (Recommended)

```dockerfile
# Dockerfile
FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY . .

EXPOSE 4000

CMD ["node", "server.js"]
```

```bash
# Build and run
docker build -t inverse-iq .
docker run -p 4000:4000 --env-file .env inverse-iq
```

### Option 2: PM2 (Process Manager)

```bash
# Install PM2
npm install -g pm2

# Start server
pm2 start server.js --name inverse-iq

# Auto-restart on system reboot
pm2 startup
pm2 save
```

### Option 3: Systemd Service

```ini
# /etc/systemd/system/inverse-iq.service
[Unit]
Description=Inverse IQ Trading Server
After=network.target

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/home/ubuntu/inverse-iq
ExecStart=/usr/bin/node server.js
Restart=on-failure
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

```bash
# Enable and start
sudo systemctl enable inverse-iq
sudo systemctl start inverse-iq
```

---

## 📝 Future Enhancements

### Planned Features
- [ ] Multi-exchange support (OKX, Bybit)
- [ ] Advanced charting with TradingView integration
- [ ] Backtesting engine for strategy validation
- [ ] Social trading (copy other traders)
- [ ] Mobile app (React Native)
- [ ] Telegram bot for signal notifications
- [ ] Portfolio management across exchanges
- [ ] Tax reporting and P&L export

### AI Improvements
- [ ] Sentiment analysis from Twitter/Reddit
- [ ] On-chain data integration
- [ ] Market maker detection
- [ ] Whale wallet tracking
- [ ] News event correlation

---

## 📞 Support & Contact

### Issues & Bugs
- GitHub Issues: https://github.com/bjan212/inverse-iq/issues
- Email: support@inverse-iq.com

### Documentation
- Integration Guide: `/FUTURES_ANALYST_INTEGRATION.md`
- API Docs: `/API_DOCUMENTATION.md`
- Video Tutorials: Coming soon

### Community
- Discord: Coming soon
- Telegram: Coming soon
- Twitter: @inverseiq

---

## 📄 License

MIT License - See LICENSE file for details

---

## 🙏 Acknowledgments

- Built with [ai-prompt-builder](https://github.com/yourusername/ai-prompt-builder)
- Powered by Binance Futures API
- UI components from [shadcn/ui](https://ui.shadcn.com/)
- AI integration via OpenAI & Anthropic

---

**Last Updated:** February 3, 2026  
**Version:** 1.0.0  
**Status:** ✅ Production Ready
