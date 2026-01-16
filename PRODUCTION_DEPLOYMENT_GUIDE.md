# 🚀 Production Deployment Guide - Step by Step

Follow these commands exactly to deploy the notification page to your DigitalOcean server.

---

## Step 1: Connect to Your Server

Open a **new terminal window** and run:

```bash
ssh inverseiq@146.190.233.46
```

**Expected:** You'll be prompted for your password. Enter it.

---

## Step 2: Navigate to Application Directory

Once connected, run:

```bash
cd /home/inverseiq/trading-data-collection-service
```

**Expected:** You should now be in the application directory.

---

## Step 3: Check Current Status

```bash
pwd
```

**Expected output:** `/home/inverseiq/trading-data-collection-service`

---

## Step 4: Pull Latest Code from GitHub

```bash
git pull origin main
```

**Expected output:**
```
remote: Enumerating objects...
Updating 6f37551..aa1c316
Fast-forward
 DEPLOYMENT_INSTRUCTIONS.md           | 300 +++++++++++++++++++
 NOTIFICATION_PAGE_TEST_REPORT.md     | 229 ++++++++++++++
 public/notifications.html            | 614 +++++++++++++++++++++++++++++++++++
 scripts/deployNotificationPage.sh    | 100 ++++++
 scripts/deployViaGit.sh              |  35 +++
 5 files changed, 1278 insertions(+)
```

---

## Step 5: Verify Files Were Updated

```bash
ls -la public/notifications.html
```

**Expected:** You should see the file with recent timestamp.

---

## Step 6: Restart Application

```bash
pm2 restart inverseiq
```

**Expected output:**
```
[PM2] Applying action restartProcessId on app [inverseiq](ids: [ 0 ])
[PM2] [inverseiq](0) ✓
```

---

## Step 7: Check Application Status

```bash
pm2 status
```

**Expected:** Status should show "online" in green.

---

## Step 8: Test Page Accessibility (On Server)

```bash
curl -I http://localhost:3000/notifications.html
```

**Expected output:**
```
HTTP/1.1 200 OK
Content-Type: text/html
...
```

---

## Step 9: Test API Endpoint (On Server)

```bash
curl -X POST http://localhost:3000/api/notifications/subscribe \
  -H "Content-Type: application/json" \
  -d '{"email":"production-test@example.com","preferences":{"symbols":["BTCUSDT"],"minConfidence":70,"notificationMethods":["email"]}}'
```

**Expected:** JSON response with success or subscriber data.

---

## Step 10: View Application Logs

```bash
pm2 logs inverseiq --lines 20
```

**Expected:** Recent log entries showing the application is running.

---

## Step 11: Exit Server

```bash
exit
```

---

## Step 12: Test from Your Browser

Open your browser and visit:

**Via IP:**
```
http://146.190.233.46/notifications.html
```

**Via Domain (if configured):**
```
https://yourdomain.com/notifications.html
```

---

## Step 13: Test Form Submission

1. Fill out the notification form
2. Enter a test email
3. Select trading pairs
4. Adjust confidence slider
5. Click "Subscribe to Notifications"
6. Verify success message appears

---

## Verification Checklist

After completing all steps, verify:

- [ ] SSH connection successful
- [ ] Git pull completed without errors
- [ ] PM2 restart successful
- [ ] Application status shows "online"
- [ ] Page returns HTTP 200
- [ ] API endpoint responds correctly
- [ ] Page loads in browser
- [ ] Form submission works
- [ ] Success message displays
- [ ] Data saves to database

---

## Troubleshooting

### Issue: Git pull fails

**Solution:**
```bash
# Check git status
git status

# If there are conflicts, stash local changes
git stash

# Try pull again
git pull origin main
```

### Issue: PM2 restart fails

**Solution:**
```bash
# Check PM2 status
pm2 status

# If not running, start it
pm2 start server.js --name inverseiq

# Save PM2 configuration
pm2 save
```

### Issue: Page returns 404

**Solution:**
```bash
# Verify file exists
ls -la public/notifications.html

# Check Nginx configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

### Issue: API not responding

**Solution:**
```bash
# Check application logs
pm2 logs inverseiq --lines 50

# Check if port 3000 is listening
netstat -tulpn | grep 3000

# Restart application
pm2 restart inverseiq
```

---

## Quick Commands Reference

```bash
# Connect to server
ssh inverseiq@146.190.233.46

# Navigate to app
cd /home/inverseiq/trading-data-collection-service

# Pull latest code
git pull origin main

# Restart app
pm2 restart inverseiq

# Check status
pm2 status

# View logs
pm2 logs inverseiq

# Test page
curl -I http://localhost:3000/notifications.html
```

---

## After Successful Deployment

1. ✅ Notification page is live
2. ✅ Users can subscribe to notifications
3. ✅ Data is being saved to database
4. ✅ API endpoints are functional

**Next Steps:**
- Configure email/Telegram notifications in `.env`
- Add link to notification page from signals page
- Monitor subscriber growth
- Set up automated backups

---

**Need Help?**

If you encounter any issues during deployment:
1. Check the logs: `pm2 logs inverseiq`
2. Verify file permissions: `ls -la public/`
3. Test API directly: `curl http://localhost:3000/api/health`
4. Restart services: `pm2 restart inverseiq && sudo systemctl restart nginx`

---

**Deployment Status:** Ready to Execute ✅
