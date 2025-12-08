#!/bin/bash

# Performance Feedback Loop - API Endpoint Testing Script
# Tests all feedback endpoints with various scenarios

echo "╔════════════════════════════════════════════════════════════╗"
echo "║       PERFORMANCE FEEDBACK API TESTING                    ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

BASE_URL="http://localhost:3000"
PASS=0
FAIL=0

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counter
test_num=0

# Function to run test
run_test() {
    test_num=$((test_num + 1))
    local test_name="$1"
    local method="$2"
    local endpoint="$3"
    local data="$4"
    local expected_status="$5"
    
    echo "Test $test_num: $test_name"
    
    if [ "$method" = "GET" ]; then
        response=$(curl -s -w "\n%{http_code}" "$BASE_URL$endpoint")
    else
        response=$(curl -s -w "\n%{http_code}" -X "$method" "$BASE_URL$endpoint" \
            -H "Content-Type: application/json" \
            -d "$data")
    fi
    
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')
    
    if [ "$http_code" = "$expected_status" ]; then
        echo -e "${GREEN}✅ PASS${NC} - Status: $http_code"
        PASS=$((PASS + 1))
    else
        echo -e "${RED}❌ FAIL${NC} - Expected: $expected_status, Got: $http_code"
        FAIL=$((FAIL + 1))
    fi
    
    echo "Response: $body" | head -c 200
    echo ""
    echo "---"
    echo ""
}

echo "🚀 Starting API Tests..."
echo ""

# TEST 1: Health Check
run_test "Health Check" "GET" "/api/health" "" "200"

# TEST 2: Get Signals (should work and track them)
echo "Generating signals for testing..."
SIGNALS_RESPONSE=$(curl -s "$BASE_URL/api/signals")
echo "Signals generated"
echo ""

# Extract first signal ID for testing
SIGNAL_ID=$(echo "$SIGNALS_RESPONSE" | grep -o '"signalId":"[^"]*"' | head -1 | cut -d'"' -f4)

if [ -z "$SIGNAL_ID" ]; then
    echo -e "${YELLOW}⚠️  No signals generated. Creating mock signal for testing...${NC}"
    SIGNAL_ID="BTCUSDT_$(date +%s)_test123"
    
    # Register mock signal via demo script
    node -e "
    const SignalTracker = require('./src/tracking/signalTracker');
    const tracker = new SignalTracker();
    tracker.registerSignal({
        signalId: '$SIGNAL_ID',
        symbol: 'BTCUSDT',
        direction: 'LONG',
        confidence: 75,
        pattern: { key: 'TEST_PATTERN' },
        generatedAt: new Date(),
        expiresAt: new Date(Date.now() + 4 * 60 * 60 * 1000)
    });
    console.log('Mock signal registered: $SIGNAL_ID');
    "
    echo ""
fi

echo "Using Signal ID for tests: $SIGNAL_ID"
echo ""

# TEST 3: Submit Valid Feedback (Win)
run_test "Submit Valid Feedback - Win" "POST" "/api/feedback/signal-outcome" \
    "{\"signalId\":\"$SIGNAL_ID\",\"outcome\":\"win\",\"pnl\":500,\"pnlPercentage\":2.5}" \
    "200"

# TEST 4: Submit Feedback - Missing signalId
run_test "Submit Feedback - Missing signalId" "POST" "/api/feedback/signal-outcome" \
    "{\"outcome\":\"win\",\"pnl\":500}" \
    "400"

# TEST 5: Submit Feedback - Invalid outcome
run_test "Submit Feedback - Invalid outcome" "POST" "/api/feedback/signal-outcome" \
    "{\"signalId\":\"$SIGNAL_ID\",\"outcome\":\"invalid\",\"pnl\":500}" \
    "400"

# TEST 6: Submit Feedback - Non-existent signal
run_test "Submit Feedback - Non-existent signal" "POST" "/api/feedback/signal-outcome" \
    "{\"signalId\":\"FAKE_SIGNAL_123\",\"outcome\":\"win\",\"pnl\":500}" \
    "404"

