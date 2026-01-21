Zidefmg
#!/bin/bash

# Quick GitHub Push Script (Non-Interactive)
# This script automatically commits and pushes all changes to GitHub

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo ""
echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║          Quick GitHub Push - Automated                    ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Get commit message from argument or use default
COMMIT_MSG="${1:-Update: $(date '+%Y-%m-%d %H:%M:%S')}"

echo -e "${YELLOW}📝 Commit message: $COMMIT_MSG${NC}"
echo ""

# Add all changes
echo -e "${YELLOW}📦 Adding all changes...${NC}"
git add -A

# Show status
echo ""
echo -e "${BLUE}Files to be committed:${NC}"
git status --short
echo ""

# Commit
echo -e "${YELLOW}💾 Committing changes...${NC}"
if git commit -m "$COMMIT_MSG"; then
    echo -e "${GREEN}✓ Changes committed${NC}"
else
    echo -e "${YELLOW}⚠ No changes to commit${NC}"
fi
echo ""

# Push to GitHub
echo -e "${YELLOW}🚀 Pushing to GitHub...${NC}"
if git push origin main 2>/dev/null || git push origin master 2>/dev/null; then
    echo -e "${GREEN}✓ Successfully pushed to GitHub!${NC}"
else
    echo -e "${RED}✗ Failed to push to GitHub${NC}"
    echo ""
    echo "Possible issues:"
    echo "1. Check your internet connection"
    echo "2. Verify GitHub credentials"
    echo "3. Make sure you have push access to the repository"
    exit 1
fi

echo ""
echo -e "${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║          GitHub Update Complete!                          ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo "Your changes have been pushed to GitHub."
echo ""
echo "To deploy to DigitalOcean, run:"
echo -e "${BLUE}ssh inverseiq@YOUR_SERVER_IP 'cd ~/xrypt-service && git pull && npm install --production && pm2 restart xrypt'${NC}"
echo ""
