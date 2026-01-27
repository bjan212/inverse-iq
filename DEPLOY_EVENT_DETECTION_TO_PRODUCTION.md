# Deploy Market Event Detection System to Production

## 🚀 Quick Deployment Guide

Your Market Event Detection System is now ready to deploy to your live DigitalOcean droplet for beta testing!

---

## ✅ Pre-Deployment Checklist

- [x] Code pushed to GitHub ✅
- [x] Comprehensive testing completed ✅
- [x] All files committed ✅
- [ ] DigitalOcean droplet IP address ready
- [ ] SSH access to droplet configured
- [ ] Domain name configured (optional)

---

## 🎯 One-Command Deployment

### Option 1: Deploy to Existing DigitalOcean Droplet

```bash
# Replace YOUR_DROPLET_IP with your actual IP
./scripts/pull-on-digitalocean.sh YOUR_DROPLET_IP
```

**Example:**
```bash
./scripts/pull-on-digitalocean.sh 164.92.123.456
```

This script will:
1. ✅ SSH into your droplet
2. ✅ Pull latest code from GitHub
3. ✅ Install dependencies
4. ✅ Restart the application with PM2
5. ✅ Show you the status and logs

---

## 📋 Step-by-Step Manual Deployment

If you prefer to deploy manually or troubleshoot:

### Step 1: SSH into Your Droplet

```bash
ssh root@YOUR_DROPLET_IP
```

### Step 2: Navigate to Project Directory

```bash
cd /opt/trading-data-collection-service
# or wherever your project is located
```

### Step 3: Pull Latest Changes

```bash
git pull origin main
```

### Step 4: Install Dependencies

```bash
npm install --production
```

### Step 5: Restart Application

```bash
pm2 restart xrypt
# or
pm2 restart all
```

### Step 6: Verify Deployment

```bash
pm2 status
pm2 logs xrypt --lines 50
```

---

## 🆕 First-Time Setup on New Droplet

If this is your first deployment to a new droplet:

### 1. Create DigitalOcean Droplet

- Go to https://digitalocean.com
- Create Ubuntu 22.04 droplet
- Choose $6/month plan (sufficient for beta)
- Note your droplet IP address

### 2. Initial Server Setup

```bash
# SSH into droplet
ssh root@YOUR_DROPLET_IP

# Update system
apt update && apt upgrade -y

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs

# Install PM2
npm install -g pm2

# Install Git
apt install -y git

# Create project directory
mkdir -p /opt/trading-data-collection-service
cd /opt/trading-data-collection-service

# Clone repository
git clone https://github.com/bjan212/inverse-iq.git .

# Install dependencies
npm install --production

# Start application
pm2 start server.js --name xrypt

# Save PM2 configuration
pm2 startup
pm2 save

# Install Nginx (optional, for domain)
apt install -y nginx

# Install SSL (optional, for HTTPS)
apt install -y certbot python3-certbot-nginx
```

---

## 🔧 Environment Variables

Make sure these are set on your droplet:

```bash
# On your droplet, create/edit .env file
nano /opt/trading-data-collection-service/.env
```

Add:
```env
# Server Configuration
PORT=3000
NODE_ENV=production

# Event Detection (NEW)
EVENT_DETECTION_ENABLED=true
EVENT_DETECTION_INTERVAL=3600000  # 1 hour
EVENT_CONFIDENCE_THRESHOLD=70

# Notification Settings
EMAIL_ENABLED=true
TELEGRAM_ENABLED=true
TELEGRAM_BOT_TOKEN=your_bot_token
TELEGRAM_CHAT_ID=your_chat_id

# Email Settings
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password

# Database
DATABASE_PATH=./data/hybrid_pattern_database.json

# API Keys (if needed)
BINANCE_API_KEY=your_key
BINANCE_API_SECRET=your_secret
```

---

## 🧪 Testing on Production

After deployment, test the event detection:

### 1. SSH into Droplet

```bash
ssh root@YOUR_DROPLET_IP
cd /opt/trading-data-collection-service
```

### 2. Run Quick Test

```bash
node scripts/quickStartEventDetection.js
```

### 3. Check Logs

```bash
pm2 logs xrypt --lines 100
```

### 4. Test API Endpoints

```bash
# Test event detection endpoint
curl http://YOUR_DROPLET_IP:3000/api/events/detect/BTCUSDT

# Test health check
curl http://YOUR_DROPLET_IP:3000/health
```

---

## 🌐 Setting Up Domain (Optional)

### 1. Point Domain to Droplet

In your domain registrar (Namecheap, GoDaddy, etc.):
- Create A record: `@` → `YOUR_DROPLET_IP`
- Create A record: `www` → `YOUR_DROPLET_IP`

### 2. Configure Nginx

