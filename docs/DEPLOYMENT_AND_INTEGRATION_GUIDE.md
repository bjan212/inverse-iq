# Deployment and Integration Guide

## How to Deploy Data Collection Page to Web Server and Connect to Trading Engine

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    WEB SERVER (Public)                       │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Data Collection Frontend (public/get-paid-for-data.html)│  │
│  │  - Collects trader API keys                          │  │
│  │  - Submits to backend API                            │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            ↓ HTTPS
┌─────────────────────────────────────────────────────────────┐
│              BACKEND SERVER (Your Server)                    │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Node.js API Server (server.js)                      │  │
│  │  - Receives submissions                              │  │
│  │  - Processes trading data                            │  │
│  │  - Feeds AI engine                                   │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  AI Trading Engine                                    │  │
│  │  - Analyzes patterns                                 │  │
│  │  - Generates signals                                 │  │
│  │  - Sends notifications                               │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## Option 1: Deploy Everything on One Server (Recommended for Start)

### Step 1: Prepare Your Server

**Requirements:**
- VPS or Cloud Server (AWS, DigitalOcean, Linode, etc.)
- Ubuntu 20.04+ or similar Linux distribution
- Node.js 18+
- Domain name (optional but recommended)

### Step 2: Upload Your Code

```bash
# On your local machine
cd /Users/redabhaj/Desktop/xrypt.net\(final\)/trading-data-collection-service

# Create a production-ready package
tar -czf inverseiq.tar.gz \
  --exclude='node_modules' \
  --exclude='.git' \
  --exclude='data/*.json' \
  .

# Upload to server
scp inverseiq.tar.gz user@your-server.com:/home/user/
```

### Step 3: Set Up on Server

```bash
# SSH into your server
ssh user@your-server.com

# Extract files
cd /home/user
tar -xzf inverseiq.tar.gz
cd trading-data-collection-service

# Install dependencies
npm install --production

# Install PM2 for process management
npm install -g pm2

# Create .env file
nano .env
```

**Add to .env:**
```env
PORT=3000
NODE_ENV=production

# Notification settings
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=InverseIQ <noreply@inverseiq.com>

TELEGRAM_BOT_TOKEN=your-bot-token
```

### Step 4: Start the Server

```bash
# Start with PM2
pm2 start server.js --name inverseiq

# Save PM2 configuration
pm2 save

# Set up PM2 to start on boot
pm2 startup
```

### Step 5: Set Up Nginx as Reverse Proxy

```bash
# Install Nginx
sudo apt update
sudo apt install nginx

# Create Nginx configuration
sudo nano /etc/nginx/sites-available/inverseiq
```

**Add this configuration:**
```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;

    # Frontend files
    location / {
        root /home/user/trading-data-collection-service/public;
        index index.html;
        try_files $uri $uri/ =404;
    }

    # API endpoints
    location /api/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    # WebSocket support
    location /ws {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "Upgrade";
        proxy_set_header Host $host;
    }
}
```

```bash
# Enable the site
sudo ln -s /etc/nginx/sites-available/inverseiq /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

### Step 6: Set Up SSL (HTTPS)

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# Auto-renewal is set up automatically
```

### Step 7: Configure Firewall

```bash
# Allow HTTP, HTTPS, and SSH
sudo ufw allow 'Nginx Full'
sudo ufw allow OpenSSH
sudo ufw enable
```

---

## Option 2: Separate Frontend and Backend (More Scalable)

### Architecture:

```
Frontend Server (Static Hosting)
  ↓
Backend Server (Your Trading Engine)
```

### Step 1: Deploy Frontend to Static Hosting

**Option A: Netlify (Free)**

1. Create account at netlify.com
2. Drag and drop your `public` folder
3. Configure custom domain
4. Update API endpoint in frontend files

**Option B: Vercel (Free)**

1. Create account at vercel.com
2. Connect GitHub repository
3. Deploy `public` folder
4. Configure environment variables

**Option C: AWS S3 + CloudFront**

```bash
# Install AWS CLI
aws configure

# Create S3 bucket
aws s3 mb s3://your-bucket-name

# Upload files
aws s3 sync ./public s3://your-bucket-name --acl public-read

# Set up CloudFront distribution (via AWS Console)
```

### Step 2: Update Frontend to Point to Backend

Edit `public/get-paid-for-data.html`:

```javascript
// Find this line (around line 500)
const API_URL = 'http://localhost:3000';

// Change to your backend URL
const API_URL = 'https://api.your-domain.com';
```

### Step 3: Deploy Backend

Follow Option 1, Steps 2-7 for backend deployment.

### Step 4: Configure CORS

In `server.js`, update CORS settings:

```javascript
// Add after line 24
app.use(cors({
  origin: [
    'https://your-frontend-domain.com',
    'https://www.your-frontend-domain.com'
  ],
  credentials: true
}));
```

---

## Connecting to Your Trading Engine

### Method 1: Direct Integration (Same Server)

If your trading engine is on the same server:

```javascript
// In your trading engine code
const axios = require('axios');

// Subscribe to signals
async function subscribeToSignals() {
  const response = await axios.get('http://localhost:3000/api/signals');
  const signals = response.data.signals;
  
  // Process signals
  for (const signal of signals) {
    if (signal.confidence >= 85) {
      // Execute trade based on signal
      await executeTrade(signal);
    }
  }
}

// Poll for new signals every minute
setInterval(subscribeToSignals, 60000);
```

