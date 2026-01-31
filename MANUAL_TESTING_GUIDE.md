# Manual Testing Guide for XRYPT.NET Platform

## Prerequisites

1. **Start the Server**
```bash
node server.js
```

The server should start on `http://localhost:3000`

---

## Test 1: Signal Performance Dashboard (Frontend)

### Steps:
1. Open your browser
2. Navigate to: `http://localhost:3000/signal-performance.html`
3. Verify the following elements are visible:
   - [ ] Page title "Signal Performance Dashboard"
   - [ ] Overall statistics cards (Win Rate, Total Signals, Avg PnL)
   - [ ] Performance chart (line graph)
   - [ ] Symbol win rate chart (bar graph)
   - [ ] Pattern win rate chart (bar graph)
   - [ ] Best trades table
   - [ ] Pattern performance table
   - [ ] Recent signals table
   - [ ] Signal verification input field

### Expected Results:
- All UI elements should be visible and properly styled
- Charts should render without errors
- Tables should display data (may be empty initially)
- Dark theme with blue/green accent colors

---

## Test 2: Trade Analyzer Dashboard (Frontend)

### Steps:
1. Navigate to: `http://localhost:3000/trade-analyzer.html`
2. Verify the following elements:
   - [ ] Page title "Trade Analyzer"
   - [ ] User ID display
   - [ ] Tab navigation (Dashboard, Exchanges, Positions, Analysis, History)
   - [ ] Dashboard overview cards
   - [ ] Quick action buttons

3. Test tab navigation:
   - [ ] Click "Exchanges" tab - should show exchange connection interface
   - [ ] Click "Positions" tab - should show positions table
   - [ ] Click "Analysis" tab - should show analysis interface
   - [ ] Click "History" tab - should show history table

### Expected Results:
- All tabs should be clickable and switch content
- UI should be responsive and well-styled
- No console errors

---

## Test 3: API Endpoints Testing

### Test 3.1: Performance Stats Endpoint

```bash
curl -X GET http://localhost:3000/api/performance/stats
```

**Expected Response:**
```json
{
  "success": true,
  "stats": {
    "totalSignals": 0,
    "winRate": 0,
    "avgPnl": 0,
    ...
  }
}
```

### Test 3.2: Performance History Endpoint

```bash
curl -X GET "http://localhost:3000/api/performance/history?limit=10"
```

**Expected Response:**
```json
{
  "success": true,
  "count": 0,
  "signals": []
}
```

### Test 3.3: Pattern Performance Endpoint

```bash
curl -X GET http://localhost:3000/api/performance/patterns
```

**Expected Response:**
```json
{
  "success": true,
  "count": 0,
  "patterns": []
}
```

### Test 3.4: Symbol Performance Endpoint

```bash
curl -X GET http://localhost:3000/api/performance/symbols
```

**Expected Response:**
```json
{
  "success": true,
  "count": 0,
  "symbols": []
}
```

### Test 3.5: Signal Verification Endpoint

```bash
curl -X GET http://localhost:3000/api/performance/verify/test_verification_id
```

**Expected Response (Not Found):**
```json
{
  "success": false,
  "error": "Signal not found"
}
```

### Test 3.6: Trade Analyzer - Set API Keys

```bash
curl -X POST http://localhost:3000/api/trade-analyzer/api-keys \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test_user_123",
    "exchange": "binance",
    "apiKey": "test_api_key",
    "apiSecret": "test_api_secret"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "API keys saved for binance"
}
```

### Test 3.7: Trade Analyzer - Get Connected Exchanges

```bash
curl -X GET http://localhost:3000/api/trade-analyzer/exchanges/test_user_123
```

**Expected Response:**
```json
{
  "success": true,
  "exchanges": ["binance"]
}
```

### Test 3.8: Trade Analyzer - Get Positions

```bash
curl -X GET http://localhost:3000/api/trade-analyzer/positions/test_user_123
```

