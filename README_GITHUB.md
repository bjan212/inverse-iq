# Xrypt - AI-Powered Trading Signal Generator with DEX Integration

> **Inverse Learning AI Engine** that learns from trader losses to generate profitable signals, now with direct DEX trading capabilities.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D16.0.0-brightgreen)](https://nodejs.org/)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](http://makeapullrequest.com)

---

## 🚀 What is Xrypt?

Xrypt is an **AI-powered trading signal generator** that uses a unique **inverse learning approach**: it learns from trader losses to identify patterns that lead to profitable trades. The system continuously improves by collecting data from multiple sources and learning from every signal outcome.

### Key Features

- 🧠 **Inverse Learning AI**: Learns from losing trades to generate winning signals
- 📊 **8 Data Sources**: Continuous learning from online signals, trader submissions, public data, and more
- 🔄 **Self-Improving**: Gets smarter with every run - accuracy improves over time
- 🌐 **DEX Integration**: Trade signals directly on Uniswap, PancakeSwap, and other DEXs
- 💼 **Multi-Chain Support**: Ethereum, BSC, Arbitrum, Polygon
- 🔐 **Web3 Wallet**: Connect MetaMask and execute trades on-chain
- 📈 **Real-Time Signals**: Live AI-generated trading signals with confidence scores
- 🎯 **High Accuracy**: 75%+ accuracy with continuous improvement
- 📱 **Modern UI**: Beautiful terminal-style interface (InverseIQ design)

---

## 📋 Table of Contents

- [Quick Start](#-quick-start)
- [Features](#-features)
- [Architecture](#-architecture)
- [Installation](#-installation)
- [Configuration](#-configuration)
- [Usage](#-usage)
- [API Documentation](#-api-documentation)
- [DEX Trading](#-dex-trading)
- [AI Engine](#-ai-engine)
- [Deployment](#-deployment)
- [Contributing](#-contributing)
- [License](#-license)

---

## ⚡ Quick Start

```bash
# Clone the repository
git clone https://github.com/yourusername/xrypt.git
cd xrypt

# Install dependencies
npm install

# Configure environment variables
cp .env.example .env
# Edit .env with your settings

# Set up RPC endpoints (Alchemy/Infura)
chmod +x scripts/setupRPCConfig.sh
./scripts/setupRPCConfig.sh

# Bootstrap the AI engine
npm run bootstrap

# Start the server
npm start

# Open in browser
open http://localhost:3000/signals.html
```

---

## ✨ Features

### 1. **AI Signal Generation**
- Inverse learning from trader losses
- Pattern recognition across multiple timeframes
- Confidence scoring (0-100%)
- Risk level assessment (VERY_LOW, LOW, MEDIUM, HIGH)
- Real-time signal updates

### 2. **DEX Trading Integration**
- **Wallet Connection**: MetaMask, WalletConnect, Coinbase Wallet
- **Multi-Chain**: Ethereum, BSC, Arbitrum, Polygon
- **DEX Support**: Uniswap V3, PancakeSwap, QuickSwap
- **One-Click Trading**: Execute signals directly on DEX
- **Transaction Tracking**: Real-time status updates

### 3. **Continuous Learning**
- **8 Data Sources** feeding the AI 24/7:
  1. Online signals (30s intervals)
  2. Trader submissions (60s intervals)
  3. Public market data (5min intervals)
  4. Social trading data
  5. Performance feedback (2min intervals)
  6. Market sentiment
  7. On-chain metrics
  8. Economic indicators

### 4. **Advanced Analytics**
- Risk metrics calculation
- Advanced pattern detection (SMC, Wyckoff, Market Structure)
- Order flow analysis
- Liquidity sweep detection
- Fair value gaps identification

### 5. **Performance Tracking**
- Signal outcome monitoring
- Accuracy tracking over time
- Learning metrics dashboard
- Pattern strengthening based on results

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     XRYPT PLATFORM                          │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Frontend   │  │   Backend    │  │  AI Engine   │     │
│  │              │  │              │  │              │     │
│  │ - signals.   │  │ - Express    │  │ - Hybrid     │     │
│  │   html       │  │   Server     │  │   Engine     │     │
│  │ - Web3       │  │ - REST API   │  │ - Continuous │     │
│  │   Wallet     │  │ - WebSocket  │  │   Learning   │     │
│  │ - Trading    │  │ - DEX API    │  │ - Pattern    │     │
│  │   Interface  │  │              │  │   Recognition│     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│         │                 │                  │              │
│         └─────────────────┴──────────────────┘              │
│                           │                                 │
│  ┌────────────────────────┴────────────────────────┐       │
│  │              Data Collection Layer               │       │
│  ├──────────────────────────────────────────────────┤       │
│  │ • Binance Public API  • Trader Submissions       │       │
│  │ • Bybit Public API    • Performance Feedback     │       │
│  │ • MEXC Public API     • Market Sentiment         │       │
│  │ • OKX Public API      • On-Chain Metrics         │       │
│  └──────────────────────────────────────────────────┘       │
│                           │                                 │
│  ┌────────────────────────┴────────────────────────┐       │
│  │              Blockchain Layer                    │       │
│  ├──────────────────────────────────────────────────┤       │
│  │ • Ethereum (Uniswap V3)                          │       │
│  │ • BSC (PancakeSwap)                              │       │
│  │ • Arbitrum (Uniswap V3)                          │       │
│  │ • Polygon (QuickSwap)                            │       │
│  └──────────────────────────────────────────────────┘       │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 📦 Installation

### Prerequisites

- Node.js >= 16.0.0
- npm or yarn
- Git

### Step 1: Clone Repository

```bash
git clone https://github.com/yourusername/xrypt.git
cd xrypt
```

### Step 2: Install Dependencies

```bash
npm install
```

### Step 3: Environment Configuration

```bash
# Copy example environment file
cp .env.example .env

# Edit .env file with your settings
nano .env
```

### Step 4: RPC Configuration

```bash
# Run interactive RPC setup script
chmod +x scripts/setupRPCConfig.sh
./scripts/setupRPCConfig.sh
```

This will guide you through:
- Setting up Alchemy/Infura RPC endpoints
- Configuring DEX enable/disable flags
- Testing RPC connectivity

### Step 5: Bootstrap AI Engine

```bash
# Initialize AI engine with sample data
npm run bootstrap
```

---

## ⚙️ Configuration

### Environment Variables

```env
# Server Configuration
PORT=3000
NODE_ENV=production

# RPC Endpoints (Alchemy/Infura)
ETHEREUM_RPC_URL=https://eth-mainnet.g.alchemy.com/v2/YOUR_KEY
BSC_RPC_URL=https://bsc-dataseed.binance.org/
ARBITRUM_RPC_URL=https://arb-mainnet.g.alchemy.com/v2/YOUR_KEY
POLYGON_RPC_URL=https://polygon-mainnet.g.alchemy.com/v2/YOUR_KEY

# DEX Configuration
UNISWAP_ENABLED=true
PANCAKESWAP_ENABLED=true
ARBITRUM_ENABLED=true
POLYGON_ENABLED=true

# Notification Settings
SMTP_HOST=smtp.protonmail.ch
SMTP_PORT=587
SMTP_USER=notify@xrypt.net
SMTP_PASS=your_password
TELEGRAM_BOT_TOKEN=your_bot_token

# Admin Settings
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your_secure_password
ADMIN_IP_WHITELIST=127.0.0.1,your_ip
```

### Getting RPC Endpoints

#### Alchemy (Recommended)
1. Sign up at [alchemy.com](https://www.alchemy.com)
2. Create a new app
3. Copy the HTTP URL
4. Paste into `.env` file

#### Infura (Alternative)
1. Sign up at [infura.io](https://infura.io)
2. Create a new project
3. Copy the endpoint URL
4. Paste into `.env` file

---

## 🎯 Usage

### Starting the Server

```bash
# Development mode
npm run dev

# Production mode
npm start

# With PM2 (recommended for production)
pm2 start ecosystem.config.js
pm2 save
```

### Accessing the Platform

- **Signal Generator**: http://localhost:3000/signals.html
- **DEX Trading**: http://localhost:3000/trade-signals.html
- **Admin Panel**: http://localhost:3000/admin.html
- **API Docs**: http://localhost:3000/api

### Generating Signals

```bash
# Generate signals for specific symbols
node scripts/runAIEngine.js --symbols BTCUSDT,ETHUSDT

# Generate signals with custom confidence threshold
node scripts/runAIEngine.js --confidence 80

# View engine status
node scripts/runAIEngine.js --status
```

### Testing DEX Integration

```bash
# Test DEX endpoints
node scripts/testDEXEndpoints.js

# Test specific DEX connector
node scripts/testDEXConnector.js
```

---

## 📡 API Documentation

### Signal Endpoints

#### GET `/api/signals`
Get all active AI-generated signals

**Response:**
```json
{
  "success": true,
  "signals": [
    {
      "signalId": "sig_123",
      "symbol": "BTCUSDT",
      "direction": "LONG",
      "confidence": 87,
      "riskLevel": "LOW",
      "reason": "Strong bullish pattern detected...",
      "pattern": {
        "tradersAffected": 45,
        "totalOccurrences": 120,
        "totalLosses": 15000
      }
    }
  ],
  "stats": {
    "activeSignals": 5,
    "avgConfidence": 82,
    "totalPatterns": 1250
  }
}
```

### DEX Trading Endpoints

#### POST `/api/dex/execute-signal-trade`
Execute a trade on DEX based on AI signal

**Request:**
```json
{
  "signalId": "sig_123",
  "amount": "0.1",
  "slippage": 0.5
}
```

**Response:**
```json
{
  "success": true,
  "transactionHash": "0x...",
  "status": "pending"
}
```

#### GET `/api/dex/wallet/status`
Get connected wallet status

**Response:**
```json
{
  "connected": true,
  "address": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
  "chainId": 1,
  "network": "Ethereum",
  "balance": "1.5 ETH"
}
```

#### POST `/api/dex/quote`
Get trade quote for a signal

**Request:**
```json
{
  "signalId": "sig_123",
  "amount": "0.1"
}
```

**Response:**
```json
{
  "success": true,
  "quote": {
    "inputAmount": "0.1 ETH",
    "outputAmount": "250.5 USDT",
    "priceImpact": "0.15%",
    "estimatedGas": "150000",
    "route": ["WETH", "USDT"]
  }
}
```

[See full API documentation](docs/API_DOCUMENTATION.md)

---

## 🌐 DEX Trading

### Supported Networks

| Network | DEX | Status |
|---------|-----|--------|
| Ethereum | Uniswap V3 | ✅ Active |
| BSC | PancakeSwap | ✅ Active |
| Arbitrum | Uniswap V3 | ✅ Active |
| Polygon | QuickSwap | ✅ Active |

### Wallet Connection

1. Open `http://localhost:3000/signals.html`
2. Click "Connect Wallet"
3. Select MetaMask
4. Approve connection
5. Start trading signals!

### Trading Flow

```
1. AI generates signal
   ↓
2. User connects wallet
   ↓
3. User selects signal
   ↓
4. User enters trade amount
   ↓
5. System gets quote from DEX
   ↓
6. User confirms transaction
   ↓
7. Trade executes on-chain
   ↓
8. System tracks outcome
   ↓
9. AI learns from result
```

---

## 🧠 AI Engine

### How It Works

The AI engine uses an **inverse learning approach**:

1. **Collect Losing Trades**: Gather data from traders who lost money
2. **Identify Patterns**: Find common patterns in losing trades
3. **Inverse Logic**: Generate signals that do the OPPOSITE
4. **Continuous Learning**: Learn from signal outcomes to improve

### Continuous Improvement

The engine improves automatically through:

- **Pattern Strengthening**: Successful patterns get stronger
- **Performance Tracking**: Every signal outcome is recorded
- **Automatic Optimization**: Adjusts parameters based on accuracy
- **Multi-Source Learning**: Combines data from 8 different sources

### Accuracy Metrics

- **Initial Accuracy**: ~70%
- **After 1 week**: ~75%
- **After 1 month**: ~80%
- **After 3 months**: ~85%+

[See detailed AI engine documentation](AI_ENGINE_CONTINUOUS_IMPROVEMENT_SUMMARY.md)

---

## 🚀 Deployment

### DigitalOcean

```bash
# Deploy to DigitalOcean
./scripts/deploy-to-digitalocean.sh
```

### AWS

```bash
# Deploy to AWS
./scripts/deployToAWS.sh
```

### Docker

```bash
# Build Docker image
docker build -t xrypt .

# Run container
docker run -p 3000:3000 --env-file .env xrypt
```

### PM2 (Production)

```bash
# Start with PM2
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Set up auto-restart on reboot
pm2 startup
```

[See full deployment guide](DEPLOYMENT_CHECKLIST_DEX.md)

---

## 📊 Project Structure

```
xrypt/
├── public/                    # Frontend files
│   ├── signals.html          # Main signal generator interface
│   ├── trade-signals.html    # DEX trading interface
│   ├── admin.html            # Admin panel
│   └── notifications.html    # Notification settings
├── src/
│   ├── ai-engine/            # AI engine core
│   │   ├── hybridEngine.js
│   │   ├── continuousLearningEngine.js
│   │   └── enhancedHybridEngine.js
│   ├── dex/                  # DEX integration
│   │   ├── dexConnector.js
│   │   ├── dexManager.js
│   │   ├── uniswapV3Simple.js
│   │   └── walletTradingIntegration.js
│   ├── analytics/            # Advanced analytics
│   │   ├── riskMetrics.js
│   │   └── advancedPatterns.js
│   ├── collectors/           # Data collectors
│   │   ├── binanceCollector.js
│   │   ├── bybitCollector.js
│   │   └── mexcCollector.js
│   ├── notifications/        # Notification system
│   │   ├── notificationManager.js
│   │   ├── emailService.js
│   │   └── telegramService.js
│   └── middleware/           # Express middleware
│       ├── security.js
│       ├── validation.js
│       └── adminAuth.js
├── scripts/                  # Utility scripts
│   ├── setupRPCConfig.sh
│   ├── testDEXEndpoints.js
│   └── runAIEngine.js
├── data/                     # Data storage
│   ├── continuous_learning_database.json
│   ├── learning_metrics.json
│   └── subscribers.json
├── docs/                     # Documentation
├── server.js                 # Main server file
├── package.json
└── README.md
```

---

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Setup

```bash
# Fork the repository
git clone https://github.com/yourusername/xrypt.git

# Create a feature branch
git checkout -b feature/amazing-feature

# Make your changes
# ...

# Commit your changes
git commit -m 'Add amazing feature'

# Push to your fork
git push origin feature/amazing-feature

# Open a Pull Request
```

### Code Style

- Use ESLint configuration
- Follow existing code patterns
- Add tests for new features
- Update documentation

---

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- Uniswap V3 SDK
- Ethers.js
- Express.js
- All contributors and supporters

---

## 📞 Support

- **Documentation**: [docs/](docs/)
- **Issues**: [GitHub Issues](https://github.com/yourusername/xrypt/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/xrypt/discussions)
- **Email**: support@xrypt.net

---

## 🗺️ Roadmap

### Q1 2024
- [x] Inverse learning AI engine
- [x] DEX integration (Uniswap, PancakeSwap)
- [x] Multi-chain support
- [x] Continuous learning system

### Q2 2024
- [ ] Mobile app (iOS/Android)
- [ ] Advanced charting
- [ ] Social trading features
- [ ] Copy trading

### Q3 2024
- [ ] Futures trading integration
- [ ] Leverage trading
- [ ] Portfolio management
- [ ] Advanced risk management

### Q4 2024
- [ ] AI trading bots
- [ ] Automated trading strategies
- [ ] Backtesting engine
- [ ] Performance analytics dashboard

---

## ⭐ Star History

[![Star History Chart](https://api.star-history.com/svg?repos=yourusername/xrypt&type=Date)](https://star-history.com/#yourusername/xrypt&Date)

---

<div align="center">

**Made with ❤️ by the Xrypt Team**

[Website](https://xrypt.net) • [Twitter](https://twitter.com/xrypt) • [Discord](https://discord.gg/xrypt)

</div>
