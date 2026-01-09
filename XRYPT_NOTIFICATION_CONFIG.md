# Xrypt Notification System - Configuration Guide

## Your Configuration Settings

This guide contains your specific configuration settings for the Xrypt notification system.

---

## 📧 Email Configuration (ProtonMail)

Add these settings to your `.env` file:

```env
# Email Notification Settings (ProtonMail)
SMTP_HOST=smtp.protonmail.ch
SMTP_PORT=587
SMTP_USER=notify@xrypt.net
SMTP_PASS=ZX9WB496RMQ4JEQJ
SMTP_FROM=XryptNotifications <notify@xrypt.net>
```

### ProtonMail SMTP Details:
- **Provider**: ProtonMail
- **Host**: smtp.protonmail.ch
- **Port**: 587 (STARTTLS)
- **Security**: TLS/STARTTLS
- **Authentication**: Required
- **From Address**: notify@xrypt.net

### Important Notes:
- ✅ ProtonMail is a secure, privacy-focused email provider
- ✅ Port 587 uses STARTTLS encryption
- ✅ Make sure your ProtonMail account has SMTP access enabled
- ⚠️ ProtonMail may require Bridge for SMTP access (check your account type)
- ⚠️ Free ProtonMail accounts may have limited SMTP access

---

## 📱 Telegram Configuration

Add this setting to your `.env` file:

```env
# Telegram Notification Settings
TELEGRAM_BOT_TOKEN=8187241165:AAGybvkmybrqYHIVhAz2YYLzPQqIvdp3beA
```

### Telegram Bot Details:
- **Bot Token**: 8187241165:AAGybvkmybrqYHIVhAz2YYLzPQqIvdp3beA
- **Created via**: @BotFather on Telegram

### Getting Your Chat ID:

To receive notifications, you need your Telegram Chat ID:

1. **Start a chat with your bot:**
   - Search for your bot in Telegram
   - Click "Start" or send any message

2. **Get your Chat ID:**
   - Open this URL in your browser (replace with your token):
   ```
   https://api.telegram.org/bot8187241165:AAGybvkmybrqYHIVhAz2YYLzPQqIvdp3beA/getUpdates
   ```
   
3. **Find your Chat ID:**
   - Look for `"chat":{"id":` in the response
   - Copy the number (e.g., 123456789)
   - Save this for subscribing to notifications

---

## 🔧 Complete .env File Setup

Your complete `.env` file should include:

```env
# ============================================
# XRYPT NOTIFICATION SYSTEM CONFIGURATION
# ============================================

# Email Notification Settings (ProtonMail)
SMTP_HOST=smtp.protonmail.ch
SMTP_PORT=587
SMTP_USER=notify@xrypt.net
SMTP_PASS=ZX9WB496RMQ4JEQJ
SMTP_FROM=XryptNotifications <notify@xrypt.net>

# Telegram Notification Settings
TELEGRAM_BOT_TOKEN=8187241165:AAGybvkmybrqYHIVhAz2YYLzPQqIvdp3beA

# ============================================
# OTHER SETTINGS (if needed)
# ============================================

# Server Configuration
PORT=3000
NODE_ENV=production

# Database (if applicable)
# Add your database settings here
```

---

## 🚀 Quick Start Instructions

### Step 1: Update .env File

1. Open your `.env` file in a text editor
2. Copy the settings from the "Complete .env File Setup" section above
3. Save the file

### Step 2: Restart Your Server

```bash
# Stop the current server (Ctrl+C if running)

# Start the server
npm start
```

You should see:
```
✅ Email service initialized successfully
   SMTP Host: smtp.protonmail.ch
   From: XryptNotifications <notify@xrypt.net>

✅ Telegram service initialized successfully
   Bot Username: @your_bot_username
   Bot Name: Your Bot Name
```

### Step 3: Test Your Configuration

Run the test script:

```bash
node scripts/testNotifications.js
```

This will:
- ✅ Initialize both services
- ✅ Ask for your email and Telegram chat ID
- ✅ Send test notifications
- ✅ Verify everything is working

---

## 🧪 Testing Commands

### Test Email Only:
```bash
curl -X POST http://localhost:3000/api/notifications/test-email \
  -H "Content-Type: application/json" \
  -d '{"email": "your@email.com"}'
```

### Test Telegram Only:
```bash
curl -X POST http://localhost:3000/api/notifications/test-telegram \
  -H "Content-Type: application/json" \
  -d '{"chatId": "YOUR_CHAT_ID"}'
```