**Expected Response:**
```json
{
  "success": true,
  "positions": {
    "binance": {
      "positions": [],
      "error": "..."
    }
  }
}
```

### Test 3.9: Trade Analyzer - Get Account Info

```bash
curl -X GET http://localhost:3000/api/trade-analyzer/account/test_user_123
```

**Expected Response:**
```json
{
  "success": true,
  "accountInfo": {
    "binance": {
      "balance": 0,
      "error": "..."
    }
  }
}
```

### Test 3.10: Trade Analyzer - Analyze Trades

```bash
curl -X GET http://localhost:3000/api/trade-analyzer/analyze/test_user_123
```

**Expected Response:**
```json
{
  "success": true,
  "analysis": {
    "userId": "test_user_123",
    "timestamp": "...",
    "exchanges": {},
    "riskAssessment": {},
    "overallRecommendation": "..."
  }
}
```

---

## Test 4: Integration Testing

### Test 4.1: Generate and Track Signals

```bash
# Run the signal performance test
node scripts/testSignalPerformance.js
```

**Expected Output:**
- All tests should pass
- Signals should be generated
- Performance tracking should work
- Statistics should be calculated

### Test 4.2: Auto-Track Random Pairs

```bash
# Run the auto-tracking script
node scripts/autoTrackRandomPairs.js
```

**Expected Output:**
- 2 random pairs should be selected
- Signals should be tracked automatically
- Performance data should be updated

### Test 4.3: Test Integration

```bash
# Run the integration test
node scripts/testSignalIntegration.js
```

**Expected Output:**
- Signal generation should work
- Performance tracking should integrate
- Statistics should be accurate

---

## Test 5: Error Handling

### Test 5.1: Invalid API Key Request

```bash
curl -X POST http://localhost:3000/api/trade-analyzer/api-keys \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test_user"
  }'
```

**Expected Response:**
```json
{
  "success": false,
  "error": "Missing required parameters"
}
```

### Test 5.2: Non-existent User

```bash
curl -X GET http://localhost:3000/api/trade-analyzer/exchanges/nonexistent_user
```

**Expected Response:**
```json
{
  "success": true,
  "exchanges": []
}
```

### Test 5.3: Invalid Verification ID

```bash
curl -X GET http://localhost:3000/api/performance/verify/invalid_id_12345
```

**Expected Response:**
```json
{
  "success": false,
  "error": "Signal not found"
}
```

---

## Test 6: Performance Testing

### Test 6.1: Load Test

```bash
# Run multiple concurrent requests
for i in {1..10}; do
  curl -X GET http://localhost:3000/api/performance/stats &
done
wait
```

**Expected Result:**
- All requests should complete successfully
- Response time should be < 500ms
- No server errors

### Test 6.2: Memory Usage

```bash
# Monitor server memory usage
ps aux | grep node
```

**Expected Result:**
- Memory usage should be reasonable (< 500MB for basic operations)
- No memory leaks

---

## Test 7: UI Interaction Testing

### Signal Performance Dashboard

1. **Test Dashboard Tab**
   - [ ] Click "Dashboard" tab
   - [ ] Verify overview cards display
   - [ ] Verify charts render

2. **Test Performance Tab**
   - [ ] Click "Performance" tab
   - [ ] Verify performance chart displays
   - [ ] Verify symbol/pattern charts display

3. **Test Signals Tab**
   - [ ] Click "Signals" tab
   - [ ] Verify signals table displays
   - [ ] Click on a verification link (if available)

4. **Test Verify Tab**
   - [ ] Click "Verify" tab
   - [ ] Enter a verification ID
   - [ ] Click "Verify Signal"
   - [ ] Verify result displays

### Trade Analyzer Dashboard

1. **Test Dashboard Tab**
   - [ ] Verify overview displays
   - [ ] Click "Analyze Trades" button
   - [ ] Verify navigation to Analysis tab

2. **Test Exchanges Tab**
   - [ ] Click "Add Exchange" button
   - [ ] Fill in exchange details
   - [ ] Submit form
   - [ ] Verify exchange appears in list

