# 🚀 Deploy to Your Existing DigitalOcean Server

## Quick Deployment for inverseiq@ User

Since you already have DigitalOcean credentials, here's the streamlined deployment process.

---

## 📦 STEP 1: Upload Your Application

**From your Mac terminal:**

```bash
# Navigate to project directory
cd /Users/redabhaj/Desktop/xrypt.net\(final\)/trading-data-collection-service

# Upload to your DigitalOcean server
# Replace YOUR_SERVER_IP with your actual server IP
scp xrypt-digitalocean-deploy.tar.gz inverseiq@YOUR_SERVER_IP:~/

# Example:
# scp xrypt-digitalocean-deploy.tar.gz inverseiq@146.190.233.46:~/
```

---

## 🔧 STEP 2: Connect and Deploy

**SSH into your server:**

```bash
ssh inverseiq@YOUR_SERVER_IP

# Example:
# ssh inverseiq@146.190.233.46
```

---

## 📥 STEP 3: Extract and Setup (On Server)

```bash
# Create project directory
mkdir -p ~/xrypt-service
cd ~/xrypt-service

# Extract deployment package
tar -xzf ~/xrypt-digitalocean-deploy.tar.gz

# Install dependencies
npm install --production

# Create/update .env file
nano .env
```

**Add this to .env:**

```env
PORT=3000
NODE_ENV=production

# Email Configuration
EMAIL_HOST=smtp.protonmail.ch
EMAIL_PORT=587
EMAIL_USER=notify@xrypt.net
EMAIL_PASS=your-protonmail-password
EMAIL_FROM=XryptNotifications <notify@xrypt.net>

# Telegram Configuration (if you have it)
TELEGRAM_BOT_TOKEN=your-telegram-bot-token
TELEGRAM_CHAT_ID=your-telegram-chat-id
```

**Save:** `Ctrl+X`, `Y`, `Enter`

---

## 🚀 STEP 4: Start with PM2

```bash
# Stop any existing xrypt process
pm2 stop xrypt 2>/dev/null || true
pm2 delete xrypt 2>/dev/null || true

# Start the application
pm2 start server.js --name xrypt

# Save PM2 configuration
pm2 save

# Check status
pm2 status

# View logs
pm2 logs xrypt --lines 20
```

---

## 🌐 STEP 5: Update Nginx Configuration

```bash
# Edit Nginx configuration
sudo nano /etc/nginx/sites-available/inverseiq
```

**Update or add this configuration:**

```nginx
server {
    listen 80;
    server_name YOUR_SERVER_IP www.xrypt.net xrypt.net;

    # Serve static files
    location / {
        root /home/inverseiq/xrypt-service/public;
        index index.html;
        try_files $uri $uri/ =404;
    }

    # Proxy API requests
    location /api/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
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

**Save and test:**

```bash
# Test Nginx configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

---

## ✅ STEP 6: Test Your Deployment

**From your Mac:**

```bash
# Test API
curl http://YOUR_SERVER_IP/api/health

# Should return: {"status":"ok","timestamp":"..."}

# Test signals
curl http://YOUR_SERVER_IP/api/signals
```

**In your browser:**
- Visit: `http://YOUR_SERVER_IP`
- Visit: `http://YOUR_SERVER_IP/signals.html`
- Visit: `http://YOUR_SERVER_IP/admin.html`

---

## 🔒 STEP 7: Set Up SSL (If you have a domain)

**If your domain is already pointing to the server:**

```bash
# Get SSL certificate
sudo certbot --nginx -d xrypt.net -d www.xrypt.net

# Follow prompts and choose option 2 (redirect HTTP to HTTPS)
```

**Your site will now be live at:** `https://xrypt.net`

---

## 🔄 QUICK UPDATE SCRIPT

**Save this for future updates:**

```bash
# On your Mac - create update package
cd /Users/redabhaj/Desktop/xrypt.net\(final\)/trading-data-collection-service
tar -czf xrypt-update.tar.gz --exclude='node_modules' --exclude='.git' --exclude='data/*.json' .
scp xrypt-update.tar.gz inverseiq@YOUR_SERVER_IP:~/

# On server - apply update
ssh inverseiq@YOUR_SERVER_IP
cd ~/xrypt-service
tar -xzf ~/xrypt-update.tar.gz
npm install --production
pm2 restart xrypt
pm2 logs xrypt
```

---

## 🛠️ USEFUL COMMANDS

```bash
# View application logs
pm2 logs xrypt

# Restart application
pm2 restart xrypt

# Monitor resources
pm2 monit

# Check server status
pm2 status

# View Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

---

## 🆘 TROUBLESHOOTING

### Application not starting:
```bash
cd ~/xrypt-service
pm2 logs xrypt --lines 50
pm2 restart xrypt
```

### Port 3000 already in use:
```bash
# Find what's using port 3000
sudo lsof -i :3000

# Kill the process if needed
sudo kill -9 PID_NUMBER
```

### Nginx errors:
```bash
sudo nginx -t
sudo systemctl status nginx
sudo systemctl restart nginx
```

### Permission issues:
```bash
# Fix ownership
sudo chown -R inverseiq:inverseiq ~/xrypt-service
chmod -R 755 ~/xrypt-service
```

---

## 📊 VERIFY DEPLOYMENT

Run these checks to ensure everything is working:

```bash
# 1. Check if Node.js app is running
pm2 status

# 2. Check if port 3000 is listening
sudo netstat -tulpn | grep 3000

# 3. Check Nginx status
sudo systemctl status nginx

# 4. Test local API
curl http://localhost:3000/api/health

# 5. Check disk space
df -h

# 6. Check memory
free -h
```

---

## ✅ DEPLOYMENT CHECKLIST

- [ ] Deployment package uploaded
- [ ] Application extracted in ~/xrypt-service
- [ ] Dependencies installed
- [ ] .env file configured
- [ ] PM2 started successfully
- [ ] Nginx configured and restarted
- [ ] Site accessible via browser
- [ ] API endpoints responding
- [ ] SSL certificate installed (if domain configured)

---

## 🎉 SUCCESS!

Your Xrypt Trading Service is now live!

**Access your application:**
- **Website:** http://YOUR_SERVER_IP (or https://xrypt.net)
- **API:** http://YOUR_SERVER_IP/api
- **Signals:** http://YOUR_SERVER_IP/signals.html
- **Admin:** http://YOUR_SERVER_IP/admin.html

**Monitor your application:**
```bash
pm2 monit
```

**View real-time logs:**
```bash
pm2 logs xrypt
