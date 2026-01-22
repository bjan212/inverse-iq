# RPC Endpoint Configuration for DEX Trading

## Required Environment Variables for DEX Integration

Copy and paste these settings into your `.env` file:

```env
# ============================================
# XRYPT DEX TRADING - RPC ENDPOINTS
# ============================================

# Ethereum Mainnet (Uniswap)
ETHEREUM_RPC_URL=https://eth-mainnet.g.alchemy.com/v2/94ODAx1-qmcUcFERZJwVO
# Alternative: https://mainnet.infura.io/v3/YOUR_INFURA_PROJECT_ID
UNISWAP_ENABLED=true

# Binance Smart Chain (PancakeSwap)
BSC_RPC_URL=https://bsc-dataseed.binance.org/
# Alternative: https://bsc-dataseed1.binance.org/
PANCAKESWAP_ENABLED=true

# Arbitrum One
ARBITRUM_RPC_URL=https://arb1.arbitrum.io/rpc
# Alternative: https://arb-mainnet.g.alchemy.com/v2/94ODAx1-qmcUcFERZJwVO
ARBITRUM_ENABLED=true

# Polygon
POLYGON_RPC_URL=https://polygon-rpc.com
# Alternative: https://polygon-mainnet.g.alchemy.com/v2/94ODAx1-qmcUcFERZJwVO
POLYGON_ENABLED=true

# ============================================
# FREE RPC ENDPOINTS FOR TESTING
# ============================================

# Public RPC endpoints (free, but rate-limited)
# ETHEREUM_RPC_URL=https://eth.public-rpc.com
# BSC_RPC_URL=https://bsc.publicnode.com
# ARBITRUM_RPC_URL=https://arbitrum.public-rpc.com
# POLYGON_RPC_URL=https://polygon-rpc.com

# ============================================
# DEX TRADING SETTINGS
# ============================================

# Default slippage tolerance (0.5% = 0.005)
DEX_SLIPPAGE_TOLERANCE=0.005

# Transaction deadline in seconds (20 minutes default)
DEX_TRANSACTION_DEADLINE=1200

# Default fee tier for Uniswap V3 (3000 = 0.3%)
UNISWAP_DEFAULT_FEE=3000

# ============================================
# WALLET SECURITY (Optional - for automated trading)
# ============================================

# Private key for automated trading (ONLY FOR TESTNET/DEV)
# DEX_PRIVATE_KEY=your_private_key_here

# Testnet RPC for development
# ETHEREUM_TESTNET_RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_PROJECT_ID
# BSC_TESTNET_RPC_URL=https://data-seed-prebsc-1-s1.binance.org:8545/

# ============================================
# EXISTING NOTIFICATION SETTINGS (Keep these)
# ============================================

# Email Settings (ProtonMail)
SMTP_HOST=smtp.protonmail.ch
SMTP_PORT=587
SMTP_USER=notify@xrypt.net§
SMTP_PASS=ZX9WB496RMQ4JEQJ
SMTP_FROM=XryptNotifications <notify@xrypt.net>

# Telegram Settings
TELEGRAM_BOT_TOKEN=8187241165:AAGybvkmybrqYHIVhAz2YYLzPQqIvdp3beA
```

## How to Get Free RPC Endpoints

### 1. **Alchemy (Recommended)**
- Sign up at [alchemy.com](https://www.alchemy.com)
- Create a new app for each network (Ethereum, Arbitrum, Polygon)
- Copy the HTTPS URL from your dashboard
- Free tier: 300M compute units per month

### 2. **Infura**
- Sign up at [infura.io](https://infura.io)
- Create a new project
- Get your project ID
- Format: `https://mainnet.infura.io/v3/YOUR_PROJECT_ID`
- Free tier: 100,000 requests per day

### 3. **Public RPC (Free, Rate-Limited)**
- Use public endpoints for testing
- Not recommended for production
- May have rate limits and downtime

## Quick Setup Commands

```bash
# 1. Copy template to .env
cp ENV_TEMPLATE_RPC_SETUP.md .env

# 2. Edit with your RPC URLs
nano .env

# 3. Restart server
npm start

# 4. Test DEX connection
node scripts/testDEXConnector.js
```

## Verification

After setting up, test with:
```bash
# Test Ethereum connection
curl -X GET "http://localhost:3000/api/dex/network-info?chainId=1"

# Test BSC connection  
curl -X GET "http://localhost:3000/api/dex/network-info?chainId=56"

# Test all DEX connectors
node scripts/testDEXConnector.js
```

## Troubleshooting

### Common Issues:

1. **"RPC URL is required" error**
   - Check if RPC URL is set in .env
   - Verify URL format (should start with https://)
   - Test URL with: `curl YOUR_RPC_URL` (should return JSON)

2. **Rate limiting errors**
   - Switch from public RPC to Alchemy/Infura
   - Add multiple RPC URLs and implement fallback

3. **Network connection errors**
   - Check internet connection
   - Verify RPC endpoint is accessible
   - Try alternative RPC endpoint

## Production Recommendations

1. **Use paid RPC services** for reliability
2. **Implement RPC fallback** in code
3. **Monitor RPC usage** and set alerts
4. **Use environment-specific configurations**
   - Development: Public RPC
   - Staging: Free tier Alchemy/Infura
   - Production: Paid tier with high limits
