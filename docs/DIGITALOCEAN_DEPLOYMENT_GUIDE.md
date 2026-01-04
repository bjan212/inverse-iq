# DigitalOcean Deployment Guide - Step by Step

Complete guide to deploy InverseIQ on DigitalOcean from scratch.

---

## Prerequisites

- DigitalOcean account (sign up at digitalocean.com)
- Domain name (optional but recommended)
- Your local project files ready

---

## Part 1: Create DigitalOcean Droplet

### Step 1: Log into DigitalOcean

1. Go to https://cloud.digitalocean.com
2. Log in to your account
3. Click **"Create"** → **"Droplets"**

### Step 2: Choose Droplet Configuration

**Choose an image:**
- Select **Ubuntu 22.04 (LTS) x64**

**Choose a plan:**
- **Basic Plan** (recommended for start)
- **Regular Intel with SSD**
- Select **$6/month** (1 GB RAM, 1 vCPU, 25 GB SSD)
  - For production with more traffic: $12/month (2 GB RAM)

**Choose a datacenter region:**
- Select closest to your target users
- Example: New York, San Francisco, London, etc.

**Authentication:**
- Choose **SSH keys** (recommended) or **Password**

**For SSH Key (Recommended):**

On your Mac:
```bash
# Generate SSH key if you don't have one
ssh-keygen -t ed25519 -C "inverse@irise.ae"

# Display your public key
cat ~/.ssh/id_ed25519.pubcat ~/.ssh/id_ed25519.pub
```

Copy the output and paste it into DigitalOcean's SSH key field.

**Finalize and create:**
- Choose a hostname: `inverseiq-server`
- Click **"Create Droplet"**

### Step 3: Wait for Droplet Creation

- Takes about 1 minute
- Note down the IP address (e.g., 164.90.xxx.xxx)

---

## Part 2: Initial Server Setup

### Step 1: Connect to Your Droplet

```bash
# Replace with your droplet's IP
ssh root@146.190.233.46
```

If using password, enter it when prompted.

### Step 2: Update System

```bash
# Update package list
apt update

# Upgrade installed packages
apt upgrade -y
```

### Step 3: Create a New User (Security Best Practice)

```bash
# Create new user
adduser inverseiq

# Add to sudo group
usermod -aG sudo inverseiq

# Copy SSH keys to new user
rsync --archive --chown=inverseiq:inverseiq ~/.ssh /home/inverseiq
```

### Step 4: Configure Firewall

```bash
# Allow SSH
ufw allow OpenSSH

# Allow HTTP
ufw allow 80/tcp

# Allow HTTPS
ufw allow 443/tcp

# Enable firewall
ufw enable

# Check status
ufw status
```

### Step 5: Switch to New User

```bash
# Exit root session
exit

# Log in as new user
ssh inverseiq@164.90.xxx.xxx
```

---

## Part 3: Install Required Software

### Step 1: Install Node.js

```bash
# Install Node.js 18.x
*curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs*

# Verify installation
node --version  # Should show v18.x.x
npm --version   # Should show 9.x.x
```

### Step 2: Install PM2 (Process Manager)

```bash
# Install PM2 globally
sudo npm install -g pm2

# Verify installation
pm2 --version
```

### Step 3: Install Nginx (Web Server)

```bash
# Install Nginx
sudo apt install -y nginx

# Start Nginx
sudo systemctl start nginx

# Enable Nginx to start on boot
sudo systemctl enable nginx

# Check status
sudo systemctl status nginx
```

### Step 4: Install Certbot (for SSL)

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx
```

---

## Part 4: Upload Your Application

### Method 1: Using SCP (From Your Mac)

```bash
# On your Mac, navigate to project directory
cd /Users/redabhaj/Desktop/xrypt.net\(final\)/trading-data-collection-service

# Create archive (excluding node_modules)
tar -czf inverseiq.tar.gz \
  --exclude='node_modules' \
  --exclude='.git' \
  --exclude='data/*.json' \
  .

# Upload to server
scp inverseiq.tar.gz inverseiq@164.90.xxx.xxx:~/
```

### Method 2: Using Git (Recommended)

**On your Mac:**
```bash
# Initialize git if not already done
cd /Users/redabhaj/Desktop/xrypt.net\(final\)/trading-data-collection-service
git init
git add .
git commit -m "Initial commit"

# Push to GitHub (create repo first on github.com)
git remote add origin https://github.com/yourusername/inverseiq.git
git push -u origin main
```

**On your server:**
```bash
# Install git
sudo apt install -y git

# Clone repository
cd ~
git clone https://github.com/yourusername/inverseiq.git
cd inverseiq
```

---

## Part 5: Set Up Application

### Step 1: Extract Files (if using SCP method)

```bash
# On server
cd ~
tar -xzf inverseiq.tar.gz
cd trading-data-collection-service
```

### Step 2: Install Dependencies

```bash
# Install production dependencies
npm install --production