3. **Test Positions Tab**
   - [ ] Click "Refresh Positions" button
   - [ ] Verify positions load
   - [ ] Verify position details display

4. **Test Analysis Tab**
   - [ ] Click "Run Analysis" button
   - [ ] Verify analysis results display
   - [ ] Verify risk score displays
   - [ ] Verify recommendations display

5. **Test History Tab**
   - [ ] Click "Refresh History" button
   - [ ] Verify history table displays
   - [ ] Verify historical data is accurate

---

## Test 8: Data Persistence

### Test 8.1: Signal Data Persistence

1. Generate signals using test script
2. Restart server
3. Check if signals are still available

```bash
# Generate signals
node scripts/testSignalPerformance.js

# Restart server (Ctrl+C then restart)
node server.js

# Check if data persists
curl -X GET http://localhost:3000/api/performance/stats
```

**Expected Result:**
- Signal data should persist after restart
- Statistics should be accurate

### Test 8.2: API Keys Persistence

1. Set API keys for a user
2. Restart server
3. Check if API keys are still available

```bash
# Set API keys
curl -X POST http://localhost:3000/api/trade-analyzer/api-keys \
  -H "Content-Type: application/json" \
  -d '{"userId":"test","exchange":"binance","apiKey":"key","apiSecret":"secret"}'

# Restart server
# Check if keys persist
curl -X GET http://localhost:3000/api/trade-analyzer/exchanges/test
```

**Expected Result:**
- API keys should persist after restart

---

## Test 9: Security Testing

### Test 9.1: SQL Injection

```bash
curl -X GET "http://localhost:3000/api/performance/verify/'; DROP TABLE signals; --"
```

**Expected Result:**
- Should not execute SQL
- Should return "Signal not found" error

### Test 9.2: XSS Attack

```bash
curl -X POST http://localhost:3000/api/trade-analyzer/api-keys \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "<script>alert(\"XSS\")</script>",
    "exchange": "binance",
    "apiKey": "key",
    "apiSecret": "secret"
  }'
```

**Expected Result:**
- Script should be sanitized
- Should not execute in browser

---

## Test 10: Browser Compatibility

Test the following browsers:

- [ ] Chrome/Chromium (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)

For each browser, verify:
- [ ] Pages load correctly
- [ ] Charts render properly
- [ ] Forms work correctly
- [ ] No console errors

---

## Test Checklist Summary

### Frontend Tests
- [ ] Signal Performance Dashboard loads
- [ ] Trade Analyzer Dashboard loads
- [ ] All tabs are functional
- [ ] Charts render correctly
- [ ] Forms work properly
- [ ] UI is responsive

### API Tests
- [ ] All GET endpoints return correct responses
- [ ] All POST endpoints accept and process data
- [ ] Error handling works correctly
- [ ] Response formats are consistent

### Integration Tests
- [ ] Signal generation works
- [ ] Performance tracking works
- [ ] Trade analysis works
- [ ] Data flows correctly between components

### Performance Tests
- [ ] Response times are acceptable
- [ ] Server handles concurrent requests
- [ ] Memory usage is reasonable
- [ ] No memory leaks

### Security Tests
- [ ] Input validation works
- [ ] No SQL injection vulnerabilities
- [ ] No XSS vulnerabilities
- [ ] API keys are stored securely

### Data Persistence Tests
- [ ] Signal data persists
- [ ] API keys persist
- [ ] Performance data persists
- [ ] Analysis history persists

---

## Reporting Issues

When reporting issues, include:
1. Test number and name
2. Steps to reproduce
3. Expected result
4. Actual result
5. Screenshots (if applicable)
6. Browser/environment details
7. Error messages (if any)

---

## Notes

- Some tests may fail if the server is not running
- Some tests require actual exchange API keys to work fully
- Mock data is used for testing when real data is not available
- Performance may vary based on system resources
