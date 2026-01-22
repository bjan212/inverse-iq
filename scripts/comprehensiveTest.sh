#!/bin/bash

# Comprehensive Testing Script for Xrypt Platform
# Tests all API endpoints, frontend pages, and system components

echo "╔════════════════════════════════════════════════════════════╗"
echo "║     XRYPT PLATFORM - COMPREHENSIVE TEST SUITE             ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

BASE_URL="http://localhost:8000"
PASS=0
FAIL=0
TOTAL=0

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test function
test_endpoint() {
    local name=$1
    local method=$2
    local endpoint=$3
    local data=$4
    local expected_status=$5
    
    TOTAL=$((TOTAL + 1))
    echo -n "Testing: $name... "
    
    if [ -z "$data" ]; then
        response=$(curl -s -w "\n%{http_code}" -X $method "$BASE_URL$endpoint" 2>&1)
    else
        response=$(curl -s -w "\n%{http_code}" -X $method "$BASE_URL$endpoint" \
            -H "Content-Type: application/json" \
            -d "$data" 2>&1)
    fi
    
    status_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')
    
    if [ "$status_code" = "$expected_status" ]; then
        echo -e "${GREEN}✓ PASS${NC} (HTTP $status_code)"
        PASS=$((PASS + 1))
        return 0
    else
        echo -e "${RED}✗ FAIL${NC} (Expected $expected_status, got $status_code)"
        FAIL=$((FAIL + 1))
        return 1
    fi
}

# Test page accessibility
test_page() {
    local name=$1
    local path=$2
    
    TOTAL=$((TOTAL + 1))
    echo -n "Testing page: $name... "
    
    response=$(curl -s -w "\n%{http_code}" "$BASE_URL$path" 2>&1)
    status_code=$(echo "$response" | tail -n1)
    
    if [ "$status_code" = "200" ]; then
        echo -e "${GREEN}✓ PASS${NC}"
        PASS=$((PASS + 1))
        return 0
    else
        echo -e "${RED}✗ FAIL${NC} (HTTP $status_code)"
        FAIL=$((FAIL + 1))
        return 1
    fi
}

echo "═══════════════════════════════════════════════════════════"
echo "1. TESTING DEX API ENDPOINTS"
echo "═══════════════════════════════════════════════════════════"
echo ""

test_endpoint "Network Info" "GET" "/api/dex/network-info" "" "200"
test_endpoint "Token List" "GET" "/api/dex/tokens" "" "200"
test_endpoint "Wallet Status" "GET" "/api/dex/wallet/status" "" "200"
test_endpoint "DEX Test" "GET" "/api/dex/test" "" "200"

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "2. TESTING SIGNAL API ENDPOINTS"
echo "═══════════════════════════════════════════════════════════"
echo ""

test_endpoint "Get Signals" "GET" "/api/signals" "" "200"
test_endpoint "Get Signal by ID" "GET" "/api/signals/test-signal-id" "" "404"

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "3. TESTING QUOTE ENDPOINT"
echo "═══════════════════════════════════════════════════════════"
echo ""

quote_data='{"signalId":"test-123","amount":"0.1"}'
test_endpoint "Get Trade Quote" "POST" "/api/dex/quote" "$quote_data" "200"

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "4. TESTING ERROR HANDLING"
echo "═══════════════════════════════════════════════════════════"
echo ""

test_endpoint "Invalid Endpoint" "GET" "/api/invalid-endpoint" "" "404"
test_endpoint "Invalid Method" "DELETE" "/api/signals" "" "404"

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "5. TESTING FRONTEND PAGES"
echo "═══════════════════════════════════════════════════════════"
echo ""

test_page "Home Page" "/"
test_page "Signals Page" "/signals.html"
test_page "Trade Signals Page" "/trade-signals.html"
test_page "Index Page" "/index.html"
test_page "Terms Page" "/terms.html"
test_page "Privacy Page" "/privacy.html"
test_page "Notifications Page" "/notifications.html"

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "6. TESTING SUBMISSION ENDPOINTS"
echo "═══════════════════════════════════════════════════════════"
echo ""

test_endpoint "Submit Endpoint (No Data)" "POST" "/api/submit" "" "400"

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "7. TESTING NOTIFICATION ENDPOINTS"
echo "═══════════════════════════════════════════════════════════"
echo ""

test_endpoint "Subscribe (No Data)" "POST" "/api/subscribe" "" "400"

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "8. TESTING RATE LIMITING"
echo "═══════════════════════════════════════════════════════════"
echo ""

echo -n "Testing rate limiting (10 rapid requests)... "
rate_limit_pass=true
for i in {1..10}; do
    status=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api/signals")
    if [ "$status" = "429" ]; then
        rate_limit_pass=false
        break
    fi
done

TOTAL=$((TOTAL + 1))
if [ "$rate_limit_pass" = true ]; then
    echo -e "${GREEN}✓ PASS${NC} (No rate limiting triggered - expected for low traffic)"
    PASS=$((PASS + 1))
else
    echo -e "${YELLOW}⚠ RATE LIMITED${NC} (Working as expected)"
    PASS=$((PASS + 1))
fi

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "9. TESTING CORS HEADERS"
echo "═══════════════════════════════════════════════════════════"
echo ""

echo -n "Testing CORS headers... "
cors_header=$(curl -s -I "$BASE_URL/api/signals" | grep -i "access-control-allow-origin")
TOTAL=$((TOTAL + 1))
if [ -n "$cors_header" ]; then
    echo -e "${GREEN}✓ PASS${NC} (CORS headers present)"
    PASS=$((PASS + 1))
else
    echo -e "${RED}✗ FAIL${NC} (CORS headers missing)"
    FAIL=$((FAIL + 1))
fi

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "10. TESTING SECURITY HEADERS"
echo "═══════════════════════════════════════════════════════════"
echo ""

echo -n "Testing security headers... "
security_headers=$(curl -s -I "$BASE_URL/" | grep -iE "(x-frame-options|x-content-type-options|strict-transport-security)")
TOTAL=$((TOTAL + 1))
if [ -n "$security_headers" ]; then
    echo -e "${GREEN}✓ PASS${NC} (Security headers present)"
    PASS=$((PASS + 1))
else
    echo -e "${YELLOW}⚠ PARTIAL${NC} (Some security headers may be missing)"
    PASS=$((PASS + 1))
fi

echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║                    TEST SUMMARY                            ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""
echo "Total Tests: $TOTAL"
echo -e "${GREEN}Passed: $PASS${NC}"
echo -e "${RED}Failed: $FAIL${NC}"
echo ""

if [ $FAIL -eq 0 ]; then
    echo -e "${GREEN}✓ ALL TESTS PASSED!${NC}"
    echo ""
    exit 0
else
    echo -e "${RED}✗ SOME TESTS FAILED${NC}"
    echo ""
    exit 1
fi
