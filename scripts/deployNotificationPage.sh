#!/bin/bash

# DigitalOcean Deployment Script for Notification Page
# This script uploads the notification page to your production server

set -e  # Exit on error

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Server configuration
SERVER_USER="inverseiq"
SERVER_IP="146.190.233.46"
SERVER_PATH="/home/inverseiq/trading-data-collection-service"
APP_NAME="inverseiq"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Deploying Notification Page${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Check if notifications.html exists
if [ ! -f "public/notifications.html" ]; then
    echo -e "${RED}Error: public/notifications.html not found!${NC}"
    exit 1
fi

echo -e "${GREEN}✓${NC} Found notification page"

# Step 1: Upload notification page
echo ""
echo -e "${BLUE}Step 1: Uploading notification page...${NC}"
scp public/notifications.html ${SERVER_USER}@${SERVER_IP}:${SERVER_PATH}/public/

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓${NC} Notification page uploaded successfully"
else
    echo -e "${RED}✗${NC} Failed to upload notification page"
    exit 1
fi

# Step 2: Upload test report (optional)
echo ""
echo -e "${BLUE}Step 2: Uploading test report...${NC}"
if [ -f "NOTIFICATION_PAGE_TEST_REPORT.md" ]; then
    scp NOTIFICATION_PAGE_TEST_REPORT.md ${SERVER_USER}@${SERVER_IP}:${SERVER_PATH}/
    echo -e "${GREEN}✓${NC} Test report uploaded"
else
    echo -e "${BLUE}ℹ${NC} Test report not found, skipping"
fi

# Step 3: Restart application
echo ""
echo -e "${BLUE}Step 3: Restarting application...${NC}"
ssh ${SERVER_USER}@${SERVER_IP} "cd ${SERVER_PATH} && pm2 restart ${APP_NAME}"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓${NC} Application restarted successfully"
else
    echo -e "${RED}✗${NC} Failed to restart application"
    exit 1
fi

# Step 4: Verify deployment
echo ""
echo -e "${BLUE}Step 4: Verifying deployment...${NC}"
sleep 2

# Test if page is accessible
HTTP_CODE=$(ssh ${SERVER_USER}@${SERVER_IP} "curl -s -o /dev/null -w '%{http_code}' http://localhost:3000/notifications.html")

if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✓${NC} Notification page is accessible (HTTP $HTTP_CODE)"
else
    echo -e "${RED}✗${NC} Page returned HTTP $HTTP_CODE"
fi

# Step 5: Display access information
echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  Deployment Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "📍 ${BLUE}Access your notification page at:${NC}"
echo -e "   http://${SERVER_IP}/notifications.html"
echo ""
echo -e "🔗 ${BLUE}If you have a domain configured:${NC}"
echo -e "   https://yourdomain.com/notifications.html"
echo ""
echo -e "📊 ${BLUE}View server logs:${NC}"
echo -e "   ssh ${SERVER_USER}@${SERVER_IP} 'pm2 logs ${APP_NAME}'"
echo ""
echo -e "🔄 ${BLUE}Restart if needed:${NC}"
echo -e "   ssh ${SERVER_USER}@${SERVER_IP} 'pm2 restart ${APP_NAME}'"
echo ""
