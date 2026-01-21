# InverseIQ - Production Deployment Guide

## 🎯 Overview

This guide covers everything needed to run InverseIQ in production for:
1. **Trading Data Collection** - Collecting data from traders
2. **Signal Generation** - AI-powered trading signals
3. **Web Platform** - User interface and API

---

## 💻 System Requirements

### **Minimum Requirements (Development/Testing)**

```
CPU: 2 cores (2.0 GHz+)
RAM: 4 GB
Storage: 20 GB SSD
OS: Ubuntu 20.04+ / macOS / Windows 10+
Node.js: 16.x or higher
```

**Cost:** $5-$10/month (DigitalOcean, Linode)

---

### **Recommended Requirements (Production)**

```
CPU: 4 cores (2.5 GHz+)
RAM: 8 GB
Storage: 50 GB SSD
OS: Ubuntu 22.04 LTS
Node.js: 18.x LTS
```

**Cost:** $20-$40/month (DigitalOcean, AWS, Google Cloud)

---

### **Scalable Requirements (High Traffic)**

```
CPU: 8+ cores (3.0 GHz+)
RAM: 16+ GB
Storage: 100+ GB SSD
OS: Ubuntu 22.04 LTS
Node.js: 18.x LTS
Load Balancer: Yes
Database: PostgreSQL or MongoDB
```

**Cost:** $80-$200/month

---

## 🚀 Quick Start (Local Development)

### **1. Install Dependencies**

```bash
# Clone repository
cd trading-data-collection-service

# Install Node.js dependencies
npm install

# Verify installation
node --version  # Should be 16.x or higher
npm --version   # Should be 8.x or higher
```

### **2. Start the Server**

```bash
# Start the web server
node server.js

# Server will start on http://localhost:3000
```

### **3. Test Data Collection**

```bash
# Test with Binance
node scripts/collect.js \
  --platform binance \
  --api-key YOUR_KEY \
  --api-secret YOUR_SECRET

# Test with other exchanges
node scripts/collect.js --platform bybit --api-key KEY --api-secret SECRET
node scripts/collect.js --platform okx --api-key KEY --api-secret SECRET --passphrase PASS
node scripts/collect.js --platform mexc --api-key KEY --api-secret SECRET
```

### **4. Bootstrap AI with Public Data**

```bash
# Collect public market data and train AI
node scripts/bootstrapHybridAI.js

# This will:
# - Fetch 90 days of data from Binance
# - Analyze for failure patterns
# - Build initial pattern database
# - Generate first signals
```

### **5. Generate Signals**

```bash
# Run AI engine to generate signals
node scripts/runAIEngine.js

# View signals at:
# http://localhost:3000/signals.html
# http://localhost:3000/signals-enhanced.html
```

---

## 🌐 Production Deployment

### **Option 1: DigitalOcean (Recommended for Beginners)**

#### **Step 1: Create Droplet**

```bash
# 1. Go to digitalocean.com
# 2. Create account
# 3. Create Droplet:
#    - Ubuntu 22.04 LTS
#    - Basic plan: $20/month (4GB RAM, 2 CPUs)
#    - Choose datacenter region
#    - Add SSH key
```

#### **Step 2: Connect to Server**

```bash
# SSH into your droplet
ssh root@YOUR_DROPLET_IP

# Update system
apt update && apt upgrade -y
```

#### **Step 3: Install Node.js**

```bash
# Install Node.js 18.x LTS
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
apt install -y nodejs

# Verify installation
node --version  # Should show v18.x.x
npm --version   # Should show 9.x.x
```

#### **Step 4: Install PM2 (Process Manager)**

```bash
# Install PM2 globally
npm install -g pm2

# Verify installation
pm2 --version
```

#### **Step 5: Deploy Application**

```bash
# Create app directory
mkdir -p /var/www/inverseiq
cd /var/www/inverseiq

# Clone your repository (or upload files)
git clone YOUR_REPO_URL .

# Or upload via SCP:
# scp -r /local/path/* root@YOUR_IP:/var/www/inverseiq/

# Install dependencies
npm install --production
```

#### **Step 6: Configure Environment**

```bash
# Create .env file
nano .env

# Add configuration:
PORT=3000
NODE_ENV=production
DATA_DIR=/var/www/inverseiq/data
LOG_LEVEL=info
```

#### **Step 7: Start with PM2**

