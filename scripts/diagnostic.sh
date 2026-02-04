#!/bin/bash

# ============================================================================
# XRYPT SERVER DIAGNOSTIC SCRIPT
# ============================================================================
# Purpose: Check PM2 status, logs, and server health
# Server: 146.190.233.46
# User: inverseiq

set -e

SERVER_IP="146.190.233.46"
SERVER_USER="inverseiq"
PROJECT_DIR="/opt/trading-data-collection-service"

echo "╔════════════════════════════════════════════════════════════╗"
echo "║        XRYPT SERVER DIAGNOSTIC REPORT                      ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""
echo "Server: $SERVER_IP"
echo "User: $SERVER_USER"
echo "Project: $PROJECT_DIR"
echo ""
echo "═════════════════════════════════════════════════════════════"
echo "1. CHECKING SSH CONNECTION"
echo "═════════════════════════════════════════════════════════════"
echo ""

# Test SSH connection
if ssh -q "$SERVER_USER@$SERVER_IP" "echo '✅ SSH connection successful'" 2>/dev/null; then
    echo "✅ SSH connection established"
    echo ""
else
    echo "❌ Cannot connect via SSH"
    echo "Please check:"
    echo "  • SSH key is installed"
    echo "  • Server is online"
    echo "  • Firewall allows SSH (port 22)"
    echo ""
    exit 1
fi

echo "═════════════════════════════════════════════════════════════"
echo "2. CHECKING PM2 STATUS"
echo "═════════════════════════════════════════════════════════════"
echo ""

ssh "$SERVER_USER@$SERVER_IP" bash << 'ENDSSH'
echo "📊 PM2 Process List:"
echo ""
pm2 list
echo ""

echo "📊 PM2 Process Details:"
echo ""
pm2 show server || echo "⚠️  No 'server' process found"
ENDSSH

echo ""
echo "═════════════════════════════════════════════════════════════"
echo "3. CHECKING APPLICATION LOGS"
echo "═════════════════════════════════════════════════════════════"
echo ""

ssh "$SERVER_USER@$SERVER_IP" bash << 'ENDSSH'
echo "📝 Recent PM2 Logs (last 50 lines):"
echo ""
pm2 logs server --lines 50 --nostream 2>/dev/null || echo "⚠️  No logs available"
ENDSSH

echo ""
echo "═════════════════════════════════════════════════════════════"
echo "4. CHECKING PORT AVAILABILITY"
echo "═════════════════════════════════════════════════════════════"
echo ""

ssh "$SERVER_USER@$SERVER_IP" bash << 'ENDSSH'
echo "🔌 Checking port 3000:"
if netstat -tuln 2>/dev/null | grep -q ":3000 "; then
    echo "✅ Port 3000 is listening"
else
    echo "❌ Port 3000 is NOT listening"
fi
echo ""

echo "🔌 Checking port 80 (HTTP):"
if netstat -tuln 2>/dev/null | grep -q ":80 "; then
    echo "✅ Port 80 is listening (Nginx/proxy)"
else
    echo "ℹ️  Port 80 not listening (may be behind reverse proxy)"
fi
ENDSSH

echo ""
echo "═════════════════════════════════════════════════════════════"
echo "5. CHECKING DISK SPACE"
echo "═════════════════════════════════════════════════════════════"
echo ""

ssh "$SERVER_USER@$SERVER_IP" bash << 'ENDSSH'
df -h / | tail -1 | awk '{printf "Root: %s used, %s available (%s)\n", $3, $4, $5}'
df -h /opt/trading-data-collection-service 2>/dev/null | tail -1 | awk '{printf "Project: %s used, %s available (%s)\n", $3, $4, $5}' || echo "Project directory check skipped"
ENDSSH

echo ""
echo "═════════════════════════════════════════════════════════════"
echo "6. CHECKING API HEALTH"
echo "═════════════════════════════════════════════════════════════"
echo ""

echo "Testing API endpoint..."
if curl -s -m 5 "http://$SERVER_IP:3000/api/health" > /dev/null 2>&1; then
    echo "✅ API is responding"
    echo ""
    echo "API Response:"
    curl -s "http://$SERVER_IP:3000/api/health" | jq . || echo "Response: $(curl -s "$SERVER_IP:3000/api/health")"
else
    echo "❌ API is not responding (timeout or connection refused)"
    echo ""
    echo "Possible reasons:"
    echo "  • Server is not running"
    echo "  • Port 3000 is blocked by firewall"
    echo "  • Application crashed"
fi

echo ""
echo "═════════════════════════════════════════════════════════════"
echo "7. CHECKING NODE PROCESS"
echo "═════════════════════════════════════════════════════════════"
echo ""

ssh "$SERVER_USER@$SERVER_IP" bash << 'ENDSSH'
echo "Looking for node processes:"
ps aux | grep -i node | grep -v grep || echo "⚠️  No node processes found"
ENDSSH

echo ""
echo "═════════════════════════════════════════════════════════════"
echo "8. CHECKING APPLICATION FILES"
echo "═════════════════════════════════════════════════════════════"
echo ""

ssh "$SERVER_USER@$SERVER_IP" bash << "ENDSSH"
echo "Checking project directory:"
if [ -d "$PROJECT_DIR" ]; then
    echo "✅ Project directory exists"
    echo ""
    echo "Key files:"
    ls -lh "$PROJECT_DIR"/server.js 2>/dev/null | awk '{print "  server.js:", $5}' || echo "  ❌ server.js not found"
    ls -lh "$PROJECT_DIR"/package.json 2>/dev/null | awk '{print "  package.json:", $5}' || echo "  ❌ package.json not found"
    ls -lh "$PROJECT_DIR"/ecosystem.config.js 2>/dev/null | awk '{print "  ecosystem.config.js:", $5}' || echo "  ❌ ecosystem.config.js not found"
else
    echo "❌ Project directory not found at $PROJECT_DIR"
fi
ENDSSH

echo ""
echo "═════════════════════════════════════════════════════════════"
echo "9. RECOMMENDATIONS"
echo "═════════════════════════════════════════════════════════════"
echo ""

echo "If the server is NOT running, try these commands:"
echo ""
echo "SSH into server:"
echo "  ssh inverseiq@$SERVER_IP"
echo ""
echo "Then run:"
echo "  cd $PROJECT_DIR"
echo "  pm2 status"
echo "  pm2 logs server --lines 100"
echo ""
echo "To restart the server:"
echo "  pm2 restart server"
echo ""
echo "To start from ecosystem config:"
echo "  pm2 start ecosystem.config.js --only server"
echo ""
echo "To kill and restart:"
echo "  pm2 kill"
echo "  pm2 start ecosystem.config.js"
echo ""
echo "To check for errors:"
echo "  npm install --production"
echo "  node server.js"
echo ""

echo "═════════════════════════════════════════════════════════════"
echo "END OF DIAGNOSTIC REPORT"
echo "═════════════════════════════════════════════════════════════"
[paste the entire script above here]