# This will take a few minutes
```

### Step 3: Create Environment File

```bash
# Create .env file
nano .env
```

**Add this content:**
```env
# Server Configuration
PORT=3000
NODE_ENV=production

# Email Notifications (Optional - configure later)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=InverseIQ <noreply@inverseiq.com>

# Telegram Notifications (Optional - configure later)
TELEGRAM_BOT_TOKEN=your-bot-token-here
```

**Save and exit:**
- Press `Ctrl + X`
- Press `Y`
- Press `Enter`

### Step 4: Create Data Directory

```bash
# Create data directory
mkdir -p data

# Set permissions
chmod 755 data
```

### Step 5: Test Application

```bash
# Test run
node server.js
```

You should see:
```
Server running on port 3000
```

Press `Ctrl + C` to stop.

---

## Part 6: Configure PM2

### Step 1: Start Application with PM2

```bash
# Start application
pm2 start server.js --name inverseiq

# Check status
pm2 status
```

### Step 2: Configure PM2 Startup

```bash
# Generate startup script
pm2 startup

# Copy and run the command it outputs (will look like):
# sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u inverseiq --hp /home/inverseiq

# Save PM2 configuration
pm2 save
```

### Step 3: Useful PM2 Commands

```bash
# View logs
pm2 logs inverseiq

# Restart application
pm2 restart inverseiq

# Stop application
pm2 stop inverseiq

