#!/bin/bash

# Deploy via Git Pull on Server
# This method pulls the latest code from GitHub on your DigitalOcean server

set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

SERVER_USER="inverseiq"
SERVER_IP="146.190.233.46"
SERVER_PATH="/home/inverseiq/trading-data-collection-service"
APP_NAME="inverseiq"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Deploying via Git Pull${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

echo -e "${BLUE}Connecting to server and pulling latest code...${NC}"
echo ""

ssh ${SERVER_USER}@${SERVER_IP} << 'ENDSSH'
cd /home/inverseiq/trading-data-collection-service

echo "📥 Pulling latest code from GitHub..."
git pull origin main

echo ""
echo "🔄 Restarting application..."
pm2 restart inverseiq

echo ""
echo "✅ Deployment complete!"
echo ""
echo "📍 Notification page available at:"
echo "   http://146.190.233.46/notifications.html"
echo ""
ENDSSH

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  Deployment Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
