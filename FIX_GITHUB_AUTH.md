# Fix GitHub Authentication on DigitalOcean Server

## Problem
GitHub no longer accepts password authentication. You're getting:
```
remote: Invalid username or token. Password authentication is not supported for Git operations.
```

## Solution Options

### Option 1: Switch to SSH (Recommended - Most Secure)

**On your DigitalOcean server:**

```bash
# 1. Check if you have an SSH key
ls -la ~/.ssh/

# 2. If no SSH key exists, generate one
ssh-keygen -t ed25519 -C "inverseiq@server"
# Press Enter for all prompts (use default location, no passphrase)

# 3. Display your public key
cat ~/.ssh/id_ed25519.pub
# Copy the entire output
```


**On GitHub:**

1. Go to https://github.com/settings/keys
2. Click "New SSH key"
3. Title: "InverseIQ DigitalOcean Server"
4. Paste your public key
5. Click "Add SSH key"

**Back on your server:**

```bash
# 4. Change remote URL from HTTPS to SSH
cd /home/inverseiq/trading-data-collection-service
git remote set-url origin git@github.com:bjan212/inverse-iq.git

# 5. Test SSH connection
ssh -T git@github.com
# Should see: "Hi bjan212! You've successfully authenticated..."

# 6. Now pull works!
git pull origin main
```

---

### Option 2: Use Personal Access Token (PAT)

**On GitHub:**

1. Go to https://github.com/settings/tokens
2. Click "Generate new token" → "Generate new token (classic)"
3. Note: "InverseIQ Server Access"
4. Expiration: Choose duration (90 days, 1 year, or no expiration)
5. Select scopes: Check "repo" (full control of private repositories)
6. Click "Generate token"
7. **IMPORTANT:** Copy the token immediately (you won't see it again!)

**On your server:**

```bash
# Use the token as your password when pulling
cd /home/inverseiq/trading-data-collection-service
git pull origin main

# When prompted:
# Username: bjan212
# Password: [paste your token here, not your GitHub password]
```

**To avoid entering token every time:**

```bash
# Store credentials (token will be saved)
git config --global credential.helper store

# Next time you pull, enter token once and it will be remembered
git pull origin main
```

---

### Option 3: Quick Fix - Manual File Upload

If you need to deploy immediately while fixing auth:

**On your local machine:**

```bash
# Create a tarball of just the updated files
cd /Users/redabhaj/Desktop/xrypt.net\(final\)/trading-data-collection-service
tar -czf notification-update.tar.gz public/notifications.html scripts/testDropdownFeature.js

# Upload to server
scp notification-update.tar.gz inverseiq@146.190.233.46:~/

# SSH into server
ssh inverseiq@146.190.233.46

# Extract files
cd /home/inverseiq/trading-data-collection-service
tar -xzf ~/notification-update.tar.gz

# Restart application
pm2 restart inverseiq

# Clean up
rm ~/notification-update.tar.gz
```

---

## Recommended Approach

**I recommend Option 1 (SSH)** because:
- ✅ Most secure
- ✅ No passwords or tokens to manage
- ✅ Works seamlessly once set up
- ✅ Industry standard

---

## After Fixing Authentication

Once authentication is working, deploy with:

```bash
cd /home/inverseiq/trading-data-collection-service
git pull origin main
pm2 restart inverseiq
```

Then test:
```bash
curl -I http://localhost:3000/notifications.html
```

---

## Verification

After deployment, verify the dropdown is working:

```bash
# Check if file exists
ls -la public/notifications.html

# Check if dropdown code is present
grep -c "additionalPairs" public/notifications.html
# Should return a number > 0

# Test the page
curl http://localhost:3000/notifications.html | grep -o "DOGEUSDT" | wc -l
# Should return 1 (dropdown option exists)
```

---

## Need Help?

If you encounter issues:

1. **SSH key not working:**
   ```bash
   # Check SSH agent
   eval "$(ssh-agent -s)"
   ssh-add ~/.ssh/id_ed25519
   ```

2. **Permission denied:**
   ```bash
   # Check key permissions
   chmod 600 ~/.ssh/id_ed25519
   chmod 644 ~/.ssh/id_ed25519.pub
   ```

3. **Still can't pull:**
   - Verify the SSH key is added to GitHub
   - Check remote URL: `git remote -v`
   - Should show: `git@github.com:bjan212/inverse-iq.git`

---

## Quick Reference

```bash
# Check current remote URL
git remote -v

# Change to SSH
git remote set-url origin git@github.com:bjan212/inverse-iq.git

# Change to HTTPS (with token)
git remote set-url origin https://github.com/bjan212/inverse-iq.git

# Test connection
ssh -T git@github.com  # For SSH
git ls-remote origin   # For HTTPS with token
