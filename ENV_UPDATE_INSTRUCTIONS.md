# 🚀 Quick .env File Update Instructions

## Step-by-Step Guide

### 1. Open your .env file
```bash
# Use your preferred text editor
nano .env
# or
vim .env
# or
code .env
```

### 2. Add these exact lines to your .env file

Copy and paste these settings:

```env
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
```

### 3. Save the file
- **nano**: Press `Ctrl+X`, then `Y`, then `Enter`
- **vim**: Press `Esc`, type `:wq`, press `Enter`
- **VSCode**: Press `Cmd+S` (Mac) or `Ctrl+S` (Windows/Linux)

### 4. Restart your server
```bash
# Stop current server (Ctrl+C if running)

# Start server
npm start
```

### 5. Verify initialization
You should see:
```
✅ Email service initialized successfully
   SMTP Host: smtp.protonmail.ch
   From: XryptNotifications <notify@xrypt.net>

✅ Telegram service initialized successfully
   Bot Username: @your_bot
   Bot Name: Your Bot Name
```

### 6. Test the configuration
```bash
node scripts/testNotifications.js
```

---

## ⚠️ Important Notes

### ProtonMail Users:
- **Free accounts** may not support SMTP
- **Plus/Professional accounts** may need ProtonMail Bridge
- If you get authentication errors, you may need to:
  1. Install ProtonMail Bridge: https://proton.me/mail/bridge
  2. Use Bridge's local SMTP settings instead

### Telegram:
- You need your **Chat ID** to receive notifications
- Get it by visiting: `https://api.telegram.org/bot8187241165:AAGybvkmybrqYHIVhAz2YYLzPQqIvdp3beA/getUpdates`
- Send a message to your bot first, then check the URL above

---

## 🧪 Quick Test Commands

### Test Email:
```bash
curl -X POST http://localhost:3000/api/notifications/test-email \
  -H "Content-Type: application/json" \
  -d '{"email": "your@email.com"}'
```

### Test Telegram:
```bash
curl -X POST http://localhost:3000/api/notifications/test-telegram \
  -H "Content-Type: application/json" \
  -d '{"chatId": "YOUR_CHAT_ID"}'
```

---

## 📚 Full Documentation

For complete details, see: `XRYPT_NOTIFICATION_CONFIG.md`

---

**Last Updated**: ${new Date().toLocaleDateString()}
