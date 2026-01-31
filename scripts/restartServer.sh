#!/bin/bash

# Restart Server Script
# This script stops the current server and restarts it

echo "🔄 Restarting server..."

# Find and kill the server process
SERVER_PID=$(ps aux | grep "node.*server.js" | grep -v grep | awk '{print $2}')

if [ -n "$SERVER_PID" ]; then
    echo "📍 Found server running with PID: $SERVER_PID"
    echo "🛑 Stopping server..."
    kill $SERVER_PID
    sleep 2
    echo "✅ Server stopped"
else
    echo "ℹ️  No server process found"
fi

# Start the server
echo "🚀 Starting server..."
nohup node server.js > logs/server.log 2>&1 &
NEW_PID=$!

echo "✅ Server started with PID: $NEW_PID"
echo "📝 Logs are being written to logs/server.log"
echo ""
echo "To view logs in real-time:"
echo "  tail -f logs/server.log"
echo ""
echo "To stop the server:"
echo "  kill $NEW_PID"
