# Performance Feedback Loop Documentation

## Overview

The InverseIQ platform includes a comprehensive performance feedback loop that allows the AI engine to learn from real trading outcomes and continuously improve signal accuracy.

## How It Works

1. **Signal Generation**: When signals are generated via `/api/signals`, they are automatically tracked
2. **Feedback Submission**: Submit signal outcomes (win/loss) via the feedback API
3. **Automatic Learning**: The AI engine automatically adjusts pattern confidence based on performance
4. **Continuous Improvement**: Patterns with better performance get higher confidence scores

## Architecture

```
┌─────────────────┐
│  Signal Request │
└────────┬────────┘
         │
         ▼
┌─────────────────┐      ┌──────────────────┐
│  Hybrid Engine  │─────▶│  Signal Tracker  │
└────────┬────────┘      └──────────────────┘
         │
         ▼
┌─────────────────┐
│  Return Signals │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Trading System │
│  (External)     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Submit Feedback │
└────────┬────────┘
         │
         ▼
┌─────────────────┐      ┌──────────────────┐
│  Update Signal  │─────▶│  Update Pattern  │
│  Tracker        │      │  Confidence      │
└─────────────────┘      └──────────────────┘
```

## API Endpoints

### 1. Submit Signal Outcome

Submit the outcome of a trading signal for performance tracking.

**Endpoint:** `POST /api/feedback/signal-outcome`

**Request Body:**
```json
{
  "signalId": "BTCUSDT_1234567890_abc123",
  "outcome": "win",           // "win" or "loss"
  "entryPrice": 45000,        // Optional
  "exitPrice": 46000,         // Optional
  "pnl": 1000,                // Profit/Loss amount
  "pnlPercentage": 2.22,      // Profit/Loss percentage
  "duration": 3600000,        // Duration in milliseconds (optional)
  "notes": "Good signal"      // Optional notes
}
```

**Response:**
```json
{
  "success": true,
  "message": "Signal outcome recorded successfully",
  "signal": {
    "signalId": "BTCUSDT_1234567890_abc123",
    "symbol": "BTCUSDT",
    "outcome": "win",
    "pnl": 1000,
    "status": "closed"
  },
  "performance": {
    "wins": 5,
    "losses": 1,
    "totalPnl": 3500,
    "avgPnl": 583.33
  },
  "stats": {
    "trackerStats": {
      "winRate": "83.33",
      "totalPnl": "3500.00"
    },
    "aiAccuracy": "78.50"
  }
}
```

**Example with curl:**
```bash
curl -X POST http://localhost:3000/api/feedback/signal-outcome \
  -H "Content-Type: application/json" \
  -d '{
    "signalId": "BTCUSDT_1234567890_abc123",
    "outcome": "win",
    "pnl": 500,
    "pnlPercentage": 2.5
  }'
```

### 2. Submit Batch Feedback

Submit multiple signal outcomes at once.

**Endpoint:** `POST /api/feedback/batch`

**Request Body:**
```json
{
  "outcomes": [
    {
      "signalId": "BTCUSDT_123_abc",
      "outcome": "win",
      "pnl": 500,
      "pnlPercentage": 2.5
    },
    {
      "signalId": "ETHUSDT_456_def",
      "outcome": "loss",
      "pnl": -200,
      "pnlPercentage": -1.2
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Processed 2 outcomes",
  "results": {
    "processed": 2,
    "successful": 2,
    "failed": 0,
    "errors": []
  }
}
```

### 3. Get Feedback Statistics

Get comprehensive statistics about signal performance.

**Endpoint:** `GET /api/feedback/stats`

**Response:**
```json
{
  "success": true,
  "tracker": {
    "total": 50,
    "active": 10,
    "closed": 35,
    "expired": 5,
    "wins": 28,
    "losses": 7,
    "winRate": "80.00",
    "totalPnl": "15000.00",
    "avgPnl": "428.57",
    "avgConfidence": "82.50"
  },
  "ai": {
    "totalPatterns": 150,
    "totalTraders": 25,
    "accuracy": "78.50",
    "totalSignals": 50,
    "successfulSignals": 35,
    "failedSignals": 15
  }
}
```

### 4. Get Signal History

Retrieve historical signals with optional filtering.

**Endpoint:** `GET /api/feedback/history`

**Query Parameters:**
- `symbol` (optional): Filter by trading pair (e.g., BTCUSDT)
- `status` (optional): Filter by status (active, closed, expired)
- `limit` (optional): Limit number of results

**Example:**
```bash
GET /api/feedback/history?symbol=BTCUSDT&status=closed&limit=10
```

**Response:**
```json
{
  "success": true,
  "count": 10,
  "signals": [
    {
      "signalId": "BTCUSDT_1234567890_abc123",
      "symbol": "BTCUSDT",
      "direction": "LONG",
      "confidence": 85,
      "status": "closed",
      "outcome": "win",
      "pnl": 500,
      "generatedAt": "2024-11-03T10:00:00Z",
      "closedAt": "2024-11-03T14:00:00Z"
    }
  ]
}
```