```bash
# Start server
pm2 start server.js --name inverseiq

# Start AI engine (runs continuously)
pm2 start scripts/runAIEngine.js --name ai-engine

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
# Follow the command it gives you
```

#### **Step 8: Setup Nginx (Reverse Proxy)**

```bash
# Install Nginx
apt install -y nginx

# Create Nginx configuration
nano /etc/nginx/sites-available/inverseiq

# Add this configuration:
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}

# Enable site
ln -s /etc/nginx/sites-available/inverseiq /etc/nginx/sites-enabled/
nginx -t
systemctl restart nginx
```

#### **Step 9: Setup SSL (HTTPS)**

```bash
# Install Certbot
apt install -y certbot python3-certbot-nginx

# Get SSL certificate
certbot --nginx -d your-domain.com

# Auto-renewal is setup automatically
```

#### **Step 10: Setup Firewall**

```bash
# Configure UFW firewall
ufw allow 22    # SSH
ufw allow 80    # HTTP
ufw allow 443   # HTTPS
ufw enable
```

---

### **Option 2: AWS EC2**

#### **Step 1: Launch EC2 Instance**

```bash
# 1. Go to AWS Console
# 2. Launch EC2 Instance:
#    - Ubuntu Server 22.04 LTS
#    - t3.medium (2 vCPU, 4GB RAM)
#    - 30 GB gp3 storage
#    - Create security group:
#      - SSH (22) from your IP
#      - HTTP (80) from anywhere
#      - HTTPS (443) from anywhere
```

#### **Step 2: Connect and Setup**

```bash
# Connect via SSH
ssh -i your-key.pem ubuntu@YOUR_EC2_IP

# Follow same steps as DigitalOcean (Steps 2-10)
```

---

### **Option 3: Google Cloud Platform**

#### **Step 1: Create VM Instance**

```bash
# 1. Go to GCP Console
# 2. Create Compute Engine VM:
#    - Ubuntu 22.04 LTS
#    - e2-medium (2 vCPU, 4GB RAM)
#    - 30 GB SSD
#    - Allow HTTP/HTTPS traffic
```

#### **Step 2: Connect and Setup**

```bash
# Connect via SSH (browser or gcloud CLI)
gcloud compute ssh YOUR_INSTANCE_NAME

# Follow same steps as DigitalOcean (Steps 2-10)
```

---

## 📊 Database Setup (Optional but Recommended)

### **Option 1: MongoDB (Recommended)**

#### **Install MongoDB**

```bash
# Import MongoDB public key
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -

# Add MongoDB repository
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list

# Install MongoDB
apt update
apt install -y mongodb-org

# Start MongoDB
systemctl start mongod
systemctl enable mongod
```

#### **Configure MongoDB**

```bash
# Edit MongoDB config
nano /etc/mongod.conf

# Change bindIp to:
bindIp: 127.0.0.1

# Restart MongoDB
systemctl restart mongod
```

#### **Update Application**

```javascript
// Install MongoDB driver
npm install mongodb

// Update server.js to use MongoDB instead of JSON files
const { MongoClient } = require('mongodb');
const client = new MongoClient('mongodb://localhost:27017');
const db = client.db('inverseiq');
```

---

### **Option 2: PostgreSQL**

#### **Install PostgreSQL**

```bash
# Install PostgreSQL
apt install -y postgresql postgresql-contrib

# Start PostgreSQL
systemctl start postgresql
systemctl enable postgresql
```

#### **Configure PostgreSQL**

```bash
# Switch to postgres user
sudo -u postgres psql

# Create database and user
CREATE DATABASE inverseiq;
CREATE USER inverseiq_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE inverseiq TO inverseiq_user;
\q
```

---

## 🔄 Automated Tasks

### **Setup Cron Jobs**

```bash
# Edit crontab
crontab -e

# Add these jobs:

# Bootstrap AI with public data daily at 2 AM
0 2 * * * cd /var/www/inverseiq && node scripts/bootstrapHybridAI.js >> /var/log/inverseiq/bootstrap.log 2>&1

# Generate signals every 5 minutes
*/5 * * * * cd /var/www/inverseiq && node scripts/runAIEngine.js >> /var/log/inverseiq/signals.log 2>&1

# Backup database daily at 3 AM
0 3 * * * cd /var/www/inverseiq && tar -czf /backups/inverseiq-$(date +\%Y\%m\%d).tar.gz data/ >> /var/log/inverseiq/backup.log 2>&1

# Clean old logs weekly
0 0 * * 0 find /var/log/inverseiq -name "*.log" -mtime +30 -delete
```

