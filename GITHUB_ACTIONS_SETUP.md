# GitHub Actions Setup Guide

## 🚀 Automatic Deployment to DigitalOcean

Your repository is now configured for automatic deployment. Every time you push to the `main` branch, GitHub Actions will automatically deploy to your DigitalOcean server.

---

## 🔐 Step 1: Add GitHub Secrets

You need to add these secrets to your GitHub repository:

### Go to GitHub Settings:
1. Visit: https://github.com/bjan212/inverse-iq/settings/secrets/actions
2. Click **"New repository secret"**

### Add These Secrets:

#### **DO_HOST**
- **Name**: `DO_HOST`
- **Value**: `146.190.233.46`

#### **DO_USERNAME**
- **Name**: `DO_USERNAME`
- **Value**: `inverseiq`

#### **DO_PASSWORD**
- **Name**: `DO_PASSWORD`
- **Value**: Your DigitalOcean server password
- ⚠️ **Security**: Never share this password or commit it to Git

---

## ✅ Step 2: Verify Setup

After adding the secrets, test the deployment:

### Option 1: Push Code
```bash
cd /Users/redabhaj/Desktop/xrypt.net\(final\)/trading-data-collection-service
git add .
git commit -m "Update configuration"
git push origin main
```

### Option 2: Manual Trigger
1. Go to: https://github.com/bjan212/inverse-iq/actions
2. Click "Deploy to DigitalOcean"
3. Click "Run workflow"
4. Select "main" branch
5. Click "Run workflow"

---

## 📊 Step 3: Monitor Deployment

### View Deployment Status:
1. Visit: https://github.com/bjan212/inverse-iq/actions
2. Click on the latest workflow run
3. Watch the deployment progress in real-time

### Successful Deployment Shows:
```
🚀 Starting deployment...
📥 Pulling latest code from GitHub...
📦 Installing dependencies...
🔄 Restarting application...
✅ Deployment complete!
```

---

## 🔄 How It Works

```
┌─────────────────────────────────────────────────────────────┐
│  1. Developer pushes code to main branch                    │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│  2. GitHub Actions workflow is triggered                    │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│  3. GitHub runner connects to DigitalOcean via SSH          │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│  4. Server pulls latest code from GitHub                    │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│  5. Dependencies are installed (npm install)                │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│  6. PM2 restarts the application                            │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│  7. Deployment complete! ✅                                  │
└─────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Troubleshooting

### Deployment Failed?

**Check GitHub Actions Logs:**
1. Go to: https://github.com/bjan212/inverse-iq/actions
2. Click on the failed workflow
3. Expand the "Deploy to DigitalOcean" step
4. Review the error message

**Common Issues:**

#### 1. **SSH Connection Failed**
```
Error: connection refused
```
**Solution:** Check DO_HOST and DO_USERNAME secrets are correct

#### 2. **Authentication Failed**
```
Error: permission denied
```
**Solution:** Verify DO_PASSWORD secret is correct

#### 3. **Git Pull Failed**
```
Error: Your local changes would be overwritten
```
**Solution:** The workflow runs `git stash` first to handle this

#### 4. **PM2 Restart Failed**
```
Error: process not found
```
**Solution:** Check process name is "inverseiq" in PM2

---

## 🔒 Security Best Practices

### ✅ **DO:**
- Use GitHub Secrets for sensitive data
- Rotate passwords regularly
- Limit SSH access to specific IPs (optional)
- Review deployment logs regularly

### ❌ **DON'T:**
- Commit passwords to Git
- Share GitHub secrets
- Use weak passwords
- Ignore failed deployments

---

## 📝 Workflow Configuration

The workflow file is located at:
```
.github/workflows/deploy.yml
```

### Triggers:
- ✅ Push to `main` branch (automatic)
- ✅ Manual workflow dispatch (via GitHub UI)

### Steps:
1. Checkout code from repository
2. SSH into DigitalOcean server
3. Navigate to `/opt/trading-data-collection-service`
4. Stash local changes (if any)
5. Pull latest code from GitHub
6. Install dependencies
7. Restart PM2 process
8. Show deployment status

---

## 🎯 Next Steps

### 1. **Add Secrets** (Required)
   - DO_HOST
   - DO_USERNAME
   - DO_PASSWORD

### 2. **Test Deployment**
   - Make a small change
   - Push to main branch
   - Watch GitHub Actions

### 3. **Monitor Application**
   - Check server logs: `ssh inverseiq@146.190.233.46 "pm2 logs"`
   - Test API: `curl http://146.190.233.46:3000/api/health`

---

## 📊 Deployment History

View all deployments:
- **GitHub Actions**: https://github.com/bjan212/inverse-iq/actions
- **Deployment URL**: http://146.190.233.46:3000

---

## 🆘 Need Help?

**Check Logs:**
```bash
# GitHub Actions logs
# Visit: https://github.com/bjan212/inverse-iq/actions

# Server logs
ssh inverseiq@146.190.233.46 "pm2 logs inverseiq --lines 50"

# Nginx logs
ssh inverseiq@146.190.233.46 "sudo tail -f /var/log/nginx/error.log"
```

**Manual Deployment:**
```bash
ssh inverseiq@146.190.233.46
cd /opt/trading-data-collection-service
git pull origin main
npm install --production
pm2 restart inverseiq
```

---

**🎉 You're all set! Your application will now deploy automatically on every push to main.**
