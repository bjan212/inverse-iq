# InverseIQ Notification System - Quick Setup Guide

Get started with Email and Telegram notifications in 5 minutes!

## Prerequisites

- Node.js installed
- InverseIQ server running
- Email account (Gmail recommended) OR Telegram account

## Step 1: Install Dependencies

```bash
npm install
```

This installs:
- `nodemailer` - For email notifications
- `node-telegram-bot-api` - For Telegram notifications

## Step 2: Choose Your Notification Channel

### Option A: Email Notifications (Recommended for beginners)

#### Using Gmail:

1. **Enable 2-Factor Authentication:**
   - Go to your Google Account settings
   - Security → 2-Step Verification → Turn On

2. **Generate App Password:**
   - Go to https://myaccount.google.com/apppasswords
   - Select "Mail" and your device
   - Click "Generate"
   - Copy the 16-character password

3. **Create `.env` file:**
   ```bash
   cp .env.example .env
   ```

4. **Edit `.env` and add:**
   ```env
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=your-16-char-app-password
   SMTP_FROM=InverseIQ <noreply@inverseiq.com>
   ```

#### Using Other Email Providers:

**Outlook/Hotmail:**
```env
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_USER=your-email@outlook.com
SMTP_PASS=your-password
```

**Yahoo:**
```env
SMTP_HOST=smtp.mail.yahoo.com
SMTP_PORT=587
SMTP_USER=your-email@yahoo.com
SMTP_PASS=your-app-password
```

### Option B: Telegram Notifications

1. **Create a Telegram Bot:**
   - Open Telegram app
   - Search for `@BotFather`
   - Send `/newbot` command
   - Follow instructions to name your bot
   - Copy the bot token (looks like: `1234567890:ABCdefGHIjklMNOpqrsTUVwxyz`)

2. **Get Your Chat ID:**
   - Start a chat with your new bot
   - Send any message to it
   - Open this URL in browser (replace YOUR_BOT_TOKEN):
     ```
     https://api.telegram.org/botYOUR_BOT_TOKEN/getUpdates
     ```
   - Look for `"chat":{"id":` in the response
   - Copy the number (your chat ID)

3. **Add to `.env`:**
   ```env
   TELEGRAM_BOT_TOKEN=1234567890:ABCdefGHIjklMNOpqrsTUVwxyz
   ```

### Option C: Both Email AND Telegram

Simply configure both in your `.env` file!

## Step 3: Test Your Setup

Run the interactive test script:

```bash
node scripts/testNotifications.js
```

This will:
1. Initialize notification services
2. Ask for your contact info
3. Create a test subscriber
4. Send test notifications
5. Generate a test signal
6. Show statistics

## Step 4: Start the Server

```bash
npm start
```

You should see:
```
🔔 Initializing Notification Manager...

✅ Email service initialized successfully
   SMTP Host: smtp.gmail.com
   From: InverseIQ <noreply@inverseiq.com>

✅ Telegram service initialized successfully
   Bot Username: @your_bot_username
   Bot Name: Your Bot Name

✅ Notification Manager initialized
   Email: Ready
   Telegram: Ready
   Subscribers: 0
```

## Step 5: Subscribe to Notifications

### Via API:

```bash
curl -X POST http://localhost:3000/api/notifications/subscribe \
  -H "Content-Type: application/json" \
  -d '{
    "email": "your@email.com",
    "telegramChatId": "123456789",
    "preferences": {
      "channels": {
        "email": true,
        "telegram": true
      },
      "minConfidence": 75,
      "symbols": ["BTCUSDT", "ETHUSDT"],
      "directions": ["LONG", "SHORT"]
    }
  }'
```

Save the `subscriber.id` from the response!

### Test Your Subscription:

```bash
curl -X POST http://localhost:3000/api/notifications/test/YOUR_SUBSCRIBER_ID
```

Check your email/Telegram for test messages!

## Step 6: Generate Signals

Run the bootstrap script to generate real signals:

```bash
npm run bootstrap
```

Or visit: http://localhost:3000/api/signals

You'll automatically receive notifications for new signals!

## Customizing Preferences

### Update Minimum Confidence:

```bash
curl -X PUT http://localhost:3000/api/notifications/preferences/YOUR_ID \
  -H "Content-Type: application/json" \
  -d '{
    "preferences": {
      "minConfidence": 85
    }
  }'
```

### Filter by Symbols:

```bash
curl -X PUT http://localhost:3000/api/notifications/preferences/YOUR_ID \
  -H "Content-Type: application/json" \
  -d '{
    "preferences": {
      "symbols": ["BTCUSDT"]
    }
  }'
```

### Only LONG or SHORT:

```bash
curl -X PUT http://localhost:3000/api/notifications/preferences/YOUR_ID \
  -H "Content-Type: application/json" \
  -d '{
    "preferences": {
      "directions": ["LONG"]
    }
  }'
```

## Troubleshooting

### Email Issues

**"Email service not initialized"**
- Check `.env` file exists and has SMTP settings
- Verify SMTP_USER and SMTP_PASS are correct

**"Authentication failed"**
- Gmail users: Use App Password, not regular password
- Make sure 2FA is enabled for Gmail
- Check SMTP_HOST and SMTP_PORT are correct

**"Connection timeout"**
- Check your firewall settings
- Try port 465 with `secure: true` for SSL

### Telegram Issues

**"Telegram service not initialized"**
- Check TELEGRAM_BOT_TOKEN in `.env`
- Verify token format is correct

**"Chat not found"**
- Make sure you've sent a message to your bot first
- Verify chat ID is correct (should be a number)

**"Forbidden: bot was blocked by the user"**
- Unblock the bot in Telegram
- Start a new chat with the bot

### No Notifications Received

1. **Check services are running:**
   ```bash
   curl http://localhost:3000/api/notifications/stats
   ```

2. **Verify subscription:**
   ```bash
   curl http://localhost:3000/api/notifications/subscriber/YOUR_ID
   ```

3. **Check preferences:**
   - Is `minConfidence` too high?
   - Are `symbols` too restrictive?
   - Are channels enabled?

4. **Test notification:**
   ```bash
   curl -X POST http://localhost:3000/api/notifications/test/YOUR_ID
   ```

## What You'll Receive

### Email Notifications Include:
- 📊 Signal details (symbol, direction, confidence)
- 📈 Pattern intelligence (traders, occurrences, losses)
- 💡 Analysis and reasoning
- 📉 Market conditions (price, RSI, sentiment)
- 🎨 Beautiful HTML formatting

### Telegram Notifications Include:
- 🧠 Signal alert with emojis
- 📈/📉 Direction indicators
- 🔥/⚡/💡 Confidence levels
- 🟢/🟡/🟠/🔴 Risk indicators
- 📊 Pattern intelligence
- 📈 Market conditions

## Managing Your Subscription

### View Your Info:
```bash
curl http://localhost:3000/api/notifications/subscriber/YOUR_ID
```

### Update Contact Info:
```bash
curl -X PUT http://localhost:3000/api/notifications/contact/YOUR_ID \
  -H "Content-Type: application/json" \
  -d '{"email": "newemail@example.com"}'
```

### Unsubscribe:
```bash
curl -X DELETE http://localhost:3000/api/notifications/unsubscribe/YOUR_ID
```

### Reactivate:
```bash
curl -X POST http://localhost:3000/api/notifications/reactivate/YOUR_ID
```

## Next Steps

1. ✅ Configure your notification channels
2. ✅ Test with `node scripts/testNotifications.js`
3. ✅ Subscribe via API
4. ✅ Generate signals with `npm run bootstrap`
5. ✅ Receive notifications automatically!

## Need Help?

- 📖 Full documentation: `docs/NOTIFICATION_SYSTEM.md`
- 🔧 Configuration reference: `.env.example`
- 📝 Implementation details: `NOTIFICATION_SYSTEM_IMPLEMENTATION.md`
- 💬 Check server logs for error messages

## Security Tips

- ✅ Never commit `.env` file to git
- ✅ Use App Passwords for email (not regular passwords)
- ✅ Keep bot tokens secure
- ✅ Regularly rotate credentials
- ✅ Use environment variables in production

---

**Ready to get started?** Run `node scripts/testNotifications.js` now!