### 5. Get Specific Signal

Get details of a specific signal by ID.

**Endpoint:** `GET /api/feedback/signal/:signalId`

**Example:**
```bash
GET /api/feedback/signal/BTCUSDT_1234567890_abc123
```

**Response:**
```json
{
  "success": true,
  "signal": {
    "signalId": "BTCUSDT_1234567890_abc123",
    "symbol": "BTCUSDT",
    "direction": "LONG",
    "confidence": 85,
    "patternKey": "BTCUSDT_LONG_RSI_OVERSOLD",
    "status": "closed",
    "outcome": "win",
    "pnl": 500,
    "pnlPercentage": 2.5,
    "generatedAt": "2024-11-03T10:00:00Z",
    "closedAt": "2024-11-03T14:00:00Z",
    "fullSignal": { /* complete signal data */ }
  }
}
```

## Integration Examples

### JavaScript/Node.js

```javascript
const axios = require('axios');

async function tradingWorkflow() {
  // 1. Get signals
  const { data: signalsData } = await axios.get('http://localhost:3000/api/signals');
  const signal = signalsData.signals[0];
  
  console.log(`Received signal: ${signal.symbol} ${signal.direction}`);
  console.log(`Confidence: ${signal.confidence}%`);
  
  // 2. Execute trade based on signal
  // (Your trading logic here)
  const tradeResult = await executeTrade(signal);
  
  // 3. Submit outcome back to the system
  await axios.post('http://localhost:3000/api/feedback/signal-outcome', {
    signalId: signal.signalId,
    outcome: tradeResult.profitable ? 'win' : 'loss',
    entryPrice: tradeResult.entryPrice,
    exitPrice: tradeResult.exitPrice,
    pnl: tradeResult.pnl,
    pnlPercentage: tradeResult.pnlPercentage
  });
  
  console.log('Feedback submitted successfully');
}
```

### Python

```python
import requests

def trading_workflow():
    # 1. Get signals
    response = requests.get('http://localhost:3000/api/signals')
    signals = response.json()['signals']
    signal = signals[0]
    
    print(f"Received signal: {signal['symbol']} {signal['direction']}")
    print(f"Confidence: {signal['confidence']}%")
    
    # 2. Execute trade based on signal
    # (Your trading logic here)
    trade_result = execute_trade(signal)
    
    # 3. Submit outcome back to the system
    requests.post('http://localhost:3000/api/feedback/signal-outcome', json={
        'signalId': signal['signalId'],
        'outcome': 'win' if trade_result['profitable'] else 'loss',
        'entryPrice': trade_result['entry_price'],
        'exitPrice': trade_result['exit_price'],
        'pnl': trade_result['pnl'],
        'pnlPercentage': trade_result['pnl_percentage']
    })
    
    print('Feedback submitted successfully')
```

### cURL Examples

```bash
# Submit win outcome
curl -X POST http://localhost:3000/api/feedback/signal-outcome \
  -H "Content-Type: application/json" \
  -d '{
    "signalId": "BTCUSDT_1234567890_abc123",
    "outcome": "win",
    "pnl": 500,
    "pnlPercentage": 2.5
  }'

# Submit loss outcome
curl -X POST http://localhost:3000/api/feedback/signal-outcome \
  -H "Content-Type: application/json" \
  -d '{
    "signalId": "ETHUSDT_9876543210_xyz789",
    "outcome": "loss",
    "pnl": -200,
    "pnlPercentage": -1.2
  }'

# Get statistics
curl http://localhost:3000/api/feedback/stats

# Get signal history
curl "http://localhost:3000/api/feedback/history?symbol=BTCUSDT&limit=20"
```

## How Confidence Adjusts

The AI engine automatically adjusts pattern confidence based on multiple factors:

### Adjustment Factors

1. **Win Rate Impact**
   - Win rate > 80%: +10% confidence boost
   - Win rate > 70%: +5% confidence boost
   - Win rate < 50%: -10% confidence penalty

2. **Sample Size**
   - More feedback = more reliable adjustments
   - Minimum 5 signals before major adjustments
   - Confidence bounds: 0-100%

3. **Recent Performance**
   - Recent outcomes weighted more heavily
   - Last 10 signals have 2x weight
   - Helps adapt to changing market conditions

4. **PnL Amount**
   - Larger wins/losses have more impact
   - Total loss > $20k: +15% confidence
   - Total loss > $10k: +12% confidence
   - Total loss > $5k: +8% confidence

5. **Pattern Source Priority**
   - Combined patterns (public + trader): Highest priority
   - Trader-only patterns: High priority
   - Public-only patterns: Medium priority

### Example Progression

**Initial State:**
- Pattern confidence: 75%
- Wins: 0, Losses: 0

**After 5 wins, 1 loss (83% win rate):**
- Pattern confidence: 82%
- Adjustment: +7% (good performance)

