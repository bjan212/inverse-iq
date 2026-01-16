# 🚀 Deployment Quick Reference

## Two-Step Deployment Process

### Step 1: Push to GitHub
```bash
./scripts/quick-push-to-github.sh "Your commit message"
```

### Step 2: Pull on DigitalOcean
```bash
./scripts/pull-on-digitalocean.sh YOUR_SERVER_IP
```

---

## Alternative: One-Line Commands

### Push to GitHub (Manual)
```bash
git add -A && git commit -m "Update" && git push origin main
```

### Deploy to DigitalOcean (Manual)
```bash
ssh inverseiq@YOUR_SERVER_IP 'cd ~/xrypt-service && git pull && npm install --production && pm2 restart xrypt'
```

---

## Complete Workflow

### Option 1: Using Scripts (Recommended)

```bash
# 1. Push all changes to GitHub
./scripts/quick-push-to-github.sh "Added new features"

# 2. Deploy to DigitalOcean
./scripts/pull-on-digitalocean.sh YOUR_SERVER_IP
```

### Option 2: Manual Commands

```bash
# 1. Add and commit changes
git add -A
git commit -m "Your commit message"
git push origin main

# 2. SSH into server and update
ssh inverseiq@YOUR_SERVER_IP
cd ~/xrypt-service
git pull origin main
npm install --production
pm2 restart xrypt
pm2 logs xrypt
exit
```

### Option 3: Interactive Script

```bash
# This will guide you through the entire process
./scripts/deploy-to-digitalocean.sh
```

---

## Quick Commands Reference

| Task | Command |
|------|---------|
| **Push to GitHub** | `./scripts/quick-push-to-github.sh "message"` |
| **Deploy to DO** | `./scripts/pull-on-digitalocean.sh IP` |
| **Check status** | `ssh inverseiq@IP 'pm2 status'` |
| **View logs** | `ssh inverseiq@IP 'pm2 logs xrypt'` |
| **Restart app** | `ssh inverseiq@IP 'pm2 restart xrypt'` |

---

## Troubleshooting

### If GitHub push fails:
```bash
# Check git status
git status

# Check remote
git remote -v

# Try pushing again
git push origin main
```

### If DigitalOcean deployment fails:
```bash
# SSH into server manually
ssh inverseiq@YOUR_SERVER_IP

# Navigate to project
cd ~/xrypt-service

# Check git status
git status

# Pull changes
git pull origin main

# Install dependencies
npm install --production

# Restart application
pm2 restart xrypt

# Check logs
pm2 logs xrypt --lines 50
```

### If application won't start:
```bash
# SSH into server
ssh inverseiq@YOUR_SERVER_IP

# Check PM2 status
pm2 status

# View detailed logs
pm2 logs xrypt --lines 100

# Delete and restart
pm2 delete xrypt
pm2 start ~/xrypt-service/server.js --name xrypt
pm2 save
```

---

## First Time Setup Checklist

If you haven't deployed to DigitalOcean yet:

- [ ] Create DigitalOcean droplet
- [ ] SSH into server: `ssh root@YOUR_SERVER_IP`
- [ ] Install Node.js: `curl -fsSL https://deb.nodesource.com/setup_18.x | bash - && apt install -y nodejs`
- [ ] Install PM2: `npm install -g pm2`
- [ ] Clone repository: `git clone YOUR_REPO_URL ~/xrypt-service`
- [ ] Install dependencies: `cd ~/xrypt-service && npm install --production`
- [ ] Create .env file: `nano ~/xrypt-service/.env`
- [ ] Start application: `pm2 start server.js --name xrypt && pm2 save`
- [ ] Setup PM2 startup: `pm2 startup` (follow instructions)

See `DEPLOY_TO_EXISTING_DIGITALOCEAN.md` for detailed setup instructions.

---

## Environment Variables (.env)

Make sure your DigitalOcean server has these configured:

```env
PORT=3000
NODE_ENV=production

# Email Configuration
EMAIL_HOST=smtp.protonmail.ch
EMAIL_PORT=587
EMAIL_USER=notify@xrypt.net
EMAIL_PASS=your-password
EMAIL_FROM=XryptNotifications <notify@xrypt.net>

# Telegram (optional)
TELEGRAM_BOT_TOKEN=your-token
TELEGRAM_CHAT_ID=your-chat-id

# Admin
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your-secure-password
```

---

## Monitoring Commands

```bash
# View real-time logs
ssh inverseiq@YOUR_SERVER_IP 'pm2 logs xrypt'

# Monitor resources
ssh inverseiq@YOUR_SERVER_IP 'pm2 monit'

# Check application status
ssh inverseiq@YOUR_SERVER_IP 'pm2 status'

# Check server resources
ssh inverseiq@YOUR_SERVER_IP 'free -h && df -h'
```

---

## Backup Before Deployment

```bash
# Backup data files before deploying
ssh inverseiq@YOUR_SERVER_IP 'cd ~/xrypt-service && tar -czf backup-$(date +%Y%m%d).tar.gz data/'
```

---

## Rolling Back

If something goes wrong:

```bash
# SSH into server
ssh inverseiq@YOUR_SERVER_IP

# Navigate to project
cd ~/xrypt-service

# View commit history
git log --oneline -10

# Rollback to previous commit
git reset --hard COMMIT_HASH

# Restart application
pm2 restart xrypt
```

---

## Support Files

- **Detailed Guide**: `GITHUB_TO_DIGITALOCEAN_DEPLOYMENT.md`
- **First Time Setup**: `DEPLOY_TO_EXISTING_DIGITALOCEAN.md`
- **Production Guide**: `PRODUCTION_DEPLOYMENT_GUIDE.md`
- **Quick Start**: `QUICK_START_GUIDE.md`

---

## Need Help?

1. Check the logs: `pm2 logs xrypt`
2. Review the detailed guides listed above
3. Verify your .env configuration
4. Check GitHub repository access
5. Ensure SSH keys are properly configured

---

**Remember**: Always test locally before deploying to production!