# Monitor resources
pm2 monit
```

---

## Part 7: Configure Nginx

### Step 1: Create Nginx Configuration

```bash
# Create configuration file
sudo nano /etc/nginx/sites-available/inverseiq
```

**Add this configuration:**
```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;  # Replace with your domain or IP

    # Frontend files
    location / {
        root /home/inverseiq/trading-data-collection-service/public;
        index index.html get-paid-for-data.html;
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

**If you don't have a domain yet, use IP address:**
```nginx
server_name 164.90.xxx.xxx;  # Your droplet IP
```

**Save and exit:** `Ctrl + X`, `Y`, `Enter`

### Step 2: Enable Configuration

```bash
# Create symbolic link
sudo ln -s /etc/nginx/sites-available/inverseiq /etc/nginx/sites-enabled/

# Remove default configuration
sudo rm /etc/nginx/sites-enabled/default

# Test configuration
sudo nginx -t
```

Should show: `syntax is ok` and `test is successful`

### Step 3: Restart Nginx

```bash
sudo systemctl restart nginx
```

---

## Part 8: Set Up Domain (Optional but Recommended)

### Step 1: Point Domain to Droplet

**In your domain registrar (GoDaddy, Namecheap, etc.):**

1. Go to DNS settings
2. Add/Edit A records:
   - **Type:** A
   - **Name:** @ (or leave blank)
   - **Value:** 164.90.xxx.xxx (your droplet IP)
   - **TTL:** 3600

3. Add another A record for www:
   - **Type:** A
   - **Name:** www
   - **Value:** 164.90.xxx.xxx
   - **TTL:** 3600

4. Wait 5-30 minutes for DNS propagation

### Step 2: Update Nginx Configuration

```bash
# Edit Nginx config
sudo nano /etc/nginx/sites-available/inverseiq

# Update server_name line:
server_name yourdomain.com www.yourdomain.com;

# Save and restart
sudo nginx -t
sudo systemctl restart nginx
```

---

## Part 9: Set Up SSL Certificate (HTTPS)

### Step 1: Obtain SSL Certificate

```bash
# Get certificate (replace with your domain)
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

**Follow the prompts:**
1. Enter email address
2. Agree to terms (Y)
3. Share email with EFF (optional)
4. Choose redirect option: **2** (Redirect HTTP to HTTPS)

### Step 2: Test Auto-Renewal

```bash
# Test renewal
sudo certbot renew --dry-run
```

Should show: `Congratulations, all simulated renewals succeeded`

### Step 3: Verify HTTPS

Visit: `https://yourdomain.com`

You should see a secure padlock icon! 🔒

---

## Part 10: Test Your Deployment

### Step 1: Test Frontend

```bash
# From your Mac
curl https://yourdomain.com
# or
curl http://164.90.xxx.xxx
```

### Step 2: Test API

```bash
# Health check
curl https://yourdomain.com/api/health

# Should return: {"status":"ok","timestamp":"..."}
```

### Step 3: Test Submission

```bash
curl -X POST https://yourdomain.com/api/submit \
  -H "Content-Type: application/json" \
  -d '{
    "exchange": "binance",
    "apiKey": "test",
    "apiSecret": "test",
    "walletAddress": "test"
  }'
```

### Step 4: Test Signals

```bash
curl https://yourdomain.com/api/signals
```

### Step 5: Test Notifications

```bash
# Subscribe
curl -X POST https://yourdomain.com/api/notifications/subscribe \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'

# Get stats
curl https://yourdomain.com/api/notifications/stats
```

---

## Part 11: Monitor and Maintain

### View Logs

```bash
# PM2 logs
pm2 logs inverseiq

# Nginx access logs
sudo tail -f /var/log/nginx/access.log

# Nginx error logs
sudo tail -f /var/log/nginx/error.log

# System logs
sudo journalctl -u nginx -f
```

### Monitor Resources

```bash
# PM2 monitoring
pm2 monit

# System resources
htop  # Install with: sudo apt install htop

# Disk usage
df -h

# Memory usage
free -h
```

### Set Up Automated Backups

```bash
# Create backup script
nano ~/backup.sh
```

**Add:**
```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/home/inverseiq/backups"

# Create backup directory
mkdir -p $BACKUP_DIR

# Backup data
tar -czf $BACKUP_DIR/data_$DATE.tar.gz \
  /home/inverseiq/trading-data-collection-service/data

# Keep only last 7 days
find $BACKUP_DIR -name "data_*.tar.gz" -mtime +7 -delete

echo "Backup completed: data_$DATE.tar.gz"
```

```bash
# Make executable
chmod +x ~/backup.sh

# Test backup
./backup.sh

# Schedule daily backups (2 AM)
crontab -e

# Add this line:
0 2 * * * /home/inverseiq/backup.sh >> /home/inverseiq/backup.log 2>&1
```

---

## Part 12: Update Application

### When You Need to Update Code:

**Method 1: Using Git**
```bash
# SSH into server
ssh inverseiq@your-server-ip

# Navigate to project
cd ~/trading-data-collection-service

# Pull latest changes
git pull origin main

# Install any new dependencies
npm install --production

# Restart application
pm2 restart inverseiq
```

**Method 2: Using SCP**
```bash
# On your Mac
cd /Users/redabhaj/Desktop/xrypt.net\(final\)/trading-data-collection-service
tar -czf inverseiq-update.tar.gz --exclude='node_modules' .
scp inverseiq-update.tar.gz inverseiq@your-server-ip:~/

# On server
cd ~/trading-data-collection-service
tar -xzf ~/inverseiq-update.tar.gz
npm install --production
pm2 restart inverseiq
```

---

## Troubleshooting

### Issue: Can't connect to server

```bash
# Check if server is running
pm2 status

# Check logs
pm2 logs inverseiq --lines 50

# Restart server
pm2 restart inverseiq
```

### Issue: Nginx not working

```bash
# Check Nginx status
sudo systemctl status nginx

# Test configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx

# Check error logs
sudo tail -f /var/log/nginx/error.log
```

### Issue: SSL certificate problems

```bash
# Renew certificate
sudo certbot renew

# Check certificate status
sudo certbot certificates
```

### Issue: Out of disk space

```bash
# Check disk usage
df -h

# Clean up old logs
pm2 flush

# Clean npm cache
npm cache clean --force

# Remove old backups
rm ~/backups/data_old*.tar.gz
```

### Issue: High memory usage

```bash
# Check memory
free -h

# Restart application
pm2 restart inverseiq

# Consider upgrading droplet size
```

---

## Security Checklist

- [x] Firewall configured (UFW)
- [x] Non-root user created
- [x] SSH key authentication
- [x] SSL certificate installed
- [x] Regular backups scheduled
- [ ] Fail2ban installed (optional)
- [ ] Monitoring set up (optional)

### Optional: Install Fail2ban (Prevents brute force attacks)

```bash
sudo apt install fail2ban
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

---

## Cost Estimate

**DigitalOcean Droplet:**
- Basic: $6/month (1 GB RAM) - Good for testing
- Standard: $12/month (2 GB RAM) - Recommended for production
- Professional: $24/month (4 GB RAM) - For high traffic

**Domain Name:**
- $10-15/year (from registrar)

**Total Monthly Cost:**
- Minimum: $6/month + domain
- Recommended: $12/month + domain

---

## Quick Command Reference

```bash
# Server Management
pm2 status                    # Check app status
pm2 logs inverseiq           # View logs
pm2 restart inverseiq        # Restart app
pm2 monit                    # Monitor resources

# Nginx
sudo systemctl status nginx  # Check Nginx status
sudo nginx -t                # Test configuration
sudo systemctl restart nginx # Restart Nginx

# SSL
sudo certbot renew          # Renew certificate
sudo certbot certificates   # Check certificates

# System
df -h                       # Disk usage
free -h                     # Memory usage
htop                        # Resource monitor
```

---

## Success! 🎉

Your InverseIQ application is now live on DigitalOcean!

**Access your application:**
- Frontend: https://yourdomain.com
- API: https://yourdomain.com/api
- Signals: https://yourdomain.com/api/signals
- Admin: https://yourdomain.com/admin.html

**Next Steps:**
1. Configure email/Telegram notifications in `.env`
2. Test all functionality
3. Share the data collection page with traders
4. Monitor logs and performance
5. Set up your trading engine integration

Need help? Check the logs with `pm2 logs inverseiq`
