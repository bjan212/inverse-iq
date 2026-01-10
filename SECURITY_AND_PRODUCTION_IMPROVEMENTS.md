# Security and Production Improvements Guide

**Date:** January 10, 2026  
**Status:** In Progress  
**Priority:** High

---

## Overview

This document outlines the security vulnerabilities found and the steps to address them, plus production-readiness improvements.

---

## 1. NPM Security Vulnerabilities

### Current Status
- **Initial Vulnerabilities:** 11 (5 moderate, 4 high, 2 critical)
- **After `npm audit fix`:** 8 (5 moderate, 1 high, 2 critical)
- **Reduction:** 3 vulnerabilities fixed ✅

### Remaining Vulnerabilities

#### Critical (2)
1. **form-data <2.5.4**
   - Issue: Uses unsafe random function for boundary
   - Affected: node-telegram-bot-api via @cypress/request-promise
   - Fix: Requires `npm audit fix --force` (breaking change)

#### High (1)
2. **qs <6.14.1**
   - Issue: arrayLimit bypass allows DoS via memory exhaustion
   - Affected: express, body-parser, @cypress/request
   - Fix: Requires `npm audit fix --force` (breaking change)

#### Moderate (5)
3. **nodemailer <=7.0.10**
   - Issues:
     - Email to unintended domain
     - addressparser DoS via recursive calls
     - DoS through uncontrolled recursion
   - Fix: Requires `npm audit fix --force` (breaking change)

4. **tough-cookie <4.1.3**
   - Issue: Prototype Pollution vulnerability
   - Affected: node-telegram-bot-api via request
   - Fix: Requires `npm audit fix --force` (breaking change)

### Recommended Actions

#### Option 1: Force Fix (Recommended for Production)
```bash
npm audit fix --force
```
**Pros:**
- Fixes all vulnerabilities
- Updates to secure versions

**Cons:**
- May introduce breaking changes
- Requires testing after update

**Action Plan:**
1. Create a backup branch
2. Run `npm audit fix --force`
3. Test all functionality
4. Fix any breaking changes
5. Commit and push

#### Option 2: Manual Package Updates
```bash
# Update specific packages
npm install nodemailer@latest
npm install node-telegram-bot-api@latest
npm install express@latest
npm install qs@latest
```

#### Option 3: Accept Risk (Not Recommended)
- Document known vulnerabilities
- Implement additional security measures
- Plan for future updates

---

## 2. Replace MemoryStore with Redis

### Current Issue
```
Warning: connect.session() MemoryStore is not
designed for a production environment, as it will leak
memory, and will not scale past a single process.
```

### Why Redis?
✅ Production-ready  
✅ Persistent storage  
✅ Scales horizontally  
✅ Supports clustering  
✅ Fast performance  
✅ Built-in expiration  

### Implementation Steps

#### Step 1: Install Redis Dependencies
```bash
npm install redis connect-redis
```

#### Step 2: Update server.js

**Current Code (lines ~50-60):**
```javascript
const session = require('express-session');

app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));
```

**New Code with Redis:**
```javascript
const session = require('express-session');
const RedisStore = require('connect-redis').default;
const { createClient } = require('redis');

// Initialize Redis client
const redisClient = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
  socket: {
    reconnectStrategy: (retries) => {
      if (retries > 10) {
        console.error('❌ Redis: Too many reconnection attempts');
        return new Error('Redis reconnection failed');
      }
      return retries * 100; // Exponential backoff
    }
  }
});

redisClient.on('error', (err) => console.error('❌ Redis Client Error:', err));
redisClient.on('connect', () => console.log('✅ Redis Client Connected'));
redisClient.on('ready', () => console.log('✅ Redis Client Ready'));

// Connect to Redis
redisClient.connect().catch(console.error);

// Initialize Redis store
const redisStore = new RedisStore({
  client: redisClient,
  prefix: 'inverseiq:sess:',
  ttl: 86400 // 24 hours in seconds
});

// Configure session with Redis
app.use(session({
  store: redisStore,
  secret: process.env.SESSION_SECRET || 'your-secret-key-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));
```

#### Step 3: Update .env File
```bash
# Add Redis configuration
REDIS_URL=redis://localhost:6379
# For production with password:
# REDIS_URL=redis://:password@hostname:6379
```

#### Step 4: Install and Start Redis

**macOS:**
```bash
brew install redis
brew services start redis
```

**Ubuntu/Debian:**
```bash
sudo apt-get install redis-server
sudo systemctl start redis-server
sudo systemctl enable redis-server
```

