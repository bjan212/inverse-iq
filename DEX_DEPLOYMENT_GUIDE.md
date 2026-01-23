# 🚀 DEX Trading Deployment Guide

## Quick Start - Deploy to DigitalOcean

### Step 1: Make the deployment script executable

```bash
chmod +x scripts/deployDEXToDroplet.sh
```

### Step 2: Run the deployment script

```bash
# Using default server IP (146.190.233.46)
./scripts/deployDEXToDroplet.sh

# Or specify a different server IP
./scripts/deployDEXToDroplet.sh YOUR_SERVER_IP
```

### Step 3: Wait for deployment to complete

The script will automatically:
- ✅ Create a deployment package
- ✅ Upload to your droplet
- ✅ Extract files
- ✅ Install dependencies
- ✅ Configure environment variables
- ✅ Restart the application with PM2
- ✅ Verify deployment

---

## What the Deployment Script Does

### 1. Pre-Deployment Checks
- Verifies project structure
- Checks SSH connection
- Validates required files

### 2. Package Creation
- Creates compressed archive
- Excludes unnecessary files (node_modules, logs, etc.)
- Optimizes for fast upload

### 3. Server Deployment
- Backs up current installation
- Extracts new files
- Merges environment variables
- Installs/updates dependencies
- Restarts application with PM2

### 4. Post-Deployment Verification
- Tests health endpoint
- Tests DEX endpoints
- Shows application status

---

## After Deployment

### 1. Get Free RPC API Keys (Recommended)

**Alchemy (Recommended):**
1. Go to https://www.alchemy.com/
2. Sign up for free account
3. Create a new app for each network:
   - Ethereum Mainnet
   - Arbitrum
   - Polygon
4. Copy API keys

**Infura (Alternative):**
1. Go to https://infura.io/
2. Sign up for free account
3. Create project
4. Copy API keys

### 2. Update Environment Variables on Server

```bash
# SSH into your server
ssh inverseiq@146.190.233.46

# Navigate to project directory
cd ~/xrypt-service

# Edit .env file
nano .env
```

**Update these lines with your API keys:**
```env
# Replace with your Alchemy API keys
ETHEREUM_RPC_URL=https://eth-mainnet.g.alchemy.com/v2/YOUR_API_KEY_HERE
ARBITRUM_RPC_URL=https://arb-mainnet.g.alchemy.com/v2/YOUR_API_KEY_HERE
POLYGON_RPC_URL=https://polygon-mainnet.g.alchemy.com/v2/YOUR_API_KEY_HERE
```

**Save and exit:**
- Press `Ctrl + X`
- Press `Y`
- Press `Enter`

**Restart the application:**
```bash
pm2 restart xrypt
```

### 3. Test DEX Endpoints

```bash
# Test from your Mac
curl http://146.190.233.46:3000/api/dex/test
curl http://146.190.233.46:3000/api/dex/network-info
curl http://146.190.233.46:3000/api/dex/tokens

# Or test from the server
ssh inverseiq@146.190.233.46
curl http://localhost:3000/api/dex/test
```

---

## Available DEX Endpoints

After deployment, these endpoints will be available:

### 1. Network Information
```bash
GET /api/dex/network-info
```
Returns information about supported networks and their status.

### 2. Supported Tokens
```bash
GET /api/dex/tokens
```
Returns list of supported tokens for trading.

### 3. Get Price Quote
```bash
POST /api/dex/quote
Content-Type: application/json

{
  "tokenIn": "WETH",
  "tokenOut": "USDC",
  "amountIn": "1",
  "network": "ethereum"
}
```

### 4. Execute Signal Trade
```bash
POST /api/dex/execute-signal-trade
Content-Type: application/json

{
  "signalId": "signal_123",
  "walletAddress": "0x...",
  "network": "ethereum"
}
```

### 5. Wallet Status
```bash
GET /api/dex/wallet/status?address=0x...
```

### 6. Connect Wallet
```bash
POST /api/dex/wallet/connect
Content-Type: application/json

{
  "address": "0x...",
  "signature": "0x..."
}
```

### 7. Test DEX Connectivity
```bash
GET /api/dex/test
```
Tests RPC connectivity and returns status.

---

## Frontend Access

### Trade Signals Page
```
http://146.190.233.46:3000/trade-signals.html
```

Features:
- View AI-generated trading signals
- Connect MetaMask wallet
- Execute trades directly from signals
- Real-time price quotes
- Transaction status tracking

---

## Monitoring & Maintenance

### View Application Logs
```bash
# SSH into server
ssh inverseiq@146.190.233.46

# View real-time logs
pm2 logs xrypt

# View last 50 lines
pm2 logs xrypt --lines 50

# View only errors
pm2 logs xrypt --err
```

### Check Application Status
```bash
ssh inverseiq@146.190.233.46
pm2 status
```

### Restart Application
```bash
ssh inverseiq@146.190.233.46
pm2 restart xrypt
```

### Monitor Resources
```bash
ssh inverseiq@146.190.233.46
pm2 monit
```

### View Environment Variables
```bash
ssh inverseiq@146.190.233.46
cd ~/xrypt-service
cat .env
```

---

## Troubleshooting

### Issue: Deployment script fails

**Solution:**
```bash
# Check SSH connection
ssh inverseiq@146.190.233.46

# Verify you're in the correct directory
pwd
# Should show: /Users/redabhaj/Desktop/xrypt.net(final)/trading-data-collection-service

# Make script executable
chmod +x scripts/deployDEXToDroplet.sh

# Try again
./scripts/deployDEXToDroplet.sh
```

### Issue: DEX endpoints return errors

**Solution:**
```bash
# Check if RPC URLs are configured
ssh inverseiq@146.190.233.46
cd ~/xrypt-service
grep "RPC_URL" .env

# If empty, add RPC URLs
nano .env
# Add: ETHEREUM_RPC_URL=https://eth.llamarpc.com

# Restart
pm2 restart xrypt
```

### Issue: Application won't start

**Solution:**
```bash
ssh inverseiq@146.190.233.46
cd ~/xrypt-service

# Check for errors
pm2 logs xrypt --lines 50

# Check if port is in use
sudo lsof -i :3000

# Restart PM2
pm2 restart xrypt

# If still failing, start manually to see errors
node server.js
```

### Issue: High memory usage

**Solution:**
```bash
ssh inverseiq@146.190.233.46

# Check memory
free -h

# Restart application
pm2 restart xrypt

# If persistent, consider upgrading droplet
```

---

## Security Best Practices

### 1. Environment Variables
- ✅ Never commit `.env` files to git
