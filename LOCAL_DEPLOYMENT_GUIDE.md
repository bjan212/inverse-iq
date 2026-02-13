# Local Deployment Guide - Dexscreener Integration

## 🚀 Quick Start (5 Minutes)

This guide will help you deploy the inverse-iq system locally with the new Dexscreener API integration.

### Prerequisites
- **Node.js** v18 or higher
- **npm** v9 or higher
- **Git** installed
- **Internet connection** for API calls

---

## Step 1: Install Dependencies (2 minutes)

```bash
cd /home/runner/work/inverse-iq/inverse-iq
npm install
```

**Expected output:**
```
added 546 packages in 42s
```

---

## Step 2: Verify Installation (30 seconds)

Test that the Dexscreener collector loads correctly:

```bash
node -e "const DexscreenerCollector = require('./src/collectors/dexscreenerCollector'); console.log('✅ Dexscreener collector ready');"
```

**Expected output:**
```
✅ Dexscreener collector ready
```

---

## Step 3: Run Tests (1 minute)

Verify all systems are working:

```bash
npm test
```

**Expected output:**
```
Total Tests: 6
Passed: 6 ✅
Failed: 0 ❌
Success Rate: 100%
```

---

## Step 4: Bootstrap AI with DEX Data (3-5 minutes)

Initialize the AI with both CEX and DEX market data:

```bash
npm run bootstrap
```

This will:
1. Collect 30 days of CEX data from Binance (BTC, ETH, BNB)
2. Collect trending DEX data from Dexscreener
3. Create pattern database at `data/hybrid_pattern_database.json`

**Expected output:**
```
✅ Bootstrap Phase Complete!
   Public patterns added: 42
✅ DEX Bootstrap Complete!
   DEX patterns added: 12
```

---

## Step 5: Start the Server (30 seconds)

```bash
npm start
```

**Expected output:**
```
🚀 Xrypt Trading Service
Port: 3000
Status: ✅ Running
Health: http://localhost:3000/api/health
```

---

## 🎯 Quick Feature Tests

### Test 1: Search DEX Tokens

```bash
node scripts/collect.js --platform dexscreener --query USDC
```

**What this does:**
- Searches Dexscreener for USDC pairs
- Returns pairs from Uniswap, PancakeSwap, SushiSwap, etc.
- Saves results to `output/dex_search_*.json`

### Test 2: Get Trending DEX Tokens

```bash
node scripts/collect.js --platform dexscreener
```

**What this does:**
- Fetches currently trending/boosted tokens
- Analyzes liquidity and price movements
- Saves results to `output/dex_trending_*.json`

### Test 3: Run Full Example

```bash
node examples/dexscreener-example.js
```

**What this does:**
- Demonstrates all Dexscreener features
- Shows pattern analysis with mock data
- Displays usage examples

---

## 🔧 Configuration (Optional)

Create a `.env` file in the root directory:

```env
# Server
PORT=3000
NODE_ENV=development

# Optional: Email notifications
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# Optional: Telegram notifications
TELEGRAM_BOT_TOKEN=your-bot-token
TELEGRAM_CHAT_ID=your-chat-id
```

---

## 📊 API Endpoints

Once the server is running, you can access:

### Health Check
```bash
curl http://localhost:3000/api/health
```

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2026-02-13T15:50:00.000Z"
}
```

### Get Trading Signals
```bash
curl http://localhost:3000/api/signals
```

**Response:**
```json
{
  "signals": [
    {
      "symbol": "BTCUSDT",
      "direction": "LONG",
      "confidence": 85,
      "source": "combined"
    }
  ]
}
```

### Get Supported Exchanges
```bash
curl http://localhost:3000/api/exchanges
```

---

## 🧪 Testing DEX Integration

### JavaScript API Test

Create a test file `test-dex.js`:

```javascript
const DexscreenerCollector = require('./src/collectors/dexscreenerCollector');
const HybridEngine = require('./src/ai-engine/hybridEngine');

async function testDEX() {
  console.log('Testing Dexscreener Integration...\n');
  
  // Test 1: Collector
  const collector = new DexscreenerCollector();
  console.log('✅ Collector initialized');
  
  // Test 2: Pattern Analysis (mock data)
  const mockPairs = [{
    baseToken: { symbol: 'TEST' },
    chainId: 'ethereum',
    volume: { h24: 100000 },
    liquidity: { usd: 25000 },
    priceChange: { h24: 75 }
  }];
  
  const analysis = collector.analyzeDEXPatterns(mockPairs);
  console.log('✅ Pattern analysis:', analysis.patterns.length, 'patterns');
  
  // Test 3: AI Integration
  const engine = new HybridEngine('./data/test_db.json');
  console.log('✅ AI engine initialized');
  console.log('✅ DEX collector available:', !!engine.dexCollector);
  
  console.log('\n🎉 All tests passed!');
}

