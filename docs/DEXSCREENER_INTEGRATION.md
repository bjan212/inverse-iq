# Dexscreener API Integration Guide

## Overview

This document explains how to use the Dexscreener API integration in the Xrypt trading platform. Dexscreener provides real-time DEX (Decentralized Exchange) market data across multiple blockchains, which enhances our AI trading signals by combining CEX and DEX market patterns.

---

## What is Dexscreener?

Dexscreener is a DEX aggregator that tracks trading pairs across multiple decentralized exchanges and blockchains. It provides:

- **Real-time price data** for DEX trading pairs
- **Liquidity information** for risk assessment
- **Volume metrics** across multiple chains
- **Trending tokens** and market sentiment
- **Multi-chain support** (Ethereum, BSC, Polygon, Arbitrum, etc.)

---

## API Features

The Dexscreener integration provides the following capabilities:

### 1. Search DEX Pairs
Search for trading pairs by token name, symbol, or address:

```javascript
const DexscreenerCollector = require('./src/collectors/dexscreenerCollector');
const collector = new DexscreenerCollector();

// Search by token name or symbol
const results = await collector.searchPairs('USDC');
console.log(`Found ${results.pairs.length} pairs`);
```

### 2. Get Token Pair Data
Fetch detailed information for specific tokens:

```javascript
// Single token
const pairData = await collector.getTokenPairs('0x...');

// Multiple tokens (max 30)
const tokens = ['0x...', '0x...', '0x...'];
const pairData = await collector.getTokenPairs(tokens);
```

### 3. Get Pair by Chain and Address
Fetch specific pair information:

```javascript
const pair = await collector.getPairByChainAndAddress('ethereum', '0x...');
console.log(`Price: ${pair.pair.priceUsd}`);
console.log(`Liquidity: ${pair.pair.liquidity.usd}`);
```

### 4. Get Trending Tokens
Fetch promoted/boosted tokens (often indicates high interest):

```javascript
// Latest boosted tokens
const boosted = await collector.getLatestBoostedTokens();

// Top boosted tokens
const topBoosted = await collector.getTopBoostedTokens();
```

### 5. Comprehensive Data Collection
Collect complete market snapshot:

```javascript
const data = await collector.getComprehensiveData(
  ['0x...', '0x...'], // token addresses (optional)
  'ethereum'          // chain (optional)
);

console.log(`Pairs: ${data.pairs.length}`);
console.log(`Boosted: ${data.boosted.length}`);
console.log(`Profiles: ${data.profiles.length}`);
```

---

## AI Integration

### Bootstrap AI with DEX Data

The HybridEngine now supports DEX data alongside CEX data:

```javascript
const HybridEngine = require('./src/ai-engine/hybridEngine');
const engine = new HybridEngine();

// Bootstrap with CEX data (existing)
await engine.bootstrapWithPublicData(['BTCUSDT', 'ETHUSDT'], 30);

// Bootstrap with DEX data (new)
await engine.bootstrapWithDEXData([], null); // Fetches trending DEX data
```

### DEX Pattern Recognition

The system analyzes DEX data for these patterns:

1. **Low Liquidity Risk**
   - Pairs with liquidity < $50,000
   - High risk of slippage and manipulation
   - Confidence: 75%

2. **Extreme Price Moves**
   - 24h price change > ±50%
   - Potential reversal patterns
   - Confidence: 70%

3. **High Volume Pairs**
   - Daily volume > $100,000
   - Tracked for potential large moves

---

## Command Line Usage

### Collect DEX Data

```bash
# Search for pairs
node scripts/collect.js --platform dexscreener --query USDC

# Fetch specific token data
node scripts/collect.js --platform dexscreener \
  --tokens 0x...,0x... \
  --chain ethereum

# Fetch trending data
node scripts/collect.js --platform dexscreener
```

### Bootstrap with DEX Data

```bash
# Run the bootstrap script (includes DEX data automatically)
npm run bootstrap
```

---

## Rate Limits

The Dexscreener API has the following rate limits:

- **Pairs endpoints**: 300 requests/minute
- **Other endpoints**: 60 requests/minute

The collector handles rate limiting automatically with:
- Request counting per window
- Automatic waiting when limits are reached
- Buffer periods between batches

---

## Data Sources

The integration tracks data from multiple sources:

```javascript
engine.dataSources = {
  publicPatterns: 0,   // CEX public data (Binance)
  traderPatterns: 0,   // Private trader data
  combinedPatterns: 0, // Confirmed by multiple sources
  dexPatterns: 0       // DEX market data (new)
}
```

---

## Pattern Confidence Scoring

DEX patterns are weighted in the confidence calculation:

| Source | Base Confidence |
|--------|----------------|
| Combined (CEX + DEX) | +30% |
| Trader Data | +20% |
| DEX Data | +12% |
| Public CEX Data | +10% |

Additional bonuses apply for:
- Pattern type (low liquidity, extreme moves)
- Multiple occurrences
- Recent activity
- Historical performance

---

## Best Practices

### 1. Use DEX Data for Token Discovery
DEX data is excellent for discovering new tokens before they hit CEX:

```javascript
const boosted = await collector.getLatestBoostedTokens();
// Analyze promotion patterns
```

### 2. Combine with CEX Data
Always use DEX data alongside CEX data for comprehensive market view:

```javascript
// 1. Bootstrap with CEX data
await engine.bootstrapWithPublicData(['BTCUSDT', 'ETHUSDT'], 30);

// 2. Enhance with DEX patterns
await engine.bootstrapWithDEXData([], null);

// 3. Add trader data when available
await engine.addNewTraderData(traderData);
```

### 3. Monitor Liquidity
Low liquidity on DEX can indicate high risk:

```javascript
const analysis = collector.analyzeDEXPatterns(pairs);
console.log(`Low liquidity pairs: ${analysis.stats.lowLiquidityPairs}`);
```

### 4. Cross-Chain Analysis
DEX data spans multiple chains - consider chain-specific patterns:

```javascript
// Focus on specific chain
const ethData = await collector.getComprehensiveData(tokens, 'ethereum');
const bscData = await collector.getComprehensiveData(tokens, 'bsc');
```

---

## Error Handling

The collector includes comprehensive error handling:

```javascript
try {
  const data = await collector.searchPairs('USDC');
} catch (error) {
  if (error.message.includes('Rate limit')) {
    // Rate limit exceeded - wait and retry
    await sleep(60000);
  } else if (error.message.includes('not found')) {
    // Token/pair not found
    console.log('No results found');
  } else {
    // Other error
    console.error('API error:', error.message);
  }
}
```

---

## API Response Structure

### Pair Data Structure

```json
{
  "pairs": [
    {
      "chainId": "ethereum",
      "dexId": "uniswap",
      "url": "https://dexscreener.com/ethereum/0x...",
      "pairAddress": "0x...",
      "baseToken": {
        "address": "0x...",
        "name": "Token Name",
        "symbol": "TKN"
      },
      "quoteToken": {
        "address": "0x...",
        "symbol": "USDC"
      },
      "priceNative": "0.000123",
      "priceUsd": "1.23",
      "txns": {
        "h24": {
          "buys": 100,
          "sells": 50
        }
      },
      "volume": {
        "h24": 100000
      },
      "priceChange": {
        "h24": 15.5
      },
      "liquidity": {
        "usd": 250000,
        "base": 100000,
        "quote": 150000
      },
      "fdv": 1000000,
      "pairCreatedAt": 1640000000000
    }
  ]
}
```

---

## Troubleshooting

### Connection Issues

```javascript
// Test connection first
const success = await collector.testConnection();
if (!success) {
  console.log('Check internet connection');
}
```

### Rate Limiting

If you hit rate limits frequently:
- Reduce request frequency
- Batch token queries (up to 30 per request)
- Add delays between operations

### No Data Returned

If searches return no results:
- Verify token address/symbol
- Check if token exists on DEX
- Try broader search terms

---

## Examples

### Example 1: Find High-Volume DEX Pairs

```javascript
const collector = new DexscreenerCollector();

// Search for USDC pairs
const results = await collector.searchPairs('USDC');

// Filter by volume
const highVolume = results.pairs.filter(pair => 
  parseFloat(pair.volume?.h24 || 0) > 100000
);

console.log(`Found ${highVolume.length} high-volume pairs`);
```

### Example 2: Risk Assessment

```javascript
const analysis = collector.analyzeDEXPatterns(pairs);

console.log('Risk Assessment:');
console.log(`Total pairs: ${analysis.stats.totalPairs}`);
console.log(`High volume: ${analysis.stats.highVolumePairs}`);
console.log(`Low liquidity (risky): ${analysis.stats.lowLiquidityPairs}`);
```

### Example 3: Bootstrap AI with Multi-Source Data

```javascript
const engine = new HybridEngine();

// Step 1: CEX data
console.log('Collecting CEX data...');
await engine.bootstrapWithPublicData(['BTCUSDT', 'ETHUSDT'], 30);

// Step 2: DEX data
console.log('Collecting DEX data...');
await engine.bootstrapWithDEXData([], null);

// Step 3: Generate signals
console.log('Generating signals...');
const signals = await engine.generateSmartSignals(['BTCUSDT', 'ETHUSDT']);

console.log(`Generated ${signals.length} signals`);
console.log(`Data sources:`, engine.dataSources);
```

---

## Supported Chains

Dexscreener supports numerous blockchains including:

- Ethereum
- BNB Smart Chain (BSC)
- Polygon
- Arbitrum
- Optimism
- Base
- Avalanche
- Fantom
- Cronos
- And many more...

Refer to the Dexscreener documentation for the complete list.

---

## Additional Resources

- **Official API Docs**: https://docs.dexscreener.com/api/reference
- **Dexscreener Website**: https://dexscreener.com
- **Rate Limits**: 300 req/min (pairs), 60 req/min (other)

---

## Support

For issues or questions about the Dexscreener integration:

1. Check this documentation first
2. Review error messages carefully
3. Test connection with `testConnection()`
4. Contact support@xrypt.net for assistance

---

**Last Updated**: February 2026
