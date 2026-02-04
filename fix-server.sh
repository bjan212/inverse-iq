#!/bin/bash
echo "🔧 Fixing server dependencies..."
cd /opt/trading-data-collection-service
npm install ethers@5.7.2
pm2 restart server
echo "✅ Server fixed! Checking logs..."
pm2 logs server --lines 30