testDEX().catch(console.error);
```

Run the test:
```bash
node test-dex.js
```

---

## 📁 Project Structure

After deployment, your directory should look like:

```
inverse-iq/
├── src/
│   ├── collectors/
│   │   ├── binanceCollector.js
│   │   ├── bybitCollector.js
│   │   ├── dexscreenerCollector.js ← NEW
│   │   └── ...
│   ├── ai-engine/
│   │   ├── hybridEngine.js (updated)
│   │   └── ...
│   └── ...
├── scripts/
│   ├── bootstrapHybridAI.js (updated)
│   ├── collect.js (updated)
│   └── ...
├── docs/
│   ├── DEXSCREENER_INTEGRATION.md ← NEW
│   └── ...
├── examples/
│   ├── dexscreener-example.js ← NEW
│   └── ...
├── data/
│   ├── hybrid_pattern_database.json (created after bootstrap)
│   └── ...
├── output/
│   ├── dex_search_*.json (created by collect script)
│   ├── dex_trending_*.json (created by collect script)
│   └── ...
└── package.json
```

---

## 🐛 Troubleshooting

### Issue: "Cannot find module 'axios'"

**Solution:**
```bash
npm install
```

### Issue: "ENOTFOUND api.dexscreener.com"

**Cause:** Network/firewall blocking Dexscreener API

**Solution:**
- Check internet connection
- Verify firewall settings
- Try example with mock data: `node examples/dexscreener-example.js`

### Issue: Tests failing

**Solution:**
```bash
# Clean install
rm -rf node_modules package-lock.json
npm install
npm test
```

### Issue: Port 3000 already in use

**Solution:**
```bash
# Use different port
PORT=4000 npm start
```

Or edit `.env`:
```env
PORT=4000
```

---

## 📚 Documentation

- **Integration Guide**: [docs/DEXSCREENER_INTEGRATION.md](docs/DEXSCREENER_INTEGRATION.md)
- **Implementation Summary**: [DEXSCREENER_INTEGRATION_SUMMARY.md](DEXSCREENER_INTEGRATION_SUMMARY.md)
- **Working Example**: [examples/dexscreener-example.js](examples/dexscreener-example.js)
- **Main README**: [README.md](README.md)

---

## 🔍 Verification Checklist

After deployment, verify:

- [ ] Dependencies installed (`npm install` completed)
- [ ] Tests passing (`npm test` shows 6/6 passed)
- [ ] Bootstrap completed (`data/hybrid_pattern_database.json` exists)
- [ ] Server starts (`npm start` runs without errors)
- [ ] Health endpoint responds (`curl http://localhost:3000/api/health`)
- [ ] DEX search works (or fails gracefully with network error)
- [ ] Example runs (`node examples/dexscreener-example.js`)

---

## 🚀 Next Steps

1. **Explore the API**: Read [docs/DEXSCREENER_INTEGRATION.md](docs/DEXSCREENER_INTEGRATION.md)
2. **Test with Real Data**: Run `node scripts/collect.js --platform dexscreener --query PEPE`
3. **Integrate with Frontend**: Use API endpoints in your UI
4. **Monitor Logs**: Check `data/engine_logs.jsonl` for AI activity
5. **Customize Patterns**: Modify pattern detection in `dexscreenerCollector.js`

---

## 💡 Usage Examples

### Example 1: Search and Analyze

```bash
# Search for a token
node scripts/collect.js --platform dexscreener --query "Shiba Inu"

# Results saved to output/dex_search_*.json
cat output/dex_search_*.json | jq '.pairs[0] | {symbol: .baseToken.symbol, price: .priceUsd, liquidity: .liquidity.usd}'
```

### Example 2: Generate Signals with DEX Data

```javascript
const HybridEngine = require('./src/ai-engine/hybridEngine');

async function generateSignals() {
  const engine = new HybridEngine();
  
  // Bootstrap with both CEX and DEX
  await engine.bootstrapWithPublicData(['BTCUSDT', 'ETHUSDT'], 30);
  await engine.bootstrapWithDEXData([], null);
  
  // Generate signals
  const signals = await engine.generateSmartSignals(['BTCUSDT', 'ETHUSDT']);
  
  console.log(`Generated ${signals.length} signals`);
  console.log('Data sources:', engine.dataSources);
  // Output: { publicPatterns: 42, traderPatterns: 0, combinedPatterns: 0, dexPatterns: 12 }
}

generateSignals();
```

### Example 3: Monitor Trending Tokens

```bash
# Create a monitoring script
cat > monitor-dex.sh << 'EOF'
#!/bin/bash
while true; do
  echo "Checking trending tokens..."
  node scripts/collect.js --platform dexscreener
  echo "Waiting 5 minutes..."
  sleep 300
done
EOF

chmod +x monitor-dex.sh
./monitor-dex.sh
```

---

## 🔒 Security Notes

- **API Keys**: Never commit API keys to git
- **Rate Limits**: Dexscreener has rate limits (300 req/min for pairs)
- **Error Handling**: All API calls have timeout and error handling
- **.gitignore**: Log files (*.jsonl) are excluded from git

---

## 📞 Support

**Issues with deployment?**

1. Check [DEXSCREENER_INTEGRATION_SUMMARY.md](DEXSCREENER_INTEGRATION_SUMMARY.md) for known issues
2. Review error messages in console
3. Test with example: `node examples/dexscreener-example.js`
4. Open GitHub issue with error details

**Email**: support@xrypt.net

---

**Last Updated**: February 13, 2026  
**Version**: 1.0.0 with Dexscreener Integration
