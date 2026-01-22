§#!/bin/bash

# Xrypt DEX RPC Configuration Script
# This script helps you update your .env file with RPC endpoints for DEX trading

echo "================================================"
echo "  Xrypt DEX RPC Configuration Helper"
echo "================================================"
echo ""

# Check if .env file exists
if [ ! -f .env ]; then
    echo "❌ .env file not found!"
    echo "Creating .env file from template..."
    
    # Check if ENV_TEMPLATE_RPC_SETUP.md exists
    if [ -f ENV_TEMPLATE_RPC_SETUP.md ]; then
        # Extract just the env variables from the template
        grep -E '^[A-Z_]+=' ENV_TEMPLATE_RPC_SETUP.md > .env 2>/dev/null || true
        if [ -s .env ]; then
            echo "✅ .env file created from template"
        else
            touch .env
            echo "✅ Empty .env file created"
        fi
    else
        touch .env
        echo "✅ Empty .env file created"
    fi
    echo ""
fi

echo "This script will help you configure RPC endpoints for DEX trading."
echo ""
echo "Supported networks:"
echo "  - Ethereum (Uniswap)"
echo "  - Binance Smart Chain (PancakeSwap)"
echo "  - Arbitrum"
echo "  - Polygon"
echo ""
echo "You can use:"
echo "  1. Free public RPC (rate-limited)"
echo "  2. Alchemy RPC (recommended, free tier available)"
echo "  3. Infura RPC (free tier available)"
echo "  4. Your own node"
echo ""
read -p "Continue? (y/n): " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Cancelled."
    exit 0
fi

# Function to update or add environment variable
update_env_var() {
    local var_name="$1"
    local default_value="$2"
    local description="$3"
    
    echo ""
    echo "================================================"
    echo "$description"
    echo "================================================"
    
    # Check if variable already exists
    if grep -q "^$var_name=" .env; then
        current_value=$(grep "^$var_name=" .env | cut -d'=' -f2-)
        echo "Current value: $current_value"
        read -p "Keep current value? (y/n): " -n 1 -r
        echo ""
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            echo "Keeping current value."
            return
        fi
        # Remove old setting
        sed -i.bak "/^$var_name=/d" .env
    fi
    
    echo ""
    echo "Options for $var_name:"
    case $var_name in
        ETHEREUM_RPC_URL)
            echo "  1. Public RPC: https://eth.public-rpc.com"
            echo "  2. Alchemy: https://eth-mainnet.g.alchemy.com/v2/YOUR_API_KEY"
            echo "  3. Infura: https://mainnet.infura.io/v3/YOUR_PROJECT_ID"
            echo "  4. Custom URL"
            ;;
        BSC_RPC_URL)
            echo "  1. Public RPC: https://bsc-dataseed.binance.org/"
            echo "  2. Alternative: https://bsc-dataseed1.binance.org/"
            echo "  3. Custom URL"
            ;;
        ARBITRUM_RPC_URL)
            echo "  1. Public RPC: https://arb1.arbitrum.io/rpc"
            echo "  2. Alchemy: https://arb-mainnet.g.alchemy.com/v2/YOUR_API_KEY"
            echo "  3. Custom URL"
            ;;
        POLYGON_RPC_URL)
            echo "  1. Public RPC: https://polygon-rpc.com"
            echo "  2. Alchemy: https://polygon-mainnet.g.alchemy.com/v2/YOUR_API_KEY"
            echo "  3. Custom URL"
            ;;
        *)
            echo "  Default: $default_value"
            echo "  Custom value"
            ;;
    esac
    
    read -p "Enter choice (1-4) or custom value: " choice
    echo ""
    
    case $choice in
        1)
            case $var_name in
                ETHEREUM_RPC_URL) new_value="https://eth.public-rpc.com" ;;
                BSC_RPC_URL) new_value="https://bsc-dataseed.binance.org/" ;;
                ARBITRUM_RPC_URL) new_value="https://arb1.arbitrum.io/rpc" ;;
                POLYGON_RPC_URL) new_value="https://polygon-rpc.com" ;;
                *) new_value="$default_value" ;;
            esac
            ;;
        2)
            case $var_name in
                ETHEREUM_RPC_URL) new_value="https://eth-mainnet.g.alchemy.com/v2/YOUR_API_KEY" ;;
                BSC_RPC_URL) new_value="https://bsc-dataseed1.binance.org/" ;;
                ARBITRUM_RPC_URL) new_value="https://arb-mainnet.g.alchemy.com/v2/YOUR_API_KEY" ;;
                POLYGON_RPC_URL) new_value="https://polygon-mainnet.g.alchemy.com/v2/YOUR_API_KEY" ;;
                *) new_value="$default_value" ;;
            esac
            ;;
        3)
            case $var_name in
                ETHEREUM_RPC_URL) new_value="https://mainnet.infura.io/v3/YOUR_PROJECT_ID" ;;
                *) new_value="$default_value" ;;
            esac
            ;;
        *)
            new_value="$choice"
            ;;
    esac
    
    # Add to .env file
    echo "$var_name=$new_value" >> .env
    echo "✅ Set $var_name=$new_value"
}