---

## 📈 Monitoring & Logging

### **Setup PM2 Monitoring**

```bash
# View logs
pm2 logs inverseiq
pm2 logs ai-engine

# Monitor processes
pm2 monit

# View process list
pm2 list

# Restart if needed
pm2 restart inverseiq
pm2 restart ai-engine
```

### **Setup Log Rotation**

```bash
# Create logrotate config
nano /etc/logrotate.d/inverseiq

# Add this:
/var/log/inverseiq/*.log {
    daily
    rotate 30
    compress
    delaycompress
    notifempty
    create 0640 www-data www-data
    sharedscripts
    postrotate
        pm2 reloadLogs
    endscript
}
```

---

## 🔒 Security Best Practices

### **1. Firewall Configuration**

```bash
# Only allow necessary ports
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp   # SSH
ufw allow 80/tcp   # HTTP
ufw allow 443/tcp  # HTTPS
ufw enable
```

### **2. SSH Hardening**

```bash
# Edit SSH config
nano /etc/ssh/sshd_config

# Change these settings:
PermitRootLogin no
PasswordAuthentication no
PubkeyAuthentication yes
Port 2222  # Change default port

# Restart SSH
systemctl restart sshd
```

### **3. Fail2Ban (Brute Force Protection)**

```bash
# Install Fail2Ban
apt install -y fail2ban

# Configure
cp /etc/fail2ban/jail.conf /etc/fail2ban/jail.local
nano /etc/fail2ban/jail.local

# Enable for SSH
[sshd]
enabled = true
port = 2222
maxretry = 3
bantime = 3600

# Start Fail2Ban
systemctl start fail2ban
systemctl enable fail2ban
```

### **4. Environment Variables**

```bash
# Never commit sensitive data
# Use environment variables

# Create .env file (not in git)
nano .env

# Add:
BINANCE_API_KEY=your_key
BINANCE_API_SECRET=your_secret
MONGODB_URI=mongodb://localhost:27017/inverseiq
JWT_SECRET=your_random_secret
```

---

## 🚀 Performance Optimization

### **1. Enable Gzip Compression**

```bash
# Edit Nginx config
nano /etc/nginx/nginx.conf

# Add in http block:
gzip on;
gzip_vary on;
gzip_proxied any;
gzip_comp_level 6;
gzip_types text/plain text/css text/xml text/javascript application/json application/javascript application/xml+rss;
```

### **2. Setup Caching**

```bash
# Add to Nginx server block:
location ~* \.(jpg|jpeg|png|gif|ico|css|js)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

### **3. Node.js Clustering**

```javascript
// Create cluster.js
const cluster = require('cluster');
const os = require('os');

if (cluster.isMaster) {
    const numCPUs = os.cpus().length;
    for (let i = 0; i < numCPUs; i++) {
        cluster.fork();
    }
} else {
    require('./server.js');
}

// Start with PM2:
// pm2 start cluster.js -i max
```

---

## 📊 Scaling Strategy

### **Phase 1: Single Server (0-1,000 users)**

```
Server: $20-$40/month
- 1 server running everything
- PM2 for process management
- Nginx for reverse proxy
- MongoDB for data storage
```

**Handles:** 1,000 concurrent users, 10,000 signals/day

---

### **Phase 2: Separated Services (1,000-10,000 users)**

```
Web Server: $40/month
- Handles HTTP requests
- Serves static files
- API endpoints

AI Server: $80/month
- Runs AI engine
- Generates signals
- Processes data

Database Server: $40/month
- MongoDB or PostgreSQL
- Dedicated storage
- Automated backups
```

**Handles:** 10,000 concurrent users, 100,000 signals/day

---

### **Phase 3: Load Balanced (10,000+ users)**

```
Load Balancer: $20/month
- Distributes traffic
- Health checks
- SSL termination

Web Servers (2x): $80/month
- Horizontal scaling
- Redundancy
- High availability

AI Servers (2x): $160/month
- Parallel processing
- Faster signal generation
- Redundancy

Database Cluster: $200/month
- Master-slave replication
- Automatic failover
- High availability

