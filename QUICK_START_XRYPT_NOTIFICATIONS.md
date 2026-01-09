# 🚀 Xrypt Notifications - Quick Start

## Option 1: Automated Setup (Recommended)

Run the automated configuration script:

```bash
./scripts/updateEnvForXrypt.sh
```

This will automatically add your email and Telegram settings to the `.env` file.

---

## Option 2: Manual Setup

### Step 1: Edit .env file

```bash
nano .env
```

### Step 2: Add these lines

```env
# Email Settings (ProtonMail)
SMTP_HOST=smtp.protonmail.ch
SMTP_PORT=587
SMTP_USER=notify@xrypt.net
SMTP_PASS=ZX9WB496RMQ4JEQJ
SMTP_FROM=XryptNotifications <notify@xrypt.net>

# Telegram Settings
TELEGRAM_BOT_TOKEN=8187241165:AAGybvkmybrqYHIVhAz2YYLzPQqIvdp3beA
```

### Step 3: Save and exit
Press `Ctrl+X`, then `Y`, then `Enter`

---

## Test Your Setup

### 1. Restart Server
```bash
npm start
```

### 2. Run Test Script
```bash
node scripts/testNotifications.js
```

### 3. Get Telegram Chat ID
- Send a message to your bot
- Visit: https://api.telegram.org/bot8187241165:AAGybvkmybrqYHIVhAz2YYLzPQqIvdp3beA/getUpdates
- Copy the chat ID number

### 4. Subscribe
```bash
curl -X POST http://localhost:3000/api/notifications/subscribe \
  -H "Content-Type: application/json" \
  -d '{
    "email": "your@email.com",
    "telegramChatId": "YOUR_CHAT_ID",
    "preferences": {
      "channels": {"email": true, "telegram": true},
      "minConfidence": 75
    }
  }'
```

---

## 📚 Full Documentation

- **Complete Guide**: `XRYPT_NOTIFICATION_CONFIG.md`
- **Manual Instructions**: `ENV_UPDATE_INSTRUCTIONS.md`
- **Summary**: `XRYPT_BRANDING_UPDATE_COMPLETE.md`

---

## ⚠️ ProtonMail Note

If you get authentication errors:
- Free accounts may not support SMTP
- Plus/Professional may need ProtonMail Bridge
- See `XRYPT_NOTIFICATION_CONFIG.md` for details

---

## ✅ That's It!

You're ready to receive Xrypt signal notifications via email and Telegram!