### Method 2: Webhook Integration

Set up a webhook endpoint in your trading engine:

```javascript
// In server.js, add after signal generation
if (signals.length > 0) {
  // Send to your trading engine
  await axios.post('https://your-trading-engine.com/webhook/signals', {
    signals: signals,
    timestamp: new Date()
  });
}
```

### Method 3: Database Sharing

Both systems read/write to shared database:

```javascript
// Use MongoDB or PostgreSQL
const mongoose = require('mongoose');

// Connect to shared database
mongoose.connect('mongodb://your-db-url');

// Signal schema
const SignalSchema = new mongoose.Schema({
  signalId: String,
  symbol: String,
  direction: String,
  confidence: Number,
  generatedAt: Date
});

// Your trading engine reads from this
```

### Method 4: Message Queue (Most Scalable)

Use Redis or RabbitMQ:

```javascript
// In data collection service
const Redis = require('redis');
const publisher = Redis.createClient();

// Publish signals
publisher.publish('trading-signals', JSON.stringify(signal));

// In your trading engine
const subscriber = Redis.createClient();
subscriber.subscribe('trading-signals');

subscriber.on('message', (channel, message) => {
  const signal = JSON.parse(message);
  // Process signal
});
```

---

## Environment-Specific Configuration

### Development (.env.development)
```env
PORT=3000
NODE_ENV=development
API_URL=http://localhost:3000
```

### Production (.env.production)
```env
PORT=3000
NODE_ENV=production
API_URL=https://api.your-domain.com
```

---

## Monitoring and Maintenance

### Set Up Monitoring

```bash
# Install monitoring tools
pm2 install pm2-logrotate

# View logs
pm2 logs inverseiq

# Monitor resources
pm2 monit
```

### Set Up Alerts

```bash
# Install PM2 Plus for advanced monitoring
pm2 link your-secret-key your-public-key
```

### Backup Strategy

```bash
# Create backup script
nano /home/user/backup.sh
```

```bash
#!/bin/bash
# Backup script
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/home/user/backups"

# Backup data
tar -czf $BACKUP_DIR/data_$DATE.tar.gz \
  /home/user/trading-data-collection-service/data

# Keep only last 7 days
find $BACKUP_DIR -name "data_*.tar.gz" -mtime +7 -delete
```

```bash
# Make executable
chmod +x /home/user/backup.sh

# Add to crontab (daily at 2 AM)
crontab -e
# Add: 0 2 * * * /home/user/backup.sh
```

---

## Security Best Practices

### 1. Secure API Keys
```bash
# Never commit .env to git
echo ".env" >> .gitignore

# Use environment variables
export SMTP_PASS="your-password"
```

### 2. Rate Limiting
```javascript
// Add to server.js
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

app.use('/api/', limiter);
```

### 3. Input Validation
```javascript
// Add validation middleware
const { body, validationResult } = require('express-validator');

app.post('/api/submit',
  body('apiKey').isString().trim().escape(),
  body('apiSecret').isString().trim().escape(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    // Process...
  }
);
```

### 4. HTTPS Only
```javascript
// Redirect HTTP to HTTPS
app.use((req, res, next) => {
  if (req.header('x-forwarded-proto') !== 'https' && process.env.NODE_ENV === 'production') {
    res.redirect(`https://${req.header('host')}${req.url}`);
  } else {
    next();
  }
});
```

---

## Testing Deployment

### 1. Test Frontend
```bash
curl https://your-domain.com
```

### 2. Test API
```bash
curl https://your-domain.com/api/health
```

### 3. Test Submission
```bash
curl -X POST https://your-domain.com/api/submit \
  -H "Content-Type: application/json" \
  -d '{"exchange":"binance","apiKey":"test","apiSecret":"test","walletAddress":"test"}'
```

### 4. Test Signals
```bash
curl https://your-domain.com/api/signals
```

---

## Troubleshooting

### Issue: Can't connect to server
```bash
# Check if server is running
pm2 status

# Check logs
pm2 logs inverseiq --lines 100

# Restart server
pm2 restart inverseiq
```

### Issue: CORS errors
```bash
# Check Nginx configuration
sudo nginx -t

# Check server.js CORS settings
# Make sure frontend domain is allowed
```

### Issue: SSL certificate errors
```bash
# Renew certificate
sudo certbot renew

# Check certificate status
sudo certbot certificates
```

---

## Quick Deployment Checklist

- [ ] Server provisioned and accessible
- [ ] Node.js installed
- [ ] Code uploaded and dependencies installed
- [ ] .env file configured
- [ ] PM2 installed and server running
- [ ] Nginx configured as reverse proxy
- [ ] SSL certificate installed
- [ ] Firewall configured
- [ ] Frontend updated with correct API URL
- [ ] CORS configured correctly
- [ ] Monitoring set up
- [ ] Backups configured
- [ ] Trading engine integration tested

---

## Support

For deployment issues:
1. Check server logs: `pm2 logs inverseiq`
2. Check Nginx logs: `sudo tail -f /var/log/nginx/error.log`
3. Test API endpoints with curl
4. Verify environment variables are set

---

## Next Steps After Deployment

1. **Test thoroughly** - Submit test data and verify processing
2. **Monitor performance** - Watch logs and resource usage
3. **Set up alerts** - Get notified of issues
4. **Scale as needed** - Add more servers if traffic increases
5. **Integrate with trading engine** - Connect via your preferred method

Your data collection system is now live and ready to feed your trading engine!