### Subscribe to Notifications:
```bash
curl -X POST http://localhost:3000/api/notifications/subscribe \
  -H "Content-Type: application/json" \
  -d '{
    "email": "your@email.com",
    "telegramChatId": "YOUR_CHAT_ID",
    "preferences": {
      "channels": {
        "email": true,
        "telegram": true
      },
      "minConfidence": 75
    }
  }'
```

---

## 🔍 Troubleshooting

### Email Issues

**"Email service not initialized"**
- ✅ Check `.env` file exists and has SMTP settings
- ✅ Verify SMTP_USER and SMTP_PASS are correct
- ✅ Restart the server after updating .env

**"Authentication failed"**
- ⚠️ ProtonMail may require Bridge for SMTP access
- ⚠️ Check if your ProtonMail account supports SMTP
- ⚠️ Verify the password is correct (no extra spaces)
- ⚠️ Some ProtonMail accounts need app-specific passwords

**"Connection timeout"**
- ✅ Check your firewall settings
- ✅ Verify port 587 is not blocked
- ✅ Try from a different network if behind corporate firewall

### ProtonMail Specific Issues

**Bridge Required:**
If you're using ProtonMail Plus/Professional:
1. Download ProtonMail Bridge: https://proton.me/mail/bridge
2. Install and configure Bridge
3. Use Bridge's SMTP settings instead:
   ```env
   SMTP_HOST=127.0.0.1
   SMTP_PORT=1025
   SMTP_USER=notify@xrypt.net
   SMTP_PASS=<bridge-generated-password>
   ```

**Free Account Limitations:**
- Free ProtonMail accounts may not support SMTP
- Consider upgrading to ProtonMail Plus for SMTP access
- Alternative: Use a different email provider (Gmail, Outlook, etc.)

### Telegram Issues

**"Telegram service not initialized"**
- ✅ Check TELEGRAM_BOT_TOKEN in `.env`
- ✅ Verify token format is correct (should have a colon)
- ✅ Restart the server

**"Chat not found"**
- ✅ Make sure you've sent a message to your bot first
- ✅ Verify chat ID is correct (should be a number)
- ✅ Use the getUpdates URL to get the correct chat ID

**"Forbidden: bot was blocked by the user"**
- ✅ Unblock the bot in Telegram
- ✅ Start a new chat with the bot
- ✅ Send /start command

---

## 📊 Monitoring

### Check Service Status:
```bash
curl http://localhost:3000/api/notifications/stats
```

### View Subscribers:
```bash
curl http://localhost:3000/api/notifications/subscribers
```

### Check Logs:
```bash
# Server logs will show:
# ✅ Service initialization
# 📧 Email sent confirmations
# 📱 Telegram message confirmations
# ❌ Any errors
```

---

## 🔐 Security Best Practices

- ✅ Never commit `.env` file to git (already in .gitignore)
- ✅ Keep bot tokens secure and private
- ✅ Regularly rotate credentials
- ✅ Use environment variables in production
- ✅ Monitor for unauthorized access
- ✅ Use strong passwords for email accounts

---

## 📝 What's Next?

After configuration is complete:

1. ✅ Test both email and Telegram notifications
2. ✅ Subscribe your email/Telegram to receive signals
3. ✅ Generate test signals to verify end-to-end flow
4. ✅ Customize notification preferences
5. ✅ Monitor notification delivery

---

## 🆘 Need Help?

- 📖 Full documentation: `docs/NOTIFICATION_SYSTEM.md`
- 🔧 Setup guide: `NOTIFICATION_SETUP_GUIDE.md`
- 📝 Implementation details: `NOTIFICATION_SYSTEM_IMPLEMENTATION.md`
- 💬 Check server logs for detailed error messages

---

## ✅ Configuration Checklist

- [ ] Updated `.env` file with email settings
- [ ] Updated `.env` file with Telegram bot token
- [ ] Restarted the server
- [ ] Verified services initialized successfully
- [ ] Obtained Telegram chat ID
- [ ] Ran test notification script
- [ ] Received test email
- [ ] Received test Telegram message
- [ ] Subscribed to notifications
- [ ] Generated test signal
- [ ] Received signal notifications

---

**Configuration Date**: ${new Date().toLocaleDateString()}
**System**: Xrypt Trading Data Collection Service
**Notification Channels**: Email (ProtonMail) + Telegram
