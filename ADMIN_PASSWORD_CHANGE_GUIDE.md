# Admin Password Change Guide

## Common Issues & Solutions

### Issue: "Invalid credentials" even after changing password

**Most Common Cause:** Server not restarted after .env change

**Solution:**
1. Stop your server (Ctrl+C in terminal)
2. Restart your server:
   ```bash
   npm start
   # or
   pm2 restart all
   # or
   node server.js
   ```

### How to Change Admin Password

#### Option 1: Using Plaintext Password (Quick Setup)

1. Open your `.env` file
2. Add or update this line:
   ```
   ADMIN_PASS=YourNewPassword123!
   ```
3. Make sure `ADMIN_USER` is also set:
   ```
   ADMIN_USER=admin
   ```
4. **IMPORTANT:** Restart your server
5. Try logging in with the new password

#### Option 2: Using Hashed Password (Production Recommended)

1. Generate a password hash:
   ```bash
   node scripts/generateAdminPassword.js YourNewPassword123!
   ```

2. Copy the hash from the output

3. Open your `.env` file and add:
   ```
   ADMIN_PASS_HASH=<paste-the-hash-here>
   ```

4. Remove or comment out `ADMIN_PASS` if it exists:
   ```
   # ADMIN_PASS=oldpassword
   ```

5. **IMPORTANT:** Restart your server

6. Try logging in with the new password

### Troubleshooting Checklist

- [ ] Did you restart the server after changing .env?
- [ ] Is `ADMIN_USER` set in .env? (default: admin)
- [ ] Is either `ADMIN_PASS` or `ADMIN_PASS_HASH` set?
- [ ] Are there any typos in the .env file?
- [ ] Are you using the correct username when logging in?
- [ ] Is `SESSION_SECRET` set in .env?

### Example .env Configuration

```env
# Admin Authentication
ADMIN_USER=admin
ADMIN_PASS=MySecurePassword123!
SESSION_SECRET=your-random-secret-key-here

# Or use hashed password instead:
# ADMIN_PASS_HASH=$2b$10$...your-hash-here...
```

### Testing Your Setup

1. Stop your server
2. Start your server with logging:
   ```bash
   NODE_ENV=development node server.js
   ```
3. Try to login at `/admin-login`
4. Check the console logs for any error messages

### Still Having Issues?

Check the server logs for these messages:
- `[admin-login] success` - Login worked
- `[admin-login] failed` - Wrong credentials
- `Missing required admin auth configuration` - .env not configured properly

## Security Notes

- Never commit your `.env` file to git
- Use `ADMIN_PASS_HASH` in production, not `ADMIN_PASS`
- Change the default password immediately
- Use a strong password with letters, numbers, and special characters