CDN: $50/month
- Static asset delivery
- Global distribution
- Reduced latency
```

**Handles:** 100,000+ concurrent users, 1M+ signals/day

**Total Cost:** $510/month

---

## 💰 Cost Breakdown

### **Minimum Setup (Development)**

```
Server: $5/month (DigitalOcean Basic)
Domain: $12/year
SSL: Free (Let's Encrypt)
---
Total: $6/month
```

### **Production Setup (Small Scale)**

```
Server: $40/month (4GB RAM, 2 CPUs)
Domain: $12/year
SSL: Free (Let's Encrypt)
Backups: $5/month
Monitoring: Free (PM2)
---
Total: $46/month
```

### **Production Setup (Medium Scale)**

```
Web Server: $40/month
AI Server: $80/month
Database: $40/month
Load Balancer: $20/month
Domain: $12/year
SSL: Free
Backups: $20/month
Monitoring: $29/month (DataDog/New Relic)
---
Total: $230/month
```

### **Enterprise Setup (Large Scale)**

```
Web Servers (2x): $160/month
AI Servers (2x): $320/month
Database Cluster: $200/month
Load Balancer: $40/month
CDN: $50/month
Domain: $12/year
SSL: Free
Backups: $50/month
Monitoring: $99/month
---
Total: $920/month
```

---

## 🔧 Maintenance Tasks

### **Daily**
- [ ] Check PM2 process status
- [ ] Review error logs
- [ ] Monitor server resources
- [ ] Verify signal generation

### **Weekly**
- [ ] Review performance metrics
- [ ] Check disk space
- [ ] Update dependencies (if needed)
- [ ] Test backup restoration

### **Monthly**
- [ ] Security updates
- [ ] Database optimization
- [ ] Log cleanup
- [ ] Performance review

### **Quarterly**
- [ ] Full system audit
- [ ] Disaster recovery test
- [ ] Capacity planning
- [ ] Cost optimization

---

## 🆘 Troubleshooting

### **Server Won't Start**

```bash
# Check PM2 logs
pm2 logs inverseiq --lines 100

# Check if port is in use
lsof -i :3000

# Restart PM2
pm2 restart all

# Check system resources
htop
df -h
```

### **High CPU Usage**

```bash
# Check which process
top

# Restart AI engine
pm2 restart ai-engine

# Scale down signal generation frequency
# Edit crontab to run less frequently
```

### **Out of Memory**

```bash
# Check memory usage
free -h

# Restart services
pm2 restart all

# Upgrade server if needed
# Or optimize code to use less memory
```

### **Database Connection Issues**

```bash
# Check MongoDB status
systemctl status mongod

# Restart MongoDB
systemctl restart mongod

# Check logs
tail -f /var/log/mongodb/mongod.log
```

---

## 📋 Deployment Checklist

### **Pre-Deployment**
- [ ] Code tested locally
- [ ] Dependencies updated
- [ ] Environment variables configured
- [ ] Database migrations ready
- [ ] Backup strategy in place

### **Deployment**
- [ ] Server provisioned
- [ ] Node.js installed
- [ ] Application deployed
- [ ] PM2 configured
- [ ] Nginx setup
- [ ] SSL certificate installed                                                                                                                                                                                                                                                                                                                     
- [ ] Firewall configured
- [ ] Monitoring enabled

### **Post-Deployment**
- [ ] Health check passed
- [ ] Logs reviewed
- [ ] Performance tested
- [ ] Backup verified
- [ ] Documentation updated

---

## 🎯 Quick Commands Reference

```bash
# Start services
pm2 start server.js --name inverseiq
pm2 start scripts/runAIEngine.js --name ai-engine

# Stop services
pm2 stop inverseiq
pm2 stop ai-engine

# Restart services
pm2 restart inverseiq
pm2 restart ai-engine

# View logs
pm2 logs inverseiq
pm2 logs ai-engine

# Monitor
pm2 monit

# Save configuration
pm2 save

# List processes
pm2 list

# Delete process
pm2 delete inverseiq

# Update application
cd /var/www/inverseiq
git pull
npm install
pm2 restart all
```

---

## 🚀 Ready to Deploy!

Your InverseIQ platform is now ready for production deployment. Follow this guide step-by-step to get your trading data collection and signal generation system running smoothly.

**Recommended Starting Point:**
1. Start with DigitalOcean $20/month droplet
2. Follow Steps 1-10 in "Option 1: DigitalOcean"
3. Bootstrap AI with public data
4. Test signal generation
5. Scale as you grow

**Need Help?**
- Check troubleshooting section
- Review logs with `pm2 logs`
- Monitor with `pm2 monit`
- Contact support if needed

---

*Last Updated: November 2024*
