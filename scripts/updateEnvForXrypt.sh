#!/bin/bash

# Xrypt Notification Configuration Script
# This script helps you update your .env file with Xrypt notification settings

echo "================================================"
echo "  Xrypt Notification Configuration Helper"
echo "================================================"
echo ""

# Check if .env file exists
if [ ! -f .env ]; then
    echo "❌ .env file not found!"
    echo "Creating .env file from .env.example..."
    if [ -f .env.example ]; then
        cp .env.example .env
        echo "✅ .env file created"
    else
        touch .env
        echo "✅ Empty .env file created"
    fi
    echo ""
fi

echo "This script will add Xrypt notification settings to your .env file."
echo ""
echo "Settings to be added:"
echo "  - ProtonMail SMTP configuration"
echo "  - Telegram bot token"
echo ""
read -p "Continue? (y/n): " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Cancelled."
    exit 0
fi

echo ""
echo "Adding configuration to .env file..."

# Check if settings already exist
if grep -q "SMTP_HOST=smtp.protonmail.ch" .env; then
    echo "⚠️  ProtonMail settings already exist in .env"
    read -p "Overwrite? (y/n): " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Skipping email configuration..."
    else
        # Remove old settings
        sed -i.bak '/SMTP_HOST=/d' .env
        sed -i.bak '/SMTP_PORT=/d' .env
        sed -i.bak '/SMTP_USER=/d' .env
        sed -i.bak '/SMTP_PASS=/d' .env
        sed -i.bak '/SMTP_FROM=/d' .env
    fi
fi

if grep -q "TELEGRAM_BOT_TOKEN=8187241165" .env; then
    echo "⚠️  Telegram settings already exist in .env"
    read -p "Overwrite? (y/n): " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Skipping Telegram configuration..."
    else
        # Remove old settings
        sed -i.bak '/TELEGRAM_BOT_TOKEN=/d' .env
    fi
fi

# Add new settings
cat >> .env << 'EOF'

# ============================================
# XRYPT NOTIFICATION SYSTEM
# ============================================

# Email Settings (ProtonMail)
SMTP_HOST=smtp.protonmail.ch
SMTP_PORT=587
SMTP_USER=notify@xrypt.net
SMTP_PASS=ZX9WB496RMQ4JEQJ
SMTP_FROM=XryptNotifications <notify@xrypt.net>

# Telegram Settings
TELEGRAM_BOT_TOKEN=8187241165:AAGybvkmybrqYHIVhAz2YYLzPQqIvdp3beA

EOF

echo ""
echo "✅ Configuration added to .env file!"
echo ""
echo "================================================"
echo "  Next Steps:"
echo "================================================"
echo ""
echo "1. Restart your server:"
echo "   npm start"
echo ""
echo "2. Test the configuration:"
echo "   node scripts/testNotifications.js"
echo ""
echo "3. Get your Telegram Chat ID:"
echo "   - Send a message to your bot"
echo "   - Visit: https://api.telegram.org/bot8187241165:AAGybvkmybrqYHIVhAz2YYLzPQqIvdp3beA/getUpdates"
echo "   - Copy the chat ID number"
echo ""
echo "4. Subscribe to notifications:"
echo "   curl -X POST http://localhost:3000/api/notifications/subscribe \\"
echo "     -H \"Content-Type: application/json\" \\"
echo "     -d '{\"email\": \"your@email.com\", \"telegramChatId\": \"YOUR_CHAT_ID\"}'"
echo ""
echo "================================================"
echo ""
echo "📚 For detailed documentation, see:"
echo "   - XRYPT_NOTIFICATION_CONFIG.md"
echo "   - ENV_UPDATE_INSTRUCTIONS.md"
echo ""
