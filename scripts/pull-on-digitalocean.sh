#!/bin/bash

# Pull and Deploy on DigitalOcean
# Usage: ./scripts/pull-on-digitalocean.sh [server-ip]

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo ""
echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║     Pull Latest Changes on DigitalOcean                   ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Get server IP from argument or prompt
SERVER_IP="${1}"
if [ -z "$SERVER_IP" ]; then
    read -p "Enter your DigitalOcean server IP: " SERVER_IP
fi

if [ -z "$SERVER_IP" ]; then
    echo -e "${RED}Error: Server IP is required${NC}"
    exit 1
fi

SSH_USER="${2:-inverseiq}"
PROJECT_DIR="${3:-~/xrypt-service}"

echo -e "${YELLOW}Connecting to $SSH_USER@$SERVER_IP...${NC}"
echo ""

# Execute deployment commands on server
ssh -t "$SSH_USER@$SERVER_IP" "
    set -e
    echo '📂 Navigating to project directory...'
    cd $PROJECT_DIR
    
    echo '📥 Pulling latest changes from GitHub...'
    git pull origin main || git pull origin master
    
    echo '📦 Installing dependencies...'
    npm install --production
    
    echo '🔄 Restarting application...'
    pm2 restart xrypt
    
    echo ''
    echo '✅ Deployment complete!'
    echo ''
    echo '📊 Application status:'
    pm2 status
    
    echo ''
    echo '📝 Recent logs:'
    pm2 logs xrypt --lines 10 --nostream
" || {
    echo ""
    echo -e "${RED}Deployment failed!${NC}"
    echo ""
    echo "Try manually:"
    echo -e "${BLUE}ssh $SSH_USER@$SERVER_IP${NC}"
    echo -e "${BLUE}cd $PROJECT_DIR${NC}"
    echo -e "${BLUE}git pull${NC}"
    echo -e "${BLUE}npm install --production${NC}"
    echo -e "${BLUE}pm2 restart xrypt${NC}"
    exit 1
}

echo ""
echo -e "${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║          DigitalOcean Deployment Complete!                ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo "Your application is now running the latest version!"
echo ""
echo "View logs: ssh $SSH_USER@$SERVER_IP 'pm2 logs xrypt'"
echo ""
