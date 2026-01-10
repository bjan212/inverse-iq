#!/bin/bash

# Comprehensive API Testing Script
# Tests all endpoints and generates detailed report

BASE_URL="http://localhost:8000"
RESULTS_FILE="test_results_$(date +%Y%m%d_%H%M%S).txt"

echo "==================================="
echo "COMPREHENSIVE API TESTING"
echo "==================================="
echo ""
echo "Base URL: $BASE_URL"
echo "Results will be saved to: $RESULTS_FILE"
echo ""

# Function to test endpoint
test_endpoint() {
    local method=$1
    local endpoint=$2
    local data=$3
    local description=$4
    
    echo "Testing: $description"
    echo "Method: $method $endpoint"
    
    if [ "$method" = "GET" ]; then
        response=$(curl -s -w "\nHTTP_CODE:%{http_code}" "$BASE_URL$endpoint")
    elif [ "$method" = "POST" ]; then
        response=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X POST -H "Content-Type: application/json" -d "$data" "$BASE_URL$endpoint")
    elif [ "$method" = "PUT" ]; then
        response=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X PUT -H "Content-Type: application/json" -d "$data" "$BASE_URL$endpoint")
    elif [ "$method" = "DELETE" ]; then
        response=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X DELETE "$BASE_URL$endpoint")
    fi
    
    http_code=$(echo "$response" | grep "HTTP_CODE" | cut -d: -f2)
    body=$(echo "$response" | sed '/HTTP_CODE/d')
    
    echo "HTTP Code: $http_code"
    echo "Response: $body" | head -c 200
    echo ""
    echo "---"
    echo ""
}

# 1. Health & Status Tests
echo "### 1. HEALTH & STATUS ENDPOINTS ###"
test_endpoint "GET" "/api/health" "" "Health Check"
test_endpoint "GET" "/api/ai/stats" "" "AI Statistics"

# 2. Signals Tests
echo "### 2. SIGNALS ENDPOINTS ###"
test_endpoint "GET" "/api/signals" "" "Get Signals"
test_endpoint "GET" "/api/signals?symbols=BTCUSDT,ETHUSDT" "" "Get Signals with Symbols Filter"

# 3. Reference Data Tests
echo "### 3. REFERENCE DATA ENDPOINTS ###"
test_endpoint "GET" "/api/exchanges" "" "Get Supported Exchanges"
test_endpoint "GET" "/api/networks" "" "Get Supported Networks"
test_endpoint "GET" "/api/requirements" "" "Get Submission Requirements"

# 4. Notification Tests
echo "### 4. NOTIFICATION ENDPOINTS ###"
test_endpoint "POST" "/api/notifications/subscribe" '{"email":"test@example.com","telegram":"@testuser","preferences":{"symbols":["BTCUSDT"],"minConfidence":70,"notificationMethods":["email"]}}' "Subscribe to Notifications"
test_endpoint "GET" "/api/notifications/stats" "" "Get Notification Stats"

# 5. Feedback Tests
echo "### 5. FEEDBACK ENDPOINTS ###"
test_endpoint "GET" "/api/feedback/stats" "" "Get Feedback Stats"
test_endpoint "GET" "/api/feedback/history" "" "Get Feedback History"

# 6. Data Submission Tests
echo "### 6. DATA SUBMISSION ENDPOINTS ###"
test_endpoint "POST" "/api/submit" '{"traderId":"test123","exchange":"binance","trades":[{"symbol":"BTCUSDT","side":"LONG","entryPrice":50000,"exitPrice":49000,"pnl":-1000,"entryTime":"2026-01-10T10:00:00Z","exitTime":"2026-01-10T11:00:00Z"}],"paymentMethod":"crypto","walletAddress":"0x123...","network":"ethereum"}' "Submit Trade Data"

# 7. Frontend Pages Tests
echo "### 7. FRONTEND PAGES ###"
test_endpoint "GET" "/" "" "Home Page"
test_endpoint "GET" "/signals.html" "" "Signals Page"
test_endpoint "GET" "/get-paid-for-data.html" "" "Get Paid Page"
test_endpoint "GET" "/terms.html" "" "Terms Page"
test_endpoint "GET" "/privacy.html" "" "Privacy Page"

# 8. Error Cases
echo "### 8. ERROR HANDLING TESTS ###"
test_endpoint "GET" "/api/nonexistent" "" "Non-existent Endpoint"
test_endpoint "POST" "/api/submit" '{"invalid":"data"}' "Invalid Submission Data"
test_endpoint "POST" "/api/notifications/subscribe" '{"email":"invalid-email"}' "Invalid Email Format"

echo "==================================="
echo "TESTING COMPLETE"
echo "==================================="
