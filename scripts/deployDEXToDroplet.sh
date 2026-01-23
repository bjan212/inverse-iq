#!/bin/bash

# ============================================
# DEX Trading Deployment Script
# ============================================
# Purpose: Deploy DEX trading features to DigitalOcean droplet
# Created: December 2024
# Usage: ./scripts/deployDEXToDroplet.sh [SERVER_IP]

set -e  # Exit on error

# ============================================
# CONFIGURATION
# ============================================

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default server configuration
DEFAULT_SERVER_IP="146.190.233.46"
SERVER_USER="root"
SERVER_DIR="/opt/trading-data-collection-service"
BACKUP_DIR="/opt/backups"

# Get server IP from argument or use default
SERVER_IP="${1:-$DEFAULT_SERVER_IP}"

# ============================================
# HELPER FUNCTIONS
# ============================================

print_header() {
    echo -e "\n${BLUE}============================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}============================================${NC}\n"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ $1${NC}"
}

# ============================================
# PRE-DEPLOYMENT CHECKS
# ============================================

print_header "PRE-DEPLOYMENT CHECKS"

# Check if we're in the correct directory
if [ ! -f "package.json" ]; then
    print_error "package.json not found. Please run this script from the project root."
    exit 1
fi
print_success "Project directory verified"

# Check if server.js exists
if [ ! -f "server.js" ]; then
    print_error "server.js not found"
    exit 1
fi
print_success "server.js found"

# Check if DEX files exist
if [ ! -d "src/dex" ]; then
    print_error "src/dex directory not found"
    exit 1
fi
print_success "DEX directory found"

# Check if .env.dex.production exists
if [ ! -f ".env.dex.production" ]; then
    print_error ".env.dex.production not found"
    exit 1
fi
print_success "Production environment file found"

# Check SSH connection
print_info "Testing SSH connection to $SERVER_USER@$SERVER_IP..."
if ssh -o ConnectTimeout=5 -o BatchMode=yes $SERVER_USER@$SERVER_IP exit 2>/dev/null; then
    print_success "SSH connection successful"
else
    print_error "Cannot connect to server. Please check:"
    echo "  1. Server IP is correct: $SERVER_IP"
    echo "  2. SSH key is configured"
    echo "  3. Server is running"
    exit 1
fi

# ============================================
# CREATE DEPLOYMENT PACKAGE
# ============================================

print_header "CREATING DEPLOYMENT PACKAGE"

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
PACKAGE_NAME="dex-deployment-${TIMESTAMP}.tar.gz"

print_info "Creating deployment package: $PACKAGE_NAME"

# Create package excluding unnecessary files
tar -czf "$PACKAGE_NAME" \
    --exclude='node_modules' \
    --exclude='.git' \
    --exclude='*.log' \
    --exclude='logs/*' \
    --exclude='data/*.json' \
    --exclude='backups/*' \
    --exclude='.cache*' \
    --exclude='*.tar.gz' \
    --exclude='.DS_Store' \
    .

if [ -f "$PACKAGE_NAME" ]; then
    PACKAGE_SIZE=$(du -h "$PACKAGE_NAME" | cut -f1)
    print_success "Package created: $PACKAGE_NAME ($PACKAGE_SIZE)"
else
    print_error "Failed to create deployment package"
    exit 1
fi

# ============================================
# UPLOAD TO SERVER
# ============================================

print_header "UPLOADING TO SERVER"

print_info "Uploading $PACKAGE_NAME to $SERVER_USER@$SERVER_IP..."

if scp "$PACKAGE_NAME" "$SERVER_USER@$SERVER_IP:~/"; then
    print_success "Upload successful"
else
    print_error "Upload failed"
    rm -f "$PACKAGE_NAME"
    exit 1
fi

# Clean up local package
rm -f "$PACKAGE_NAME"
print_success "Local package cleaned up"

# ============================================
# DEPLOY ON SERVER
# ============================================

print_header "DEPLOYING ON SERVER"

ssh "$SERVER_USER@$SERVER_IP" bash << 'ENDSSH'
set -e

# Colors for remote output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_success() { echo -e "${GREEN}✓ $1${NC}"; }
print_error() { echo -e "${RED}✗ $1${NC}"; }
print_info() { echo -e "${BLUE}ℹ $1${NC}"; }

# Get the package name (most recent dex-deployment file)
PACKAGE=$(ls -t ~/dex-deployment-*.tar.gz 2>/dev/null | head -1)

if [ -z "$PACKAGE" ]; then
    print_error "Deployment package not found"
    exit 1
fi

print_info "Found package: $(basename $PACKAGE)"

# Create backup directory
mkdir -p /opt/backups
BACKUP_NAME="backup-$(date +%Y%m%d_%H%M%S).tar.gz"

# Backup current installation if it exists
if [ -d /opt/trading-data-collection-service ]; then
    print_info "Creating backup of current installation..."
    cd /opt
    tar -czf "backups/$BACKUP_NAME" trading-data-collection-service 2>/dev/null || true
    print_success "Backup created: $BACKUP_NAME"
fi

# Create/update project directory
mkdir -p /opt/trading-data-collection-service
cd /opt/trading-data-collection-service

# Extract deployment package
print_info "Extracting deployment package..."
tar -xzf "$PACKAGE"
print_success "Package extracted"

# Check if .env exists, if not create from template
if [ ! -f .env ]; then
    print_info "Creating .env from .env.dex.production..."
    cp .env.dex.production .env
    print_success ".env created"