```bash
# On droplet
nano /etc/nginx/sites-available/xrypt
```

Add:
```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable site:
```bash
ln -s /etc/nginx/sites-available/xrypt /etc/nginx/sites-enabled/
nginx -t
systemctl restart nginx
```

### 3. Add SSL Certificate

```bash
certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

---

## 📊 Monitoring Event Detection

### View Event Detection Logs

```bash
# On droplet
pm2 logs xrypt | grep "Event"
```

### Check Event Detection Statistics

```bash
# SSH into droplet
ssh root@YOUR_DROPLET_IP

# Run statistics check
cd /opt/trading-data-collection-service
node -e "
const EnhancedHybridEngine = require('./src/ai-engine/enhancedHybridEngine');
const engine = new EnhancedHybridEngine();
const stats = engine.getEnhancedStatistics();
console.log(JSON.stringify(stats.events, null, 2));
"
```

### Set Up Automated Event Detection

Add to crontab for hourly event detection:

```bash
# On droplet
crontab -e
```

Add:
```cron
# Run event detection every hour
0 * * * * cd /opt/trading-data-collection-service && node scripts/quickStartEventDetection.js >> /var/log/event-detection.log 2>&1
```

---

## 🐛 Troubleshooting

### Issue: Deployment Script Fails

**Solution:**
```bash
# Check SSH connection
ssh root@YOUR_DROPLET_IP

# Manually pull and restart
cd /opt/trading-data-collection-service
git pull
npm install --production
pm2 restart xrypt
```

### Issue: Application Won't Start

**Solution:**
```bash
# Check logs
pm2 logs xrypt --lines 100

# Check if port is in use
lsof -i :3000

# Restart PM2
pm2 delete xrypt
pm2 start server.js --name xrypt
pm2 save
```

### Issue: Event Detection Not Working

**Solution:**
```bash
# Check if files exist
ls -la src/ai-engine/marketEventDetector.js
ls -la src/ai-engine/eventPatternTrainer.js

# Test manually
node scripts/quickStartEventDetection.js

# Check environment variables
cat .env | grep EVENT
```

### Issue: Out of Memory

**Solution:**
```bash
# Increase Node.js memory
pm2 delete xrypt
pm2 start server.js --name xrypt --node-args="--max-old-space-size=2048"
pm2 save
```

---

## 📈 Performance Optimization

### 1. Enable Caching

The event detection system already includes caching. Verify it's working:

```bash
# Check cache statistics
node -e "
const MarketEventDetector = require('./src/ai-engine/marketEventDetector');
const detector = new MarketEventDetector();
console.log('Cache TTL:', detector.cacheTTL / 1000 / 60, 'minutes');
"
```

### 2. Optimize PM2 Configuration

```bash
# Use cluster mode for better performance
pm2 delete xrypt
pm2 start ecosystem.config.js
pm2 save
```

### 3. Monitor Resource Usage

```bash
# Check memory and CPU
pm2 monit

# Check system resources
htop
```

---

## 🎯 Beta Testing Checklist

Before inviting beta users:

- [ ] Application running on production
- [ ] Event detection tested and working
- [ ] Notifications configured (email/Telegram)
- [ ] Domain configured (optional)
- [ ] SSL certificate installed (optional)
- [ ] Monitoring set up
- [ ] Backup strategy in place
- [ ] Error logging configured

---

## 🚀 Quick Commands Reference

```bash
# Deploy latest changes
./scripts/pull-on-digitalocean.sh YOUR_DROPLET_IP

# Check application status
ssh root@YOUR_DROPLET_IP 'pm2 status'

# View logs
ssh root@YOUR_DROPLET_IP 'pm2 logs xrypt --lines 50'

# Restart application
ssh root@YOUR_DROPLET_IP 'pm2 restart xrypt'

# Test event detection
ssh root@YOUR_DROPLET_IP 'cd /opt/trading-data-collection-service && node scripts/quickStartEventDetection.js'
```

---

## 📞 Support

If you encounter issues:

1. Check logs: `pm2 logs xrypt`
2. Review error messages
3. Check GitHub issues
4. Consult documentation in `docs/`

---

## ✅ Deployment Complete!

Your Market Event Detection System is now live and ready for beta testing!

**Next Steps:**
1. Test all features on production
2. Invite beta users
3. Monitor performance and accuracy
4. Collect feedback
5. Iterate and improve

**Access Your Application:**
- HTTP: `http://YOUR_DROPLET_IP:3000`
- With domain: `https://yourdomain.com`

**Test Event Detection:**
- API: `http://YOUR_DROPLET_IP:3000/api/events/detect/BTCUSDT`
- Dashboard: `http://YOUR_DROPLET_IP:3000/signals-enhanced.html`

Good luck with your beta testing! 🚀
