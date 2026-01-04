# InverseIQ Notification System

## Overview

The InverseIQ notification system allows users to receive real-time alerts when inverse signals are generated. Users can choose to be notified via **Email** or **Telegram** (or both).

## Features

- ✅ **Multi-Channel Support**: Email and Telegram notifications
- ✅ **Customizable Preferences**: Filter by confidence, symbols, direction
- ✅ **Smart Filtering**: Only receive notifications for signals you care about
- ✅ **Test Notifications**: Verify your setup before going live
- ✅ **Subscription Management**: Easy subscribe/unsubscribe
- ✅ **Beautiful Formatting**: Rich HTML emails and formatted Telegram messages

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Signal Generation                         │
│              (HybridEngine/InverseSignalEngine)             │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                 Notification Manager                         │
│  • Filters interested subscribers                           │
│  • Orchestrates multi-channel delivery                      │
└────────┬────────────────────────────────────────────────────┘
         │
         ├──────────────┬──────────────┐
         ▼              ▼              ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│ Email Service│ │Telegram Svc  │ │  Future...   │
│  (nodemailer)│ │ (Bot API)    │ │  (SMS, etc)  │
└──────────────┘ └──────────────┘ └──────────────┘
```

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

This will install:
- `nodemailer` - Email service
- `node-telegram-bot-api` - Telegram bot integration

### 2. Configure Email (Optional)

#### For Gmail:

1. Enable 2-factor authentication on your Google account
2. Generate an App Password:
   - Go to https://myaccount.google.com/apppasswords
   - Select "Mail" and your device
   - Copy the generated password

3. Add to `.env`:
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password-here
SMTP_FROM=InverseIQ <noreply@inverseiq.com>
```

#### For Other Email Providers:

**Outlook/Hotmail:**
```env
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_USER=your-email@outlook.com
SMTP_PASS=your-password
```

**Custom SMTP:**
```env
SMTP_HOST=your-smtp-server.com
SMTP_PORT=587
SMTP_USER=your-username
SMTP_PASS=your-password
```

### 3. Configure Telegram (Optional)

1. **Create a Telegram Bot:**
   - Open Telegram and search for `@BotFather`
   - Send `/newbot` command
   - Follow the instructions to create your bot
   - Copy the bot token provided

2. **Add to `.env`:**
```env
TELEGRAM_BOT_TOKEN=1234567890:ABCdefGHIjklMNOpqrsTUVwxyz
```