# TEST 7: Submit Feedback - Already closed signal (should fail)
run_test "Submit Feedback - Duplicate submission" "POST" "/api/feedback/signal-outcome" \
    "{\"signalId\":\"$SIGNAL_ID\",\"outcome\":\"loss\",\"pnl\":-200}" \
    "500"

# Create new signal for batch test
SIGNAL_ID_2="ETHUSDT_$(date +%s)_test456"
SIGNAL_ID_3="BNBUSDT_$(date +%s)_test789"

node -e "
const SignalTracker = require('./src/tracking/signalTracker');
const tracker = new SignalTracker();
tracker.registerSignal({
    signalId: '$SIGNAL_ID_2',
    symbol: 'ETHUSDT',
    direction: 'SHORT',
    confidence: 80,
    pattern: { key: 'TEST_PATTERN_2' },
    generatedAt: new Date(),
    expiresAt: new Date(Date.now() + 4 * 60 * 60 * 1000)
});
tracker.registerSignal({
    signalId: '$SIGNAL_ID_3',
    symbol: 'BNBUSDT',
    direction: 'LONG',
    confidence: 70,
    pattern: { key: 'TEST_PATTERN_3' },
    generatedAt: new Date(),
    expiresAt: new Date(Date.now() + 4 * 60 * 60 * 1000)
});
" > /dev/null 2>&1

# TEST 8: Batch Feedback - Valid
run_test "Batch Feedback - Valid" "POST" "/api/feedback/batch" \
    "{\"outcomes\":[{\"signalId\":\"$SIGNAL_ID_2\",\"outcome\":\"win\",\"pnl\":300},{\"signalId\":\"$SIGNAL_ID_3\",\"outcome\":\"loss\",\"pnl\":-150}]}" \
    "200"

# TEST 9: Batch Feedback - Empty array
run_test "Batch Feedback - Empty array" "POST" "/api/feedback/batch" \
    "{\"outcomes\":[]}" \
    "400"

# TEST 10: Batch Feedback - Invalid format
run_test "Batch Feedback - Invalid format" "POST" "/api/feedback/batch" \
    "{\"outcomes\":\"not_an_array\"}" \
    "400"

# TEST 11: Get Feedback Statistics
run_test "Get Feedback Statistics" "GET" "/api/feedback/stats" "" "200"

# TEST 12: Get Signal History - No filters
run_test "Get Signal History - No filters" "GET" "/api/feedback/history" "" "200"

# TEST 13: Get Signal History - With symbol filter
run_test "Get Signal History - Symbol filter" "GET" "/api/feedback/history?symbol=BTCUSDT" "" "200"

# TEST 14: Get Signal History - With status filter
run_test "Get Signal History - Status filter" "GET" "/api/feedback/history?status=closed" "" "200"

# TEST 15: Get Signal History - With limit
run_test "Get Signal History - With limit" "GET" "/api/feedback/history?limit=5" "" "200"

# TEST 16: Get Specific Signal - Valid ID
run_test "Get Specific Signal - Valid" "GET" "/api/feedback/signal/$SIGNAL_ID" "" "200"

# TEST 17: Get Specific Signal - Invalid ID
run_test "Get Specific Signal - Invalid" "GET" "/api/feedback/signal/INVALID_SIGNAL_ID" "" "404"

# TEST 18: Get Signals (verify tracking integration)
run_test "Get Signals with Tracking" "GET" "/api/signals" "" "200"

# Summary
echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║                    TEST SUMMARY                            ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""
echo -e "Total Tests: $test_num"
echo -e "${GREEN}Passed: $PASS${NC}"
echo -e "${RED}Failed: $FAIL${NC}"
echo ""

if [ $FAIL -eq 0 ]; then
    echo -e "${GREEN}🎉 All tests passed!${NC}"
    exit 0
else
    echo -e "${RED}❌ Some tests failed. Please review the output above.${NC}"
    exit 1
fi
