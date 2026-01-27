1234567Zidefmg
# Notification Page Deployment Instructions

## Quick Deployment Guide

The notification registration page has been created and is ready for deployment to your DigitalOcean server.

---

## Option 1: Automated Deployment (Recommended)

Since your code is already on GitHub, the easiest method is to pull the latest changes on your server.

### Steps:

1. **SSH into your DigitalOcean server:**
   ```bash
   ssh inverseiq@146.190.233.46
   ```

2. **Navigate to your application directory:**
   ```bash
   cd /home/inverseiq/trading-data-collection-service

   ```

3. **Pull the latest code from GitHub:**
   ```bash
   git pull origin main
   ```

4. **Restart the application:**
   ```bash
   pm2 restart inverseiq
   ```

5. **Verify deployment:**
   ```bash
   curl http://localhost:3000/notifications.html
   ```

---

## Option 2: Using the Deployment Script

We've created an automated deployment script that handles everything:

### From your local machine:

```bash
# Make script executable
chmod +x scripts/deployViaGit.sh

# Run deployment
bash scripts/deployViaGit.sh
```

This script will:
- Connect to your server
- Pull latest code from GitHub
- Restart the application
- Verify deployment

---

## Option 3: Manual File Upload

If you prefer to upload just the notification page file:

### Using SCP:

```bash
# From your local machine
scp public/notifications.html inverseiq@146.190.233.46:/home/inverseiq/trading-data-collection-service/public/
```

### Then restart the application on the server:

```bash
ssh inverseiq@146.190.233.46 "pm2 restart inverseiq"
```

---

## Verification Steps

After deployment, verify the page is accessible:

### 1. Check from server:
```bash
ssh inverseiq@146.190.233.46
curl http://localhost:3000/notifications.html
```

### 2. Check from browser:
- **Via IP:** `http://146.190.233.46/notifications.html`
- **Via Domain (if configured):** `https://yourdomain.com/notifications.html`

### 3. Test the API integration:
```bash
curl -X POST http://146.190.233.46/api/notifications/subscribe \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "preferences": {
      "symbols": ["BTCUSDT"],
      "minConfidence": 70,
      "notificationMethods": ["email"]
    }
  }'
```

---

## Troubleshooting

### Issue: Page returns 404

**Solution:**
```bash
# SSH into server
ssh inverseiq@146.190.233.46

# Check if file exists
ls -la /home/inverseiq/trading-data-collection-service/public/notifications.html

# If missing, pull from GitHub
cd /home/inverseiq/trading-data-collection-service
git pull origin main

# Restart application
pm2 restart inverseiq
```

### Issue: Application not responding

**Solution:**
```bash
# Check application status
pm2 status

# View logs
pm2 logs inverseiq

# Restart if needed
pm2 restart inverseiq
```

### Issue: Nginx not serving the page

**Solution:**
```bash
# Check Nginx status
sudo systemctl status nginx

# Test Nginx configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

---

## Post-Deployment Checklist

- [ ] Page accessible via browser
- [ ] Form loads correctly
- [ ] Email validation works
- [ ] Trading pair selection works
- [ ] Confidence slider functions
- [ ] Form submission successful
- [ ] Success/error messages display
- [ ] API integration working
- [ ] Database storing subscribers

---

## Monitoring

### View Application Logs:
```bash
ssh inverseiq@146.190.233.46 "pm2 logs inverseiq --lines 50"
```

### Monitor Real-time:
```bash
ssh inverseiq@146.190.233.46 "pm2 monit"
```

### Check Subscriber Count:
```bash
curl http://146.190.233.46/api/notifications/stats
```

---

## Updating the Page

When you make changes to the notification page:

1. **Commit changes locally:**
   ```bash
   git add public/notifications.html
   git commit -m "Update notification page"
   git push origin main
   ```

2. **Deploy to server:**
   ```bash
   ssh inverseiq@146.190.233.46 "cd /home/inverseiq/trading-data-collection-service && git pull origin main && pm2 restart inverseiq"
   ```

---

## Server Information

- **Server IP:** 146.190.233.46
- **Username:** inverseiq
- **App Directory:** /home/inverseiq/trading-data-collection-service
- **App Name (PM2):** inverseiq
- **Port:** 3000 (internal), 80/443 (external via Nginx)

---

## Access URLs

### Development (Local):
- http://localhost:8000/notifications.html

### Production (DigitalOcean):
- **Via IP:** http://146.190.233.46/notifications.html
- **Via Domain:** https://yourdomain.com/notifications.html (if configured)

---

## Support

If you encounter issues:

1. Check application logs: `pm2 logs inverseiq`
2. Check Nginx logs: `sudo tail -f /var/log/nginx/error.log`
3. Verify file exists on server
4. Ensure PM2 is running: `pm2 status`
5. Test API endpoint directly: `curl http://localhost:3000/api/notifications/subscribe`

---

## Security Notes

- Always use HTTPS in production (configure SSL with Certbot)
- Keep your server updated: `sudo apt update && sudo apt upgrade`
- Monitor failed login attempts
- Regular backups of subscriber database
- Use strong passwords for server access

---

## Next Steps

1. ✅ Deploy notification page to server
2. ✅ Verify page is accessible
3. ✅ Test form submission
4. Configure email/Telegram notifications in `.env`
5. Add link to notification page from signals page
6. Monitor subscriber growth
7. Set up automated backups

---

**Deployment Status:** Ready for Production ✅
