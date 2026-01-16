#!/bin/bash

# Xrypt Trading Service - GitHub to DigitalOcean Deployment Script
# This script commits changes to GitHub and deploys to DigitalOcean

set -e  # Exit on error

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo ""
echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   Xrypt Trading Service - GitHub to DigitalOcean Deploy   ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Step 1: Get commit message
echo -e "${YELLOW}Step 1: Preparing Git Commit${NC}"
echo ""
read -p "Enter commit message (or press Enter for default): " commit_msg

if [ -z "$commit_msg" ]; then
    commit_msg="Update: $(date '+%Y-%m-%d %H:%M:%S')"
fi

echo -e "${GREEN}✓ Commit message: $commit_msg${NC}"
echo ""

# Step 2: Add all changes
echo -e "${YELLOW}Step 2: Adding Changes to Git${NC}"
echo ""

# Add all files
git add -A

# Show what will be committed
echo -e "${BLUE}Files to be committed:${NC}"
git status --short
echo ""

read -p "Continue with commit? (y/n): " confirm
if [ "$confirm" != "y" ]; then
    echo -e "${RED}Deployment cancelled.${NC}"
    exit 1
fi

# Step 3: Commit changes
echo ""
echo -e "${YELLOW}Step 3: Committing Changes${NC}"
echo ""

git commit -m "$commit_msg" || {
    echo -e "${YELLOW}No changes to commit or commit failed${NC}"
}

echo -e "${GREEN}✓ Changes committed${NC}"
echo ""

# Step 4: Push to GitHub
echo -e "${YELLOW}Step 4: Pushing to GitHub${NC}"
echo ""

git push origin main || git push origin master || {
    echo -e "${RED}Failed to push to GitHub${NC}"
    echo "Please check your GitHub credentials and try again"
    exit 1
}

echo -e "${GREEN}✓ Pushed to GitHub successfully${NC}"
echo ""

# Step 5: Get DigitalOcean server details
echo -e "${YELLOW}Step 5: DigitalOcean Deployment${NC}"
echo ""

read -p "Enter your DigitalOcean server IP (or press Enter to skip): " server_ip

if [ -z "$server_ip" ]; then
    echo ""
    echo -e "${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║          GitHub Update Complete!                          ║${NC}"
    echo -e "${GREEN}╚════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo "Your changes have been pushed to GitHub."
    echo ""
    echo "To deploy to DigitalOcean manually, SSH into your server and run:"
    echo ""
    echo -e "${BLUE}cd ~/xrypt-service${NC}"
    echo -e "${BLUE}git pull origin main${NC}"
    echo -e "${BLUE}npm install --production${NC}"
    echo -e "${BLUE}pm2 restart xrypt${NC}"
    echo ""
    exit 0
fi

read -p "Enter SSH username (default: inverseiq): " ssh_user
ssh_user=${ssh_user:-inverseiq}

read -p "Enter project directory on server (default: ~/xrypt-service): " project_dir
project_dir=${project_dir:-~/xrypt-service}

# Step 6: Deploy to DigitalOcean
echo ""
echo -e "${YELLOW}Step 6: Deploying to DigitalOcean${NC}"
echo ""

echo -e "${BLUE}Connecting to $ssh_user@$server_ip...${NC}"
echo ""

# Create deployment commands
deploy_commands="
cd $project_dir && \
echo '📥 Pulling latest changes from GitHub...' && \
git pull origin main && \
echo '📦 Installing dependencies...' && \
npm install --production && \
echo '🔄 Restarting application...' && \
pm2 restart xrypt && \
echo '✅ Deployment complete!' && \
pm2 status
"

# Execute deployment on server
ssh -t "$ssh_user@$server_ip" "$deploy_commands" || {
    echo ""
    echo -e "${RED}Deployment to DigitalOcean failed${NC}"
    echo ""
    echo "Please try manually:"
    echo ""
    echo -e "${BLUE}ssh $ssh_user@$server_ip${NC}"
    echo -e "${BLUE}cd $project_dir${NC}"
    echo -e "${BLUE}git pull origin main${NC}"
    echo -e "${BLUE}npm install --production${NC}"
    echo -e "${BLUE}pm2 restart xrypt${NC}"
    echo ""
    exit 1
}

# Step 7: Success!
echo ""
echo -e "${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║          Deployment Successful!                            ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${GREEN}✓ Changes committed to GitHub${NC}"
echo -e "${GREEN}✓ Pushed to GitHub repository${NC}"
echo -e "${GREEN}✓ Deployed to DigitalOcean server${NC}"
echo -e "${GREEN}✓ Application restarted${NC}"
echo ""
echo "Your application is now live at:"
echo -e "${BLUE}http://$server_ip${NC}"
echo ""
echo "To view logs:"
echo -e "${BLUE}ssh $ssh_user@$server_ip${NC}"
echo -e "${BLUE}pm2 logs xrypt${NC}"
echo ""
