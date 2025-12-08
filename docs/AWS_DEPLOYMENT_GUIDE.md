# AWS Deployment Guide for InverseIQ

## 🎯 Overview

This guide will help you deploy InverseIQ to AWS EC2, protecting your intellectual property while collecting trading data for research purposes.

---

## 🔒 IP Protection & Legal Considerations

### Your Idea is Protected

✅ **What's Protected:**
- Your AI algorithms stay on the server (users can't see the code)
- Pattern detection logic is proprietary
- Signal generation methods are hidden
- Database structure is not exposed
- Only API endpoints are accessible

✅ **Legal Protection:**
- Terms of Service clearly state IP ownership
- Privacy Policy explains data usage ("research purposes")
- Users agree not to reverse engineer
- Your algorithms are trade secrets

✅ **"Research Purposes" is Valid:**
- Common and legitimate reason for data collection
- Academic and commercial research both acceptable
- Clearly disclosed in Terms of Service and Privacy Policy
- Users consent by submitting data

---

## 📋 Prerequisites

Before deploying to AWS, you need:

1. **AWS Account** (Free tier available)
   - Sign up at: https://aws.amazon.com/
   - Credit card required (but free tier is free)

2. **AWS CLI** (Optional but recommended)
   ```bash
   # macOS
   brew install awscli
   
   # Linux
   sudo apt-get install awscli
   
   # Configure
   aws configure
   ```

3. **SSH Client** (Built into macOS/Linux)

4. **Domain Name** (Optional but recommended)
   - Purchase from Namecheap, GoDaddy, etc.
   - Or use AWS Route 53

---

## 🚀 Deployment Options

### Option 1: Automated Deployment (Recommended)

We've created a deployment script that automates most of the process.

```bash
# Make script executable
chmod +x scripts/deployToAWS.sh

# Run deployment script
./scripts/deployToAWS.sh
```

The script will:
1. Check AWS CLI installation
2. Verify AWS credentials
3. Create EC2 instance
4. Configure security groups
5. Deploy your application
6. Start services with PM2

### Option 2: Manual Deployment

Follow the step-by-step instructions below for full control.

---

## 📝 Step-by-Step Manual Deployment

### Step 1: Create EC2 Instance

1. **Go to AWS Console**
   - Navigate to EC2 Dashboard
   - Click "Launch Instance"

2. **Choose AMI (Amazon Machine Image)**
   - Select: **Ubuntu Server 22.04 LTS**
   - Architecture: 64-bit (x86)

3. **Choose Instance Type**
   - Select: **t2.micro** (Free tier eligible)
   - 1 vCPU, 1 GB RAM
   - Sufficient for InverseIQ

4. **Configure Instance**
   - Keep default settings
   - Enable "Auto-assign Public IP"

5. **Add Storage**
   - 8 GB (default) is sufficient
   - Can increase to 30 GB (still free tier)

6. **Configure Security Group**
   - Create new security group: "inverseiq-sg"
   - Add rules:
     ```
     SSH     | TCP | 22   | 0.0.0.0/0 | SSH access
     HTTP    | TCP | 80   | 0.0.0.0/0 | Web traffic
     HTTPS   | TCP | 443  | 0.0.0.0/0 | Secure web
     Custom  | TCP | 3000 | 0.0.0.0/0 | Node.js app
     ```

7. **Create/Select Key Pair**
   - Create new key pair: "inverseiq-key"
   - Download .pem file
   - Save to `~/.ssh/inverseiq-key.pem`
   - Set permissions: `chmod 400 ~/.ssh/inverseiq-key.pem`

8. **Launch Instance**
   - Review and launch
   - Wait for instance to start
   - Note the Public IP address

### Step 2: Connect to Instance

```bash
# Connect via SSH
ssh -i ~/.ssh/inverseiq-key.pem ubuntu@YOUR_PUBLIC_IP

# You should see Ubuntu welcome message
```

### Step 3: Install Dependencies

```bash
# Update system
sudo apt-get update
sudo apt-get upgrade -y

# Install Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify installation
node --version  # Should show v18.x.x
npm --version   # Should show 9.x.x

# Install PM2 (Process Manager)
sudo npm install -g pm2

# Install Git (if needed)
sudo apt-get install -y git

# Install Nginx (for reverse proxy)
sudo apt-get install -y nginx
```

### Step 4: Deploy Application

#### Option A: Upload from Local Machine

```bash
# On your local machine, create deployment package
cd /path/to/trading-data-collection-service
tar -czf inverseiq-deploy.tar.gz \
    --exclude='node_modules' \
    --exclude='.git' \
    --exclude='*.log' \
    --exclude='.DS_Store' \
    .

# Upload to server
scp -i ~/.ssh/inverseiq-key.pem \
    inverseiq-deploy.tar.gz \
    ubuntu@YOUR_PUBLIC_IP:/tmp/

# On server, extract
ssh -i ~/.ssh/inverseiq-key.pem ubuntu@YOUR_PUBLIC_IP
sudo mkdir -p /var/www/inverseiq
sudo chown ubuntu:ubuntu /var/www/inverseiq
cd /var/www/inverseiq
tar -xzf /tmp/inverseiq-deploy.tar.gz
```

#### Option B: Clone from Git Repository

```bash
# On server
sudo mkdir -p /var/www/inverseiq
sudo chown ubuntu:ubuntu /var/www/inverseiq
cd /var/www/inverseiq

# Clone your repository
git clone YOUR_REPO_URL .

# Or if private repo
git clone https://YOUR_TOKEN@github.com/username/repo.git .
```

### Step 5: Configure Application

```bash
cd /var/www/inverseiq

# Install dependencies
npm install --production

# Create required directories
mkdir -p data/submissions data/public output signals

# Create .env file
cat > .env << EOF
NODE_ENV=production
PORT=3000
DATA_DIR=./data
LOG_LEVEL=info
EOF

# Set permissions
chmod 600 .env
```

### Step 6: Start Application

```bash
# Start with PM2
pm2 start server.js --name inverseiq

# Start AI engine
pm2 start scripts/runAIEngine.js --name ai-engine

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
# Copy and run the command it outputs

# Check status
pm2 list
pm2 logs inverseiq
```

### Step 7: Configure Nginx (Optional but Recommended)

```bash
# Create Nginx configuration
sudo nano /etc/nginx/sites-available/inverseiq

# Add this configuration:
```

```nginx
server {
    listen 80;
    server_name YOUR_DOMAIN_OR_IP;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/inverseiq /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

### Step 8: Setup SSL/HTTPS (Recommended)

```bash
# Install Certbot
sudo apt-get install -y certbot python3-certbot-nginx

# Get SSL certificate (requires domain name)
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Certbot will automatically configure Nginx for HTTPS
# Certificates auto-renew
```

### Step 9: Bootstrap AI with Public Data

```bash
cd /var/www/inverseiq

# Run bootstrap script
node scripts/bootstrapHybridAI.js

# This will:
# - Collect 30 days of public market data
# - Analyze patterns
# - Create pattern database
# - Takes 5-10 minutes
```

### Step 10: Setup Automated Tasks

```bash
# Edit crontab
crontab -e

# Add these lines:
```

```cron
# Bootstrap AI daily at 2 AM
0 2 * * * cd /var/www/inverseiq && node scripts/bootstrapHybridAI.js >> /var/log/inverseiq-bootstrap.log 2>&1

# Generate signals every 5 minutes
*/5 * * * * cd /var/www/inverseiq && node scripts/runAIEngine.js >> /var/log/inverseiq-signals.log 2>&1

# Backup database daily at 3 AM
0 3 * * * tar -czf /var/backups/inverseiq-$(date +\%Y\%m\%d).tar.gz /var/www/inverseiq/data/

# Clean old backups (keep 30 days)
0 4 * * * find /var/backups -name "inverseiq-*.tar.gz" -mtime +30 -delete

# Clean old logs (keep 30 days)
0 0 * * 0 find /var/log -name "inverseiq-*.log" -mtime +30 -delete
```

---

## ✅ Verification

### Test Your Deployment

```bash
# Check if services are running
pm2 list

# View logs
pm2 logs inverseiq --lines 50

# Test API
curl http://YOUR_PUBLIC_IP:3000/api/signals

# Test main page
curl http://YOUR_PUBLIC_IP:3000/

# Check Nginx status
sudo systemctl status nginx

# Check SSL certificate (if configured)
sudo certbot certificates
```

### Access Your Platform

- **Main Page:** http://YOUR_PUBLIC_IP:3000 (or https://yourdomain.com)
- **Signals:** http://YOUR_PUBLIC_IP:3000/signals.html
- **Admin:** http://YOUR_PUBLIC_IP:3000/admin.html
- **Terms:** http://YOUR_PUBLIC_IP:3000/terms.html
- **Privacy:** http://YOUR_PUBLIC_IP:3000/privacy.html

---

## 🔒 Security Hardening

### 1. Setup Firewall

```bash
# Enable UFW firewall
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw enable

# Check status
sudo ufw status
```

### 2. Disable Root Login

```bash
# Edit SSH config
sudo nano /etc/ssh/sshd_config

# Change these lines:
PermitRootLogin no
PasswordAuthentication no

# Restart SSH
sudo systemctl restart sshd
```

### 3. Install Fail2Ban

```bash
# Install
sudo apt-get install -y fail2ban

# Configure
sudo cp /etc/fail2ban/jail.conf /etc/fail2ban/jail.local
sudo nano /etc/fail2ban/jail.local

# Enable and start
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

### 4. Setup Automatic Updates

```bash
# Install unattended-upgrades
sudo apt-get install -y unattended-upgrades

# Enable
sudo dpkg-reconfigure -plow unattended-upgrades
```

---

## 📊 Monitoring & Maintenance

### Monitor Services

```bash
# PM2 monitoring
pm2 monit

# View logs
pm2 logs inverseiq
pm2 logs ai-engine

# Check resource usage
htop

# Check disk space
df -h

# Check memory
free -h
```

### Restart Services

```bash
# Restart application
pm2 restart inverseiq

# Restart all services
pm2 restart all

# Restart Nginx
sudo systemctl restart nginx
```

### Update Application

```bash
cd /var/www/inverseiq

# Pull latest code (if using Git)
git pull

# Or upload new version
# scp -i ~/.ssh/inverseiq-key.pem ...

# Install new dependencies
npm install --production

# Restart services
pm2 restart all
```

---

## 💰 Cost Estimation

### AWS Free Tier (First 12 Months)

- **EC2 t2.micro:** 750 hours/month (FREE)
- **Storage:** 30 GB (FREE)
- **Data Transfer:** 15 GB out (FREE)

**Total: $0/month for first year**

### After Free Tier

- **EC2 t2.micro:** ~$8-10/month
- **Storage (30 GB):** ~$3/month
- **Data Transfer:** ~$1-5/month

**Total: ~$12-18/month**

### Recommended Upgrades

- **t2.small** (2 GB RAM): ~$17/month
- **t2.medium** (4 GB RAM): ~$34/month
- **Domain name:** ~$10-15/year
- **SSL certificate:** FREE (Let's Encrypt)

---

## 🆘 Troubleshooting

### Application Won't Start

```bash
# Check logs
pm2 logs inverseiq --lines 100

# Check if port is in use
sudo lsof -i :3000

# Restart services
pm2 restart all
```

### Can't Connect to Server

```bash
# Check security group allows port 3000
# Check if Nginx is running
sudo systemctl status nginx

# Check if application is running
pm2 list
```

### Database Issues

```bash
# Check database file
ls -lh data/hybrid_pattern_database.json

# Backup and recreate
cp data/hybrid_pattern_database.json data/backup.json
node scripts/bootstrapHybridAI.js
```

### High CPU/Memory Usage

```bash
# Check resource usage
htop

# Restart services
pm2 restart all

# Check for memory leaks
pm2 monit
```

---

## 📚 Additional Resources

- **AWS EC2 Documentation:** https://docs.aws.amazon.com/ec2/
- **PM2 Documentation:** https://pm2.keymetrics.io/
- **Nginx Documentation:** https://nginx.org/en/docs/
- **Let's Encrypt:** https://letsencrypt.org/
- **Ubuntu Server Guide:** https://ubuntu.com/server/docs

---

## 🎉 Success!

Your InverseIQ platform is now deployed on AWS with:

✅ Secure server configuration
✅ Automated process management
✅ SSL/HTTPS encryption
✅ Legal protection (Terms & Privacy)
✅ IP protection (algorithms hidden)
✅ Automated backups
✅ Monitoring and logging

**Your research platform is ready to collect trading data!**

---

## 📞 Support

For deployment issues or questions:
1. Check the troubleshooting section
2. Review AWS documentation
3. Check PM2 logs: `pm2 logs`
4. Review system logs: `sudo journalctl -xe`

---

**Last Updated:** December 1, 2025
**Version:** 1.0.0
