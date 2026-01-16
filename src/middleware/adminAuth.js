// Secure admin authentication middleware using express-session and bcrypt
// Adds Redis-backed session storage for production reliability.
const session = require('express-session');
const bcrypt = require('bcrypt');
const { RedisStore } = require('connect-redis');
const { createClient } = require('redis');

const ADMIN_USER = process.env.ADMIN_USER;
const ADMIN_PASS_HASH = process.env.ADMIN_PASS_HASH || '';
const ADMIN_PASS = process.env.ADMIN_PASS || '';
const SESSION_SECRET = process.env.SESSION_SECRET;
const REDIS_URL = process.env.REDIS_URL;
const ADMIN_IP_WHITELIST = (process.env.ADMIN_IP_WHITELIST || '')
  .split(',')
  .map(ip => ip.trim())
  .filter(Boolean);

const USE_SECURE_COOKIES = process.env.FORCE_SECURE_COOKIES === 'true' || process.env.NODE_ENV === 'production';

const normalizeIp = (ip) => (ip || '').replace('::ffff:', '');

const logRedisEvent = (event, details = '') => {
  const message = details ? `${event} - ${details}` : event;
  console.info(`[redis-session] ${message}`);
};

function validateAdminConfig() {
  const missing = [];
  if (!ADMIN_USER) missing.push('ADMIN_USER');
  if (!ADMIN_PASS_HASH && !ADMIN_PASS) missing.push('ADMIN_PASS_HASH or ADMIN_PASS');
  if (!SESSION_SECRET) missing.push('SESSION_SECRET');

  if (missing.length > 0) {
    const msg = `Missing required admin auth configuration: ${missing.join(', ')}`;
    if (process.env.NODE_ENV === 'production') {
      throw new Error(msg);
    } else {
      console.warn(msg);
    }
  }
}

let redisClient;
let redisStore;

function buildSessionStore() {
  validateAdminConfig();

  if (!REDIS_URL) {
    console.warn('⚠️  REDIS_URL not set – falling back to in-memory session store (not recommended for production).');
    return undefined; // MemoryStore
  }

  redisClient = createClient({ url: REDIS_URL });
  redisClient.on('connect', () => logRedisEvent('connect'));
  redisClient.on('ready', () => logRedisEvent('ready'));
  redisClient.on('end', () => logRedisEvent('end'));
  redisClient.on('reconnecting', () => logRedisEvent('reconnecting'));
  redisClient.on('error', (err) => console.error('Redis session client error:', err.message));

  // Connect asynchronously; failures will keep MemoryStore fallback from blocking startup
  redisClient.connect().catch((err) => {
    console.error('Failed to connect to Redis for sessions:', err.message);
  });

  redisStore = new RedisStore({ 
    client: redisClient, 
    prefix: 'sess:' 
  });
  return redisStore;
}

function setupSession(app) {
  const store = buildSessionStore();

  app.use(session({
    store,
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    rolling: true,
    proxy: true,
    name: 'xrypt.admin.sid',
    cookie: {
      httpOnly: true,
      secure: USE_SECURE_COOKIES,
      sameSite: 'lax',
      maxAge: 1000 * 60 * 60 * 4 // 4 hours
    }
  }));
}

function requireAdminLogin(req, res, next) {
  if (req.session && req.session.isAdmin) {
    return next();
  }
  res.redirect('/admin-login');
}

function isValidPassword(password) {
  if (!password) return false;

  // Prefer hashed secret when available
  if (ADMIN_PASS_HASH) {
    try {
      if (bcrypt.compareSync(password, ADMIN_PASS_HASH)) {
        return true;
      }
    } catch (err) {
      console.error('Invalid ADMIN_PASS_HASH:', err.message);
    }
  }

  // Fallback to plaintext secret (useful for quick setups)
  if (ADMIN_PASS) {
    return password === ADMIN_PASS;
  }

  return false;
}

function handleAdminLogin(req, res) {
  const { username, password } = req.body || {};
  const clientIp = normalizeIp(req.ip || req.connection?.remoteAddress);

  if (username === ADMIN_USER && isValidPassword(password)) {
    req.session.isAdmin = true;
    console.info(`[admin-login] success for user=${username} ip=${clientIp || 'unknown'}`);
    return res.redirect('/admin.html');
  }

  console.warn(`[admin-login] failed for user=${username || 'missing'} ip=${clientIp || 'unknown'}`);
  res.status(401).send('Invalid credentials');
}

function handleAdminLogout(req, res) {
  req.session.destroy(() => {
    console.info(`[admin-logout] user logged out ip=${normalizeIp(req.ip || req.connection?.remoteAddress) || 'unknown'}`);
    res.redirect('/admin-login');
  });
}

function enforceAdminIpWhitelist(req, res, next) {
  if (ADMIN_IP_WHITELIST.length === 0) {
    return next();
  }

  const clientIp = normalizeIp(req.ip || req.connection?.remoteAddress);

  if (ADMIN_IP_WHITELIST.includes(clientIp)) {
    return next();
  }

  console.warn(`[admin-ip] blocked request from ${clientIp || 'unknown'}`);
  return res.status(403).send('Access denied');
}

module.exports = { setupSession, requireAdminLogin, handleAdminLogin, handleAdminLogout, enforceAdminIpWhitelist };