else
    print_info "Merging new DEX variables into existing .env..."
    
    # Backup existing .env
    cp .env .env.backup
    
    # Add DEX variables if they don't exist
    grep -q "ETHEREUM_RPC_URL" .env || cat >> .env << 'EOF'

# ============================================
# DEX TRADING CONFIGURATION (Added by deployment)
# ============================================

# RPC Endpoints (Free tier - replace with your API keys for better performance)
ETHEREUM_RPC_URL=https://eth.llamarpc.com
BSC_RPC_URL=https://bsc-dataseed.binance.org/
ARBITRUM_RPC_URL=https://arb1.arbitrum.io/rpc
POLYGON_RPC_URL=https://polygon-rpc.com

# DEX Protocol Settings
UNISWAP_ENABLED=true
PANCAKESWAP_ENABLED=true
DEX_SLIPPAGE_TOLERANCE=0.01
DEX_TRANSACTION_DEADLINE=600
DEX_MIN_LIQUIDITY=100000

# Security
SIMULATE_TRANSACTIONS=true
MAX_TRADE_SIZE=10000
EOF
    print_success "DEX variables added to .env"
fi

# Install/update dependencies
print_info "Installing dependencies..."
if npm install --production 2>&1 | grep -q "added\|updated"; then
    print_success "Dependencies installed"
else
    print_success "Dependencies up to date"
fi

# Check if PM2 is installed
if ! command -v pm2 &> /dev/null; then
    print_info "Installing PM2..."
    npm install -g pm2
    print_success "PM2 installed"
fi

# Stop existing process
print_info "Stopping existing application..."
pm2 stop server 2>/dev/null || true
pm2 delete server 2>/dev/null || true
print_success "Existing process stopped"

# Start application with PM2
print_info "Starting application with PM2..."
pm2 start server.js --name server --time
print_success "Application started"

# Save PM2 configuration
pm2 save
print_success "PM2 configuration saved"

# Show status
echo ""
print_info "Application Status:"
pm2 status

# Show recent logs
echo ""
print_info "Recent Logs:"
pm2 logs server --lines 20 --nostream

# Clean up deployment package
rm -f "$PACKAGE"
print_success "Deployment package cleaned up"

echo ""
print_success "Deployment completed successfully!"
echo ""
print_info "Next steps:"
echo "  1. Update RPC endpoints in .env with your API keys (optional)"
echo "  2. Test DEX endpoints: curl http://localhost:3000/api/dex/test"
echo "  3. Monitor logs: pm2 logs server"
echo "  4. Restart if needed: pm2 restart server"

ENDSSH

# ============================================
# POST-DEPLOYMENT VERIFICATION
# ============================================

print_header "POST-DEPLOYMENT VERIFICATION"

print_info "Waiting for application to start..."
sleep 5

# Test health endpoint
print_info "Testing health endpoint..."
if ssh "$SERVER_USER@$SERVER_IP" "curl -s http://localhost:3000/api/health" | grep -q "ok"; then
    print_success "Health check passed"
else
    print_warning "Health check failed - application may still be starting"
fi

# Test DEX endpoint
print_info "Testing DEX endpoint..."
if ssh "$SERVER_USER@$SERVER_IP" "curl -s http://localhost:3000/api/dex/network-info" | grep -q "ethereum"; then
    print_success "DEX endpoint responding"
else
    print_warning "DEX endpoint not responding yet"
fi

# ============================================
# DEPLOYMENT SUMMARY
# ============================================

print_header "DEPLOYMENT SUMMARY"

echo -e "${GREEN}✓ Deployment completed successfully!${NC}\n"

echo "Server: $SERVER_USER@$SERVER_IP"
echo "Application: /opt/trading-data-collection-service"
echo "Status: Running with PM2"
echo ""

echo -e "${BLUE}Available Endpoints:${NC}"
echo "  • Health: https://xrypt.net/api/health"
echo "  • Signals: https://xrypt.net/api/signals"
echo "  • DEX Network Info: https://xrypt.net/api/dex/network-info"
echo "  • DEX Tokens: https://xrypt.net/api/dex/tokens"
echo "  • DEX Test: https://xrypt.net/api/dex/test"
echo "  • Trade Signals Page: https://xrypt.net/signals.html"
echo "  • Enhanced Signals: https://xrypt.net/signals-enhanced.html"
echo ""

echo -e "${BLUE}Useful Commands:${NC}"
echo "  • View logs: ssh $SERVER_USER@$SERVER_IP 'pm2 logs server'"
echo "  • Restart app: ssh $SERVER_USER@$SERVER_IP 'pm2 restart server'"
echo "  • Check status: ssh $SERVER_USER@$SERVER_IP 'pm2 status'"
echo "  • Edit .env: ssh $SERVER_USER@$SERVER_IP 'nano /opt/trading-data-collection-service/.env'"
echo ""

echo -e "${YELLOW}Important Next Steps:${NC}"
echo "  1. Get free RPC API keys from:"
echo "     • Alchemy: https://www.alchemy.com/"
echo "     • Infura: https://infura.io/"
echo ""
echo "  2. Update .env on server with your API keys:"
echo "     ssh $SERVER_USER@$SERVER_IP"
echo "     cd /opt/trading-data-collection-service"
echo "     nano .env"
echo "     # Update ETHEREUM_RPC_URL, BSC_RPC_URL, etc."
echo "     pm2 restart server"
echo ""
echo "  3. Test DEX functionality:"
echo "     curl https://xrypt.net/api/dex/test"
echo ""

print_success "All done! 🚀"