3. **Get Your Chat ID:**
   - Start a chat with your bot
   - Send any message to the bot
   - Visit: `https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getUpdates`
   - Look for `"chat":{"id":` in the response
   - Copy your chat ID (it's a number)

### 4. Start the Server

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

## API Endpoints

### Subscribe to Notifications

**POST** `/api/notifications/subscribe`

```json
{
  "email": "user@example.com",
  "telegramChatId": "123456789",
  "preferences": {
    "channels": {
      "email": true,
      "telegram": true
    },
    "minConfidence": 75,
    "symbols": ["BTCUSDT", "ETHUSDT"],
    "directions": ["LONG", "SHORT"],
    "notifyOnHighConfidence": true,
    "notifyOnCombinedPatterns": true
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Successfully subscribed to notifications",
  "subscriber": {
    "id": "abc123...",
    "email": "user@example.com",
    "telegramChatId": "123456789",
    "preferences": { ... },
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### Get Subscriber Info

**GET** `/api/notifications/subscriber/:id`

### Update Preferences

**PUT** `/api/notifications/preferences/:id`

```json
{
  "preferences": {
    "minConfidence": 85,
    "symbols": ["BTCUSDT"]
  }
}
```

### Send Test Notification

**POST** `/api/notifications/test/:id`

### Unsubscribe

**DELETE** `/api/notifications/unsubscribe/:id`

### Get Statistics

**GET** `/api/notifications/stats`

**Response:**
```json
{
  "success": true,
  "stats": {
    "totalSent": 150,
    "emailSent": 80,
    "telegramSent": 70,
    "failed": 0,
    "subscribers": {
      "total": 25,
      "active": 23,
      "inactive": 2,
      "withEmail": 20,
      "withTelegram": 18
    },
    "services": {
      "email": true,
      "telegram": true
    }
  }
}
```

## Notification Preferences

### Channels
Choose which channels to receive notifications on:
- `email`: Receive via email
- `telegram`: Receive via Telegram

### Filters

**minConfidence** (default: 75)
- Only receive signals with confidence >= this value
- Range: 0-100

**symbols** (default: all)
- Array of symbols to monitor
- Example: `["BTCUSDT", "ETHUSDT", "BNBUSDT"]`
- Empty array = all symbols

**directions** (default: both)
- Array of directions to monitor
- Options: `["LONG"]`, `["SHORT"]`, or `["LONG", "SHORT"]`

**notifyOnHighConfidence** (default: true)
- Receive notifications for high confidence signals (85%+)

**notifyOnCombinedPatterns** (default: true)
- Receive notifications for combined pattern signals
- These are signals confirmed by both public and trader data

## Email Notification Format

Emails include:
- 📊 Signal details (symbol, direction, confidence)
- 📈 Pattern intelligence (traders affected, occurrences, losses)
- 💡 Analysis and reasoning
- 📉 Current market conditions
- 🎨 Beautiful HTML formatting with color coding

## Telegram Notification Format

Telegram messages include:
- 🧠 Signal alert header
- 📈/📉 Direction indicators
- 🔥/⚡/💡 Confidence indicators
- 🟢/🟡/🟠/🔴 Risk level indicators
- 📊 Pattern intelligence
- 💡 Analysis
- 📈 Market conditions
- 🕐 Timestamps

## Testing

### Test Email Notification

```bash
curl -X POST http://localhost:3000/api/notifications/test/YOUR_SUBSCRIBER_ID
```

### Test Telegram Notification

Same endpoint works for both channels.

### Manual Test

1. Subscribe via API
2. Generate signals: `npm run bootstrap`
3. Check your email/Telegram for notifications

## Troubleshooting

### Email Not Working

**Problem:** "Email service not initialized"
- **Solution:** Check your `.env` file has correct SMTP settings
- **Gmail users:** Make sure you're using an App Password, not your regular password

**Problem:** "Authentication failed"
- **Solution:** Verify SMTP_USER and SMTP_PASS are correct
- **Gmail users:** Enable "Less secure app access" or use App Password

### Telegram Not Working

**Problem:** "Telegram service not initialized"
- **Solution:** Check TELEGRAM_BOT_TOKEN in `.env`

**Problem:** "Chat not found"
- **Solution:** Make sure you've started a chat with your bot first
- Send any message to your bot before subscribing

**Problem:** "Forbidden: bot was blocked by the user"
- **Solution:** Unblock the bot in Telegram and try again

### No Notifications Received

1. **Check if services are initialized:**
   ```bash
   curl http://localhost:3000/api/notifications/stats
   ```

2. **Verify your subscription:**
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

## Database

Subscribers are stored in `./data/subscribers.json`

Example structure:
```json
[
  {
    "id": "abc123...",
    "email": "user@example.com",
    "telegramChatId": "123456789",
    "preferences": {
      "channels": {
        "email": true,
        "telegram": true
      },
      "minConfidence": 75,
      "symbols": ["BTCUSDT", "ETHUSDT"],
      "directions": ["LONG", "SHORT"],
      "notifyOnHighConfidence": true,
      "notifyOnCombinedPatterns": true
    },
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z",
    "active": true,
    "notificationCount": 42,
    "lastNotificationAt": "2024-01-01T12:00:00.000Z"
  }
]
```

## Security Considerations

1. **Environment Variables:**
   - Never commit `.env` file to version control
   - Keep API keys and passwords secure

2. **Rate Limiting:**
   - Consider adding rate limiting to prevent spam
   - Implement cooldown periods between notifications

3. **Validation:**
   - Email addresses are not validated (add validation if needed)
   - Telegram chat IDs are not verified until first message

4. **Privacy:**
   - Subscriber data is stored locally
   - No data is shared with third parties
   - Users can unsubscribe anytime

## Future Enhancements

- [ ] SMS notifications (via Twilio)
- [ ] WhatsApp notifications (via Twilio)
- [ ] Discord webhooks
- [ ] Slack integration
- [ ] Push notifications (web/mobile)
- [ ] Notification history/logs
- [ ] Rate limiting per subscriber
- [ ] Email templates customization
- [ ] Notification scheduling
- [ ] Digest mode (daily/weekly summaries)

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review the `.env.example` file
3. Check server logs for error messages
4. Verify API endpoints are working

## License

MIT