**After 10 wins, 2 losses (83% win rate):**
- Pattern confidence: 88%
- Adjustment: +6% (consistent performance)

**After 3 consecutive losses:**
- Pattern confidence: 70%
- Adjustment: -8% (poor recent performance)

**After recovery (15 wins, 5 losses - 75% win rate):**
- Pattern confidence: 85%
- Adjustment: +5% (proven reliability)

## Data Persistence

All feedback data is automatically persisted to disk:

### Storage Files

1. **`data/active_signals.json`**
   - Stores all tracked signals
   - Includes outcomes and metadata
   - Updated on every feedback submission

2. **`data/hybrid_pattern_database.json`**
   - Stores pattern performance data
   - Includes confidence scores
   - Updated when patterns are adjusted

### Data Recovery

- Data survives server restarts
- Automatically loaded on startup
- No manual intervention required

### Backup Recommendations

```bash
# Backup signal data
cp data/active_signals.json data/backups/active_signals_$(date +%Y%m%d).json

# Backup pattern database
cp data/hybrid_pattern_database.json data/backups/patterns_$(date +%Y%m%d).json
```

## Testing

### Run Comprehensive Tests

```bash
node scripts/testFeedbackLoop.js
```

This test suite will:
1. ✅ Generate test signals
2. ✅ Track signals in the system
3. ✅ Submit test feedback
4. ✅ Verify confidence adjustments
5. ✅ Check data persistence
6. ✅ Validate all API endpoints
7. ✅ Test cleanup functions
8. ✅ Simulate real-world scenarios

### Manual Testing

```bash
# 1. Start the server
npm start

# 2. Generate signals
curl http://localhost:3000/api/signals

# 3. Submit feedback (use actual signal ID from step 2)
curl -X POST http://localhost:3000/api/feedback/signal-outcome \
  -H "Content-Type: application/json" \
  -d '{"signalId": "BTCUSDT_xxx_yyy", "outcome": "win", "pnl": 500}'

# 4. Check statistics
curl http://localhost:3000/api/feedback/stats
```

## Monitoring

### Real-Time Monitoring

Monitor the feedback loop in real-time through server logs:

```bash
npm start

# You'll see logs like:
# 📍 Signal tracked: BTCUSDT_1234567890_abc123 (BTCUSDT LONG)
# 📊 Feedback recorded for BTCUSDT_1234567890_abc123:
#    Outcome: WIN
#    PnL: 500
#    Overall Win Rate: 80.00%
#    AI Accuracy: 78.50%
```

### Statistics Dashboard

Check statistics programmatically:

```javascript
const stats = await fetch('http://localhost:3000/api/feedback/stats')
  .then(r => r.json());

console.log(`Win Rate: ${stats.tracker.winRate}%`);
console.log(`AI Accuracy: ${stats.ai.accuracy}%`);
console.log(`Total PnL: $${stats.tracker.totalPnl}`);
```

### Automated Cleanup

The system automatically:
- Checks for expired signals every hour
- Cleans up old signals (>30 days) periodically
- Maintains optimal database size

## Best Practices

### 1. Submit Feedback Promptly
- Submit outcomes as soon as trades close
- Don't wait to batch submissions
- Real-time feedback = faster learning

### 2. Include Accurate Data
- Always include PnL amounts
- Provide entry/exit prices when available
- Add notes for unusual outcomes

### 3. Monitor Performance
- Check statistics regularly
- Watch for declining win rates
- Investigate patterns with poor performance

### 4. Handle Errors Gracefully
- Implement retry logic for failed submissions
- Log errors for debugging
- Don't block trading on feedback failures

### 5. Backup Data
- Regular backups of signal and pattern data
- Test restore procedures
- Keep historical data for analysis

## Troubleshooting

### Signal Not Found Error

**Problem:** `Signal not found: BTCUSDT_xxx_yyy`

**Solutions:**
1. Verify the signal ID is correct
2. Check if signal has expired (>4 hours old)
3. Ensure signal was generated by this server instance

### Feedback Not Updating Confidence

**Problem:** Pattern confidence not changing after feedback

**Solutions:**
1. Check if pattern has performance data
2. Verify minimum sample size (need 5+ signals)
3. Review confidence calculation logic
4. Check server logs for errors

### Data Not Persisting

**Problem:** Data lost after server restart

**Solutions:**
1. Check file permissions on `data/` directory
2. Verify disk space availability
3. Review server logs for save errors
4. Ensure proper shutdown (not force-killed)

## Support

For issues or questions:
1. Check server logs for error messages
2. Run test suite: `node scripts/testFeedbackLoop.js`
3. Review this documentation
4. Check GitHub issues

## Future Enhancements

Planned improvements:
- Real-time WebSocket updates for feedback
- Performance visualization dashboard
- Advanced analytics and reporting
- Pattern pruning for poor performers
- A/B testing framework
- Machine learning optimization