**Docker:**
```bash
docker run -d -p 6379:6379 --name redis redis:alpine
```

**Verify Redis is Running:**
```bash
redis-cli ping
# Should return: PONG
```

#### Step 5: Test the Implementation
```bash
# Start the server
node server.js

# Check logs for:
# ✅ Redis Client Connected
# ✅ Redis Client Ready
```

---

## 3. Alternative: MongoDB Session Store

If you prefer MongoDB over Redis:

### Install Dependencies
```bash
npm install connect-mongo
```

### Implementation
```javascript
const session = require('express-session');
const MongoStore = require('connect-mongo');

app.use(session({
  store: MongoStore.create({
    mongoUrl: process.env.MONGODB_URL || 'mongodb://localhost:27017/inverseiq',
    ttl: 24 * 60 * 60, // 24 hours
    autoRemove: 'native',
    touchAfter: 24 * 3600 // Lazy session update
  }),
  secret: process.env.SESSION_SECRET || 'your-secret-key-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000
  }
}));
```

---

## 4. Additional Production Improvements

### 4.1 Environment Variables
Ensure all sensitive data is in environment variables:
```bash
# .env
NODE_ENV=production
SESSION_SECRET=<generate-strong-secret>
REDIS_URL=redis://your-redis-host:6379
ADMIN_USERNAME=<secure-username>
ADMIN_PASSWORD=<hashed-password>
```

### 4.2 Rate Limiting
Already implemented ✅
- Submission limiter: 10 requests per 15 minutes
- Feedback limiter: 20 requests per 15 minutes
- Notification limiter: 5 requests per 15 minutes

### 4.3 HTTPS/SSL
For production, ensure HTTPS is enabled:
```javascript
// In production, use a reverse proxy (nginx) or:
const https = require('https');
const fs = require('fs');

if (process.env.NODE_ENV === 'production') {
  const options = {
    key: fs.readFileSync(process.env.SSL_KEY_PATH),
    cert: fs.readFileSync(process.env.SSL_CERT_PATH)
  };
  
  https.createServer(options, app).listen(443);
}
```

### 4.4 Logging
Implement structured logging:
```bash
npm install winston
```

### 4.5 Monitoring
Consider adding:
- **Sentry** for error tracking
- **New Relic** or **DataDog** for performance monitoring
- **Prometheus** + **Grafana** for metrics

---

## 5. Implementation Priority

### Immediate (Do Now)
1. ✅ Run `npm audit fix` (COMPLETED - reduced from 11 to 8 vulnerabilities)
2. ⏳ Implement Redis session store
3. ⏳ Test with Redis

### Short-term (This Week)
1. ⏳ Run `npm audit fix --force` and test
2. ⏳ Set up Redis in production environment
3. ⏳ Update deployment scripts

### Medium-term (This Month)
1. ⏳ Implement comprehensive logging
2. ⏳ Set up monitoring and alerting
3. ⏳ Security audit and penetration testing

---

## 6. Testing Checklist

After implementing changes:

- [ ] Server starts without errors
- [ ] Sessions persist across server restarts
- [ ] Admin login works correctly
- [ ] All API endpoints functional
- [ ] WebSocket connections stable
- [ ] No memory leaks
- [ ] Performance benchmarks met
- [ ] Security scan passes

---

## 7. Rollback Plan

If issues occur after updates:

1. **Revert to previous commit:**
   ```bash
   git revert HEAD
   git push origin main
   ```

2. **Restore package.json:**
   ```bash
   git checkout HEAD~1 package.json package-lock.json
   npm install
   ```

3. **Switch back to MemoryStore temporarily:**
   - Comment out Redis configuration
   - Uncomment original session configuration

---

## 8. Documentation Updates Needed

After implementation:
- [ ] Update README.md with Redis setup instructions
- [ ] Update deployment guides
- [ ] Update environment variable documentation
- [ ] Create Redis backup/restore procedures

---

## Conclusion

**Current Status:**
- ✅ 3 vulnerabilities fixed (11 → 8)
- ⏳ Redis implementation pending
- ⏳ 8 remaining vulnerabilities need force fix

**Next Steps:**
1. Implement Redis session store
2. Test thoroughly
3. Run `npm audit fix --force`
4. Re-test all functionality
5. Deploy to staging
6. Monitor for issues
7. Deploy to production

**Estimated Time:**
- Redis implementation: 1-2 hours
- Testing: 2-3 hours
- Force fix and re-testing: 2-3 hours
- **Total: 5-8 hours**

---

**Last Updated:** January 10, 2026  
**Next Review:** After Redis implementation
