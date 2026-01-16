#!/bin/bash

# Xrypt Trading Service - Quick Online Deployment Script
# This script helps you deploy to various platforms

echo "╔════════════════════════════════════════════════════════════╗"
echo "║     Xrypt Trading Service - Online Deployment Helper      ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}Choose your deployment platform:${NC}"
echo ""
echo "1) DigitalOcean (Full control, $6-12/month)"
echo "2) Railway (Easiest, Free tier available)"
echo "3) Render (Free tier available)"
echo "4) Heroku (Classic option)"
echo "5) Just prepare files for manual upload"
echo ""
read -p "Enter your choice (1-5): " choice

case $choice in
  1)
    echo ""
    echo -e "${GREEN}=== DigitalOcean Deployment ===${NC}"
    echo ""
    echo "Steps to deploy on DigitalOcean:"
    echo ""
    echo "1. Create account at https://digitalocean.com"
    echo "2. Create Ubuntu 22.04 droplet"
    echo "3. Note your droplet IP address"
    echo ""
    read -p "Enter your droplet IP address: " droplet_ip
    
    if [ -z "$droplet_ip" ]; then
      echo "No IP provided. Exiting."
      exit 1
    fi
    
    echo ""
    echo -e "${YELLOW}Creating deployment package...${NC}"
    
    # Create tarball
    tar -czf xrypt-deploy.tar.gz \
      --exclude='node_modules' \
      --exclude='.git' \
      --exclude='*.log' \
      --exclude='data/*.json' \
      .
    
    echo -e "${GREEN}✅ Package created: xrypt-deploy.tar.gz${NC}"
    echo ""
    echo "Now run these commands:"
    echo ""
    echo -e "${BLUE}# Upload to server:${NC}"
    echo "scp xrypt-deploy.tar.gz root@$droplet_ip:~/"
    echo ""
    echo -e "${BLUE}# SSH into server:${NC}"
    echo "ssh root@$droplet_ip"
    echo ""
    echo -e "${BLUE}# On server, run:${NC}"
    echo "curl -fsSL https://deb.nodesource.com/setup_18.x | bash -"
    echo "apt install -y nodejs nginx certbot python3-certbot-nginx"
    echo "npm install -g pm2"
    echo "tar -xzf xrypt-deploy.tar.gz"
    echo "npm install --production"
    echo "pm2 start server.js --name xrypt"
    echo "pm2 startup && pm2 save"
    echo ""
    echo -e "${GREEN}Your site will be live at: http://$droplet_ip${NC}"
    echo ""
    echo "For full setup guide, see: DIGITALOCEAN_DEPLOYMENT_GUIDE.md"
    ;;
    
  2)
    echo ""
    echo -e "${GREEN}=== Railway Deployment ===${NC}"
    echo ""
    echo "Steps to deploy on Railway:"
    echo ""
    echo "1. Go to https://railway.app"
    echo "2. Sign in with GitHub"
    echo "3. Click 'New Project' → 'Deploy from GitHub repo'"
    echo "4. Select this repository"
    echo "5. Railway will auto-deploy!"
    echo ""
    echo -e "${YELLOW}Preparing for Railway...${NC}"
    
    # Check if git is initialized
    if [ ! -d .git ]; then
      echo "Initializing git repository..."
      git init
      git add .
      git commit -m "Initial commit for Railway deployment"
    fi
    
    echo ""
    echo -e "${GREEN}✅ Ready for Railway!${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Push to GitHub: git push origin main"
    echo "2. Connect Railway to your GitHub repo"
    echo "3. Deploy automatically!"
    ;;
    
  3)
    echo ""
    echo -e "${GREEN}=== Render Deployment ===${NC}"
    echo ""
    echo "Steps to deploy on Render:"
    echo ""
    echo "1. Go to https://render.com"
    echo "2. Sign up and connect GitHub"
    echo "3. Click 'New +' → 'Web Service'"
    echo "4. Select this repository"
    echo "5. Configure:"
    echo "   - Build Command: npm install"
    echo "   - Start Command: npm start"
    echo "6. Click 'Create Web Service'"
    echo ""
    echo -e "${YELLOW}Preparing for Render...${NC}"
    
    # Check if git is initialized
    if [ ! -d .git ]; then
      echo "Initializing git repository..."
      git init
      git add .
      git commit -m "Initial commit for Render deployment"
    fi
    
    echo ""
    echo -e "${GREEN}✅ Ready for Render!${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Push to GitHub: git push origin main"
    echo "2. Connect Render to your GitHub repo"
    echo "3. Deploy!"
    ;;
    
  4)
    echo ""
    echo -e "${GREEN}=== Heroku Deployment ===${NC}"
    echo ""
    
    # Check if Heroku CLI is installed
    if ! command -v heroku &> /dev/null; then
      echo -e "${YELLOW}Heroku CLI not found. Installing...${NC}"
      echo ""
      echo "Run: brew tap heroku/brew && brew install heroku"
      echo ""
      echo "Then run this script again."
      exit 1
    fi
    
    echo "Deploying to Heroku..."
    echo ""
    
    # Check if git is initialized
    if [ ! -d .git ]; then
      git init
      git add .
      git commit -m "Initial commit for Heroku"
    fi
    
    # Create Heroku app
    read -p "Enter app name (or press Enter for random): " app_name
    
    if [ -z "$app_name" ]; then
      heroku create
    else
      heroku create $app_name
    fi
    
    # Deploy
    git push heroku main
    
    echo ""
    echo -e "${GREEN}✅ Deployed to Heroku!${NC}"
    heroku open
    ;;
    
  5)
    echo ""
    echo -e "${GREEN}=== Preparing Files for Manual Upload ===${NC}"
    echo ""
    echo -e "${YELLOW}Creating deployment package...${NC}"
    
    # Create tarball
    tar -czf xrypt-deploy.tar.gz \
      --exclude='node_modules' \
      --exclude='.git' \
      --exclude='*.log' \
      --exclude='data/*.json' \
      .
    
    echo ""
    echo -e "${GREEN}✅ Package created: xrypt-deploy.tar.gz${NC}"
    echo ""
    echo "Upload this file to your server and extract with:"
    echo "tar -xzf xrypt-deploy.tar.gz"
    echo ""
    echo "Then run:"
    echo "npm install --production"
    echo "npm start"
    ;;
    
  *)
    echo "Invalid choice. Exiting."
    exit 1
    ;;
esac

echo ""
echo -e "${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║              Deployment preparation complete!              ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo "For detailed guides, see:"
echo "  - QUICK_START_GUIDE.md"
echo "  - DIGITALOCEAN_DEPLOYMENT_GUIDE.md"
echo "  - PRODUCTION_DEPLOYMENT_GUIDE.md"
echo ""