# Function to update boolean flag
update_bool_flag() {
    local var_name="$1"
    local default_value="$2"
    local description="$3"
    
    echo ""
    echo "================================================"
    echo "$description"
    echo "================================================"
    
    # Check if variable already exists
    if grep -q "^$var_name=" .env; then
        current_value=$(grep "^$var_name=" .env | cut -d'=' -f2-)
        echo "Current value: $current_value"
        read -p "Keep current value? (y/n): " -n 1 -r
        echo ""
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            echo "Keeping current value."
            return
        fi
        # Remove old setting
        sed -i.bak "/^$var_name=/d" .env
    fi
    
    read -p "Enable $var_name? (y/n, default: $default_value): " -n 1 -r
    echo ""
    
    if [[ $REPLY =~ ^[Yy]$ ]] || [[ -z "$REPLY" && "$default_value" == "true" ]]; then
        new_value="true"
    else
        new_value="false"
    fi
    
    # Add to .env file
    echo "$var_name=$new_value" >> .env
    echo "✅ Set $var_name=$new_value"
}

# Backup .env file
cp .env .env.backup.$(date +%Y%m%d_%H%M%S)
echo "📁 Backup created: .env.backup.*"

# Update RPC URLs
update_env_var "ETHEREUM_RPC_URL" "https://eth.public-rpc.com" "Ethereum Mainnet RPC (for Uniswap)"
update_env_var "BSC_RPC_URL" "https://bsc-dataseed.binance.org/" "Binance Smart Chain RPC (for PancakeSwap)"
update_env_var "ARBITRUM_RPC_URL" "https://arb1.arbitrum.io/rpc" "Arbitrum RPC"
update_env_var "POLYGON_RPC_URL" "https://polygon-rpc.com" "Polygon RPC"

# Update DEX enable flags
update_bool_flag "UNISWAP_ENABLED" "true" "Enable Uniswap (Ethereum)"
update_bool_flag "PANCAKESWAP_ENABLED" "true" "Enable PancakeSwap (BSC)"
update_bool_flag "ARBITRUM_ENABLED" "true" "Enable Arbitrum DEX"
update_bool_flag "POLYGON_ENABLED" "true" "Enable Polygon DEX"

# Update DEX trading settings
update_env_var "DEX_SLIPPAGE_TOLERANCE" "0.005" "Slippage tolerance (0.005 = 0.5%)"
update_env_var "DEX_TRANSACTION_DEADLINE" "1200" "Transaction deadline in seconds (1200 = 20 minutes)"
update_env_var "UNISWAP_DEFAULT_FEE" "3000" "Uniswap V3 default fee tier (3000 = 0.3%)"

echo ""
echo "================================================"
echo "✅ RPC Configuration Complete!"
echo "================================================"
echo ""
echo "Next steps:"
echo ""
echo "1. Review your .env file:"
echo "   cat .env | grep -E '(RPC|ENABLED|DEX)'"
echo ""
echo "2. Test the configuration:"
echo "   node scripts/testDEXConnector.js"
echo ""
echo "3. Start the server:"
echo "   npm start"
echo ""
echo "4. Test DEX endpoints:"
echo "   curl http://localhost:3000/api/dex/network-info?chainId=1"
echo ""
echo "5. Open the trading interface:"
echo "   http://localhost:3000/trade-signals.html"
echo ""
echo "================================================"
echo ""
echo "📚 For detailed documentation, see:"
echo "   - ENV_TEMPLATE_RPC_SETUP.md"
echo "   - TODO.md"
echo ""

# Clean up backup files (keep only 3 most recent)
ls -t .env.backup.* 2>/dev/null | tail -n +4 | xargs rm -f 2>/dev/null || true
