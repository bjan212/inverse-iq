# 🚀 GitHub to DigitalOcean Deployment Guide

## Quick Deployment (One Command)

To commit all changes to GitHub and deploy to DigitalOcean in one go:

```bash
./scripts/deploy-to-digitalocean.sh
```

This script will:
1. ✅ Add all changes to git
2. ✅ Commit with your message
3. ✅ Push to GitHub
4. ✅ SSH into DigitalOcean
5. ✅ Pull latest changes
6. ✅ Install dependencies
7. ✅ Restart the application

---

## Manual Deployment Steps

### Step 1: Update GitHub

```bash
# Add all changes
git add -A

# Commit changes
git commit -m "Your commit message here"

# Push to GitHub
git push origin main
```

### Step 2: Deploy to DigitalOcean

```bash
# SSH into your server
ssh inverseiq@YOUR_SERVER_IP

# Navigate to project directory
cd ~/xrypt-service

# Pull latest changes
git pull origin main

# Install dependencies
npm install --production

# Restart application
pm2 restart xrypt

# Check status
pm2 status

# View logs
pm2 logs xrypt
```

---

## First Time Setup on DigitalOcean

If you haven't set up the project on DigitalOcean yet:

### 1. SSH into your server

```bash
ssh inverseiq@YOUR_SERVER_IP
```

### 2. Clone the repository

```bash
# Install git if not already installed
sudo apt update
sudo apt install -y git

# Clone your repository
cd ~
git clone https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git xrypt-service
cd xrypt-service
```

### 3. Install Node.js and dependencies

```bash
# Install Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install PM2 globally
sudo npm install -g pm2

# Install project dependencies
npm install --production
```

### 4. Configure environment variables

```bash
# Create .env file
nano .env
```

Add your configuration:

```env
PORT=3000
NODE_ENV=production

# Email Configuration
EMAIL_HOST=smtp.protonmail.ch
EMAIL_PORT=587
EMAIL_USER=notify@xrypt.net
EMAIL_PASS=your-protonmail-password
EMAIL_FROM=XryptNotifications <notify@xrypt.net>

# Telegram Configuration (optional)
TELEGRAM_BOT_TOKEN=your-telegram-bot-token
TELEGRAM_CHAT_ID=your-telegram-chat-id

# Admin Configuration
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your-secure-password
```

Save with `Ctrl+X`, `Y`, `Enter`

### 5. Start the application

```bash
# Start with PM2
pm2 start server.js --name xrypt

# Save PM2 configuration
pm2 save

# Set PM2 to start on boot
pm2 startup
# Follow the command it gives you (usually starts with sudo)

# Check status
pm2 status
```

### 6. Configure Nginx (optional but recommended)

```bash
# Install Nginx
sudo apt install -y nginx

# Create Nginx configuration
sudo nano /etc/nginx/sites-available/xrypt
```

Add this configuration:

```nginx
server {
    listen 80;
    server_name YOUR_DOMAIN_OR_IP;

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
}
```

Enable the site:

```bash
# Create symbolic link
sudo ln -s /etc/nginx/sites-available/xrypt /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

---

## Troubleshooting

### Git Authentication Issues

If you get authentication errors when pulling from GitHub:

```bash
# Generate SSH key on server
ssh-keygen -t ed25519 -C "your_email@example.com"

# Display public key
cat ~/.ssh/id_ed25519.pub

# Copy the output and add it to GitHub:
# GitHub → Settings → SSH and GPG keys → New SSH key
```

Then update your git remote to use SSH:

```bash
cd ~/xrypt-service
git remote set-url origin git@github.com:YOUR_USERNAME/YOUR_REPO_NAME.git
```

### Application Not Starting

```bash
# Check logs
pm2 logs xrypt --lines 50

# Check if port is in use
sudo lsof -i :3000

# Restart application
pm2 restart xrypt

# If needed, delete and restart
pm2 delete xrypt
pm2 start server.js --name xrypt
pm2 save
```

### Permission Issues

```bash
# Fix ownership
sudo chown -R inverseiq:inverseiq ~/xrypt-service

# Fix permissions
chmod -R 755 ~/xrypt-service
```

### Nginx Issues

```bash
# Check Nginx status
sudo systemctl status nginx

# Test configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx

# View error logs
sudo tail -f /var/log/nginx/error.log
```

---

## Useful Commands

### On Your Local Machine

```bash
# Quick deploy
./scripts/deploy-to-digitalocean.sh

# Check git status
git status

# View commit history
git log --oneline -10

# Create a new branch
git checkout -b feature-name
```

### On DigitalOcean Server

```bash
# View application logs
pm2 logs xrypt

# Monitor resources
pm2 monit

# Restart application
pm2 restart xrypt

# Stop application
pm2 stop xrypt

# View PM2 status
pm2 status

# Check disk space
df -h

# Check memory usage
free -h

# Check running processes
ps aux | grep node
```

---

## Automated Deployment with GitHub Actions (Optional)

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to DigitalOcean

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
    - name: Deploy to DigitalOcean
      uses: appleboy/ssh-action@master
      with:
        host: ${{ secrets.DO_HOST }}
        username: ${{ secrets.DO_USERNAME }}
        key: ${{ secrets.DO_SSH_KEY }}
        script: |
          cd ~/xrypt-service
          git pull origin main
          npm install --production
          pm2 restart xrypt
```

Add secrets in GitHub:
- `DO_HOST`: Your server IP
- `DO_USERNAME`: SSH username (inverseiq)
- `DO_SSH_KEY`: Your private SSH key

---

## Security Checklist

- [ ] Change default admin password in .env
- [ ] Set up firewall (UFW)
- [ ] Configure SSL with Let's Encrypt
- [ ] Keep system updated
- [ ] Use strong passwords
- [ ] Enable fail2ban
- [ ] Regular backups

---

## Quick Reference

| Task | Command |
|------|---------|
| Deploy everything | `./scripts/deploy-to-digitalocean.sh` |
| Push to GitHub | `git push origin main` |
| SSH to server | `ssh inverseiq@YOUR_IP` |
| Pull changes | `cd ~/xrypt-service && git pull` |
| Restart app | `pm2 restart xrypt` |
| View logs | `pm2 logs xrypt` |
| Check status | `pm2 status` |

---

## Support

For more detailed guides, see:
- `DEPLOY_TO_EXISTING_DIGITALOCEAN.md`
- `PRODUCTION_DEPLOYMENT_GUIDE.md`
- `QUICK_START_GUIDE.md`

---

**Happy Deploying! 🚀**
